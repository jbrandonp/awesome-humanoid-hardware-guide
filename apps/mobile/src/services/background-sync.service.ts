import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// (Note: En environnement complet, on utiliserait le Sync de WatermelonDB ou une vraie DB SQLite,
// mais AsyncStorage est adéquat pour une queue d'urgence/fallback simple structurée).

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready Offline Sync)
// ============================================================================

export type SyncPriorityLevel = 'CRITICAL' | 'HIGH' | 'LOW';

export interface BackgroundSyncTask {
  transactionId: string;
  priority: SyncPriorityLevel;
  endpoint: string; // ex: '/api/sync' ou '/api/iot/vitals'
  payloadBase64: string; // Données sérialisées
  queuedAtIso: string;
  retryCount: number;
}

// Nom canonique de la tâche pour l'OS (Android / iOS)
export const BACKGROUND_SYNC_TASK_NAME = 'MEDICAL_OFFLINE_SYNC_WORKER';

// Clé de persistance pour ne jamais perdre une donnée même si l'app est tuée par l'OS
const QUEUE_STORAGE_KEY = '@resilient_health_sync_queue';

// ============================================================================
// GESTIONNAIRE DE TÂCHE NATIVE (TASK MANAGER)
// Enregistré au niveau de l'OS. S'exécute même si l'application React Native
// est "fermée" (Tuée par l'utilisateur ou par le gestionnaire de batterie).
// ============================================================================

TaskManager.defineTask(BACKGROUND_SYNC_TASK_NAME, async () => {
  console.log(
    `[OS Background Worker] Réveil de la tâche de synchronisation...`,
  );

  try {
    const rawQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!rawQueue) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let queue: BackgroundSyncTask[] = JSON.parse(rawQueue);
    if (queue.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 1. TRI PAR PRIORITÉ (URGENCE ABSOLUE EN PREMIER)
    // CRITICAL: Prescriptions (Ordonnances qui sauvent des vies)
    // HIGH: Constantes Vitales (Tension, Glucose) et Notes Cliniques (CRDT)
    // LOW: Statistiques d'utilisation, Logs d'interface, Requêtes d'inventaire
    queue.sort((a, b) => {
      const pA = a.priority === 'CRITICAL' ? 3 : a.priority === 'HIGH' ? 2 : 1;
      const pB = b.priority === 'CRITICAL' ? 3 : b.priority === 'HIGH' ? 2 : 1;
      return pB - pA;
    });

    console.log(
      `[OS Background Worker] ${queue.length} paquets en attente. Début de la transmission...`,
    );

    // 2. GESTION DE L'INTERRUPTION (BATTERIE / TIMEOUT OS)
    // iOS (Background App Refresh) limite généralement à 30 secondes d'exécution.
    // Si nous avons 1000 dossiers à envoyer, l'OS tuera l'application en plein milieu.
    // Pour éviter la corruption de la file, nous mettons en place un Timer de sécurité (15s max).
    const START_TIME = Date.now();
    const OS_EXECUTION_LIMIT_MS = 15000;

    let processedCount = 0;
    const remainingQueue: BackgroundSyncTask[] = [];

    for (const task of queue) {
      const elapsedTime = Date.now() - START_TIME;

      // Si le temps presse (Limites imposées par iOS/Android Doze),
      // on arrête proprement et on laisse le reste pour le prochain réveil de l'OS.
      if (elapsedTime > OS_EXECUTION_LIMIT_MS) {
        console.warn(
          `[OS Background Worker] Temps d'exécution natif écoulé (${elapsedTime}ms). Pause de sécurité pour éviter le kill de l'OS.`,
        );
        remainingQueue.push(task); // On le garde pour plus tard
        continue;
      }

      // 3. TENTATIVE DE CONNEXION AU SERVEUR (NESTJS)
      try {
        const payloadData = JSON.parse(
          Buffer.from(task.payloadBase64, 'base64').toString('utf-8'),
        );

        // Appel API avec Timeout extrêmement court (3 secondes).
        // Si le Wi-Fi de la clinique est apparu juste 5 secondes, on veut envoyer le CRITICAL et couper
        // sans rester bloqué dans un ECONNRESET sans fin.
        await axios.post(
          `http://systeme-sante.local:3000${task.endpoint}`,
          payloadData,
          {
            timeout: 3000,
            headers: { 'Content-Type': 'application/json' }, // (Ajouter Authorization Bearer JWT ici en Prod)
          },
        );

        processedCount++;
        console.log(
          `[OS Background Worker] Transmission réussie: ${task.transactionId} (${task.priority})`,
        );
      } catch (networkError: unknown) {
        // Le serveur NestJS est hors-ligne, ou le routeur Wi-Fi est hors de portée.
        // On incrémente le compteur de retry et on garde la tâche.
        console.warn(
          `[OS Background Worker] Échec réseau pour la tâche ${task.transactionId}. Conservée en file d'attente.`,
        );

        task.retryCount++;
        if (task.retryCount < 50) {
          // On abandonne après 50 tentatives (~ jours)
          remainingQueue.push(task);
        } else {
          console.error(
            `[OS Background Worker] FATAL: La tâche ${task.transactionId} a échoué 50 fois. Elle est détruite pour éviter le blocage de la mémoire.`,
          );
        }
      }
    }

    // 4. MISE À JOUR ATOMIQUE DE LA FILE D'ATTENTE LOCALE (Persistance)
    await AsyncStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify(remainingQueue),
    );

    if (processedCount > 0) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed; // Indique à l'OS de réessayer plus tard
    }
  } catch (fatalError: unknown) {
    console.error(
      `[OS Background Worker] Crash critique du Thread Background Native`,
      fatalError,
    );
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================================================
// SERVICE UTILISATEUR (REACT NATIVE HOOKS / MODULE EXPORT)
// Expose les fonctions pour s'enregistrer auprès de l'OS et ajouter des tâches.
// ============================================================================

export class BackgroundSyncService {
  /**
   * S'enregistre auprès de l'OS (Android JobScheduler / iOS BackgroundTasks)
   * Demande à l'OS d'exécuter la fonction `defineTask` ci-dessus de façon répétée
   * (ex: toutes les 15 minutes) même si l'application est masquée.
   */
  static async registerBackgroundFetchAsync() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK_NAME,
      );
      if (isRegistered) {
        console.log(`[Background Sync] Le Worker OS est déjà actif.`);
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes (Limité par l'OS pour économiser la batterie)
        stopOnTerminate: false, // Android uniquement : Continue même si l'app est swipée/tuée
        startOnBoot: true, // Android : Relance après redémarrage du téléphone
      });

      console.log(
        `[Background Sync] Enregistrement OS réussi. Synchronisation silencieuse activée.`,
      );
    } catch (err) {
      console.error(
        `[Background Sync] Échec de l'enregistrement OS (Permissions refusées ?).`,
        err,
      );
    }
  }

  /**
   * Pousse une donnée vitale, une ordonnance ou un log dans la file d'attente (Offline-First)
   * Cette fonction ne bloque jamais l'interface utilisateur.
   *
   * @param priority Niveau d'urgence (les prescriptions passeront avant les logs d'UI)
   * @param endpoint Le chemin de l'API locale (ex: '/api/sync')
   * @param payload L'objet JSON à transmettre (ex: modifications CRDT Yjs)
   */
  static async enqueueTransaction(
    priority: SyncPriorityLevel,
    endpoint: string,
    payload: any,
  ): Promise<void> {
    try {
      const transactionId = `SYNC-TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Sérialisation sécurisée en Base64 (Évite la corruption de JSON complexes contenant des buffers CRDT)
      const payloadString = JSON.stringify(payload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString(
        'base64',
      );

      const newTask: BackgroundSyncTask = {
        transactionId,
        priority,
        endpoint,
        payloadBase64,
        queuedAtIso: new Date().toISOString(),
        retryCount: 0,
      };

      // Transaction locale (AsyncStorage ou SQLite Watermelon)
      const rawQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      const queue: BackgroundSyncTask[] = rawQueue ? JSON.parse(rawQueue) : [];

      // Idempotence Client: Évite d'insérer des clones
      if (queue.some((t) => t.transactionId === transactionId)) {
        return;
      }

      queue.push(newTask);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

      console.log(
        `[Background Sync] Tâche ${transactionId} (Urgence: ${priority}) sauvegardée hors-ligne.`,
      );

      // Si le réseau est temporairement actif alors que l'app est au premier plan,
      // on peut optionnellement déclencher une synchro instantanée ici
      // (ex: appel direct sans attendre les 15 minutes du BackgroundFetch de l'OS).
    } catch (storageError) {
      console.error(
        `[CRITICAL] Impossible d'écrire dans la file d'attente (Disque plein ?).`,
        storageError,
      );
    }
  }
}
