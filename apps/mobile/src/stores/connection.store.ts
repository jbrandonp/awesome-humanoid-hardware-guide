// @ts-ignore
import { create } from 'zustand';

export type ConnectionStatus =
  | 'INITIALIZING'
  | 'SEARCHING_SERVER'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'OFFLINE_MODE'
  | 'MANUAL_FALLBACK';

interface ConnectionState {
  status: ConnectionStatus;
  serverUrl: string | null;
  errorMessage: string | null;

  setStatus: (status: ConnectionStatus) => void;
  setServerUrl: (url: string) => void;
  setError: (msg: string | null) => void;
  enableOfflineMode: () => void;
  enableManualFallback: () => void;
}

export const useConnectionStore = create<ConnectionState>((set: any) => ({
  status: 'INITIALIZING',
  serverUrl: null,
  errorMessage: null,

  setStatus: (status: ConnectionStatus) => set({ status }),
  setServerUrl: (url: string) => set({ serverUrl: url, status: 'CONNECTED', errorMessage: null }),
  setError: (msg: string | null) => set({ errorMessage: msg }),

  enableOfflineMode: () => set({
    status: 'OFFLINE_MODE',
    serverUrl: null,
    errorMessage: 'Réseau local inaccessible. Mode Hors-Ligne activé (WatermelonDB).'
  }),

  enableManualFallback: () => set({
    status: 'MANUAL_FALLBACK',
    errorMessage: 'Découverte automatique échouée. Veuillez saisir l\'IP manuellement.'
  }),
}));
