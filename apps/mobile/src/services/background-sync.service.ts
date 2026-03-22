// Dans ce projet monorepo Nx, le moteur CRDT est défini côté backend dans :
// apps/api/src/app/sync/sync.service.ts (où Yjs fusionne les conflits de note de santé).

import * as Y from 'yjs';

/**
 * Service utilitaire simulant le comportement de la file d'attente (Background Sync)
 * Il met en priorité les données vitales (Vitals, Prescriptions)
 * par rapport aux données moins critiques (Logs, Notes étendues).
 */
export class BackgroundSyncQueue {
  private queue: any[] = [];

  enqueueTransaction(payload: any, isVitalData: boolean = false) {
    // Idempotence : si un UUID transactionnel est déjà là, on évite le doublon
    const existingIndex = this.queue.findIndex(item => item.transactionId === payload.transactionId);
    if (existingIndex > -1) {
       return; // Doublon écarté
    }

    if (isVitalData) {
       // Priorité haute, inséré au début
       this.queue.unshift(payload);
    } else {
       // Priorité basse, inséré à la fin
       this.queue.push(payload);
    }
  }

  dequeueNextTransaction() {
    return this.queue.shift();
  }
}
