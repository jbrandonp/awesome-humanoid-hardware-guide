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
   * SCAN mDNS (LAN)
   * Recherche le backend NestJS diffusant le service '_medical-api._tcp.local'.
   */
  static async discoverServer(): Promise<MDNSDiscoveryResult> {
    const store = useConnectionStore.getState();
    store.setStatus('SEARCHING_SERVER');
    store.setError(null);

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutSecs = 5;

      // Timer de Fallback (Si le routeur bloque le multicast mDNS ou que le serveur est éteint)
      const scanTimeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.zeroconf.stop();
          store.enableManualFallback();
          reject(new Error(`Timeout de ${timeoutSecs}s atteint lors du scan mDNS.`));
        }
      }, timeoutSecs * 1000);

      // Écoute de l'événement de résolution de service (IP + Port obtenus)
      this.zeroconf.on('resolved', (service) => {
        if (isResolved) return;

        // On vérifie le type de service pour ignorer les imprimantes et les Apple TV
        if (service.type === 'medical-api' && service.addresses.length > 0) {
           isResolved = true;
           clearTimeout(scanTimeout);
           this.zeroconf.stop();

           const ip = service.addresses[0];
           const port = service.port;
           const fullUrl = `http://${ip}:${port}`;

           resolve({
             ip,
             port,
             fullUrl
           });
        }
      });

      // Erreurs natives (Permissions réseau manquantes sur iOS/Android)
      this.zeroconf.on('error', (err) => {
        if (!isResolved) {
           isResolved = true;
           clearTimeout(scanTimeout);
           this.zeroconf.stop();
           console.error('[mDNS Scanner] Erreur ZeroConf native:', err);
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
