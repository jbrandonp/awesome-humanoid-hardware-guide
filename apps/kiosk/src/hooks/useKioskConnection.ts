import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export interface KioskState {
  currentPatient: Patient | null;
  lastCalledPatients: Patient[];
}

export function useKioskConnection(serverUrl: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [kioskState, setKioskState] = useState<KioskState>({ currentPatient: null, lastCalledPatients: [] });
  const reconnectAttempt = useRef(0);
  const maxDelay = 30000;

  useEffect(() => {
    // Initialiser le socket
    const socketInstance = io(serverUrl, {
      reconnection: false, // On gère la reconnexion manuellement pour l'exponential backoff personnalisé (bien que socket.io le fasse, l'exercice demande de l'implémenter explicitement ou de s'en assurer)
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  useEffect(() => {
    if (!socket) return;

    let reconnectTimer: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;

    const connect = () => {
      if (!socket.connected) {
         socket.connect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectAttempt.current += 1;
      // Exponential backoff: 1s, 2s, 4s, 8s... capped at maxDelay
      const delay = Math.min(Math.pow(2, reconnectAttempt.current - 1) * 1000, maxDelay);
      console.log(`[Kiosk] Tentative de reconnexion dans ${delay}ms (Tentative ${reconnectAttempt.current})`);
      reconnectTimer = setTimeout(connect, delay);
    };

    const startHeartbeat = () => {
      // Ping toutes les 5 secondes pour détecter les déconnexions fantômes
      heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.volatile.emit('ping', Date.now());
        }
      }, 5000);
    };

    socket.on('connect', () => {
      console.log('[Kiosk] Connecté au serveur');
      setIsConnected(true);
      reconnectAttempt.current = 0; // Reset
      socket.emit('REQUEST_CURRENT_STATE');
      startHeartbeat();
    });

    socket.on('disconnect', (reason: string) => {
      console.warn(`[Kiosk] Déconnecté (${reason})`);
      setIsConnected(false);
      clearInterval(heartbeatInterval);
      if (reason === 'io server disconnect') {
        // La déconnexion a été initiée par le serveur, on doit se reconnecter manuellement
        scheduleReconnect();
      } else {
        // La connexion a été perdue, socket.io essaiera de se reconnecter, mais vu qu'on a mis reconnection: false, on gère
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error(`[Kiosk] Erreur de connexion:`, error);
      scheduleReconnect();
    });

    socket.on('pong', (timestamp: number) => {
      // Le serveur a répondu au heartbeat
      // console.debug(`[Kiosk] Latence: ${Date.now() - timestamp}ms`);
    });

    socket.on('CURRENT_STATE', (state: KioskState) => {
      console.log('[Kiosk] État reçu:', state);
      setKioskState(state);
    });
    
    socket.on('PATIENT_CALLED', () => {
       // Demander une mise à jour dès qu'on nous notifie qu'un patient a été appelé
       socket.emit('REQUEST_CURRENT_STATE');
    });

    // Initial connection
    connect();

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(heartbeatInterval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('pong');
      socket.off('CURRENT_STATE');
      socket.off('PATIENT_CALLED');
    };
  }, [socket]);

  return { isConnected, kioskState };
}
