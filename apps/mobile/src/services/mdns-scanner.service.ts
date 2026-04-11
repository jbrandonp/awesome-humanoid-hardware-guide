import axios from 'axios';
import { useConnectionStore } from '../stores/connection.store';
import Zeroconf from 'react-native-zeroconf'; // Utilisation d'une librairie native RN pour le mDNS

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (mDNS & Health Check)
// ============================================================================

export interface MDNSDiscoveryResult {
  ip: string;
  port: number;
  fullUrl: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  databaseConnected: boolean;
  version: string;
}

export class MDNSScannerService {
  private static zeroconf = new Zeroconf();

  /**
   * Nettoyage centralisé des écouteurs d'événements Zeroconf.
   */
  private static cleanup() {
    this.zeroconf.stop();
    this.zeroconf.removeAllListeners('resolved');
    this.zeroconf.removeAllListeners('error');
    this.zeroconf.removeAllListeners('found');
    this.zeroconf.removeAllListeners('update');
  }

  /**
   * SCAN mDNS (LAN)
   * Recherche le backend NestJS diffusant le service '_medical-api._tcp.local'.
   */
  static async discoverServer(): Promise<MDNSDiscoveryResult> {
    const store = useConnectionStore.getState();
    store.setStatus('SEARCHING_SERVER');
    store.setError(null);

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutSecs = 8; // Augmenté à 8s pour plus de fiabilité sur Wi-Fi instable

      this.cleanup(); // Nettoyage préventif

      // Timer de Fallback
      const scanTimeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.cleanup();
          store.enableManualFallback();
          reject(new Error(`Timeout de ${timeoutSecs}s atteint lors du scan mDNS.`));
        }
      }, timeoutSecs * 1000);

      // Écoute de l'événement de résolution de service (IP + Port obtenus)
      this.zeroconf.on('resolved', (service: any) => {
        if (isResolved) return;

        // Guard clause contre les payloads malformés
        if (!service || !Array.isArray(service.addresses) || service.addresses.length === 0) {
          console.warn('[mDNS Scanner] Payload service ignoré (malformé ou sans IP):', service);
          return;
        }

        // On vérifie le type de service (Guard contre name undefined)
        const hasMedicalName = service.name && service.name.includes('medical-api');
        const hasMedicalType = service.type && service.type.includes('medical-api');

        if (hasMedicalName || hasMedicalType) {
           isResolved = true;
           clearTimeout(scanTimeout);
           this.cleanup();

           // Bug Fix: Préférer IPv4 (format X.X.X.X) sur IPv6 pour la compatibilité NestJS/Axios par défaut
           const ipv4 = service.addresses.find((addr: string) => addr.includes('.') && !addr.includes(':'));
           const ip = ipv4 || service.addresses[0];
           
           const port = service.port || 3000;
           // En local résilient, on tente HTTP car le certificat auto-signé HTTPS 
           // peut bloquer les requêtes mobiles sans configuration SSL complexe.
           const fullUrl = `http://${ip}:${port}`;

           console.log(`[mDNS Scanner] Serveur local détecté: ${fullUrl}`);
           resolve({ ip, port, fullUrl });
        }
      });

      // Erreurs natives
      this.zeroconf.on('error', (err: Error | string) => {
        if (!isResolved) {
           isResolved = true;
           clearTimeout(scanTimeout);
           this.cleanup();
           console.error('[mDNS Scanner] Erreur ZeroConf native:', err);
           store.enableManualFallback();
           reject(new Error(`Erreur du scanner réseau: ${err}`));
        }
      });

      // Lancement effectif du scan
      this.zeroconf.scan('medical-api', 'tcp', 'local.');
    });
  }

  /**
   * HEALTH CHECK ACTIF
   * Vérifie que le serveur répond ET que sa base de données est branchée (Postgres).
   */
  static async verifyServerHealth(serverUrl: string): Promise<boolean> {
    const store = useConnectionStore.getState();
    store.setStatus('CONNECTING');

    try {
      // Endpoint /api/health du serveur NestJS avec un timeout agressif (3 secondes)
      const response = await axios.get<HealthCheckResponse>(`${serverUrl}/api/health`, {
        timeout: 3000
      });

      if (response.data.status === 'ok' && response.data.databaseConnected) {
         store.setServerUrl(serverUrl); // Active l'application en mode "Connecté"
         return true;
      } else {
         throw new Error('Le serveur a répondu, mais la base de données (PostgreSQL/Watermelon) est en erreur critique.');
      }
    } catch (error: unknown) {
      console.warn(`[Health Check] Échec du test de connectivité:`, error);
      // On n'active PAS le serverUrl. On propose soit le fallback manuel (si fausse IP) soit le Offline pur.
      store.setError("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
      return false;
    }
  }

  /**
   * FLUX COMPLET BOOTSTRAP: Découverte -> Ping -> Fallback (Offline)
   * Appelée au démarrage de l'application (App.tsx / useEffect)
   */
  static async bootstrapConnection() {
    try {
      const discovery = await this.discoverServer();
      const isHealthy = await this.verifyServerHealth(discovery.fullUrl);

      if (!isHealthy) {
         // L'IP a été trouvée par mDNS (le routeur marche) mais NestJS crashe ou la BDD est morte.
         useConnectionStore.getState().enableOfflineMode();
      }
    } catch (scanError) {
      // Timeout : Le serveur n'a pas été trouvé. Le store est déjà en MANAUL_FALLBACK ou OFFLINE.
    }
  }
}
