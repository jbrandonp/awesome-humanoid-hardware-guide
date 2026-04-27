import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { MDNSScannerService } from './mdns-scanner.service';
import { useConnectionStore } from '../stores/connection.store';

// Mock axios
vi.mock('axios');

// Mock react-native-zeroconf
vi.mock('react-native-zeroconf', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        scan: vi.fn(),
        stop: vi.fn(),
        on: vi.fn(),
        removeDeviceListeners: vi.fn(),
        removeAllListeners: vi.fn(),
      };
    }),
  };
});

// Create a local store state for full control during tests
let mockStoreState = {
  status: 'INITIALIZING',
  serverUrl: null,
  errorMessage: null,
};

// Mock useConnectionStore properly to simulate a real Zustand store loosely
vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
      setState: vi.fn(),
    },
  };
});

describe('MDNSScannerService', () => {
  const mockServerUrl = 'http://192.168.1.10:3333';
  let mockSetStatus: any;
  let mockSetError: any;
  let mockSetServerUrl: any;
  let mockEnableManualFallback: any;
  let mockEnableOfflineMode: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset our mock state
    mockStoreState = {
      status: 'INITIALIZING',
      serverUrl: null,
      errorMessage: null,
    };

    // Initialize mock functions
    mockSetStatus = vi.fn((status) => { mockStoreState.status = status; });
    mockSetError = vi.fn((err) => { mockStoreState.errorMessage = err; });
    mockSetServerUrl = vi.fn((url) => { mockStoreState.serverUrl = url; });
    mockEnableManualFallback = vi.fn(() => {
      mockStoreState.status = 'MANUAL_FALLBACK';
      mockStoreState.errorMessage = "Découverte automatique échouée. Veuillez saisir l'IP manuellement.";
    });
    mockEnableOfflineMode = vi.fn(() => {
      mockStoreState.status = 'OFFLINE_MODE';
      mockStoreState.errorMessage = 'Réseau local inaccessible. Mode Hors-Ligne activé';
    });

    // Wire up the mock store
    vi.mocked(useConnectionStore.getState).mockImplementation(() => ({
      ...mockStoreState,
      setStatus: mockSetStatus,
      setError: mockSetError,
      setServerUrl: mockSetServerUrl,
      enableManualFallback: mockEnableManualFallback,
      enableOfflineMode: mockEnableOfflineMode,
    }));
  });

  describe('verifyServerHealth', () => {
    it('should return true and set server URL when health check is successful', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { status: 'ok', databaseConnected: true, version: '1.0.0' },
      });

      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

      expect(mockSetStatus).toHaveBeenCalledWith('CONNECTING');
      expect(mockSetServerUrl).toHaveBeenCalledWith(mockServerUrl);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return false and set error when database is not connected', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { status: 'ok', databaseConnected: false, version: '1.0.0' },
      });

      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      expect(result).toBe(false);
      expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

      expect(mockSetStatus).toHaveBeenCalledWith('CONNECTING');
      expect(mockSetError).toHaveBeenCalledWith("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
      expect(mockSetServerUrl).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should return false and set error state on network error (e.g. timeout)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockError = new Error('timeout of 3000ms exceeded');
      (mockError as any).code = 'ECONNABORTED';

      vi.mocked(axios.get).mockRejectedValueOnce(mockError);

      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Health Check] Échec du test de connectivité:'),
        expect.any(Error)
      );

      expect(mockSetStatus).toHaveBeenCalledWith('CONNECTING');
      expect(mockSetError).toHaveBeenCalledWith("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
      expect(mockSetServerUrl).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should return false and set error state on 500 status code', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockError = new Error('Request failed with status code 500');
      (mockError as any).response = { status: 500 };

      vi.mocked(axios.get).mockRejectedValueOnce(mockError);

      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Health Check] Échec du test de connectivité:'),
        expect.any(Error)
      );

      expect(mockSetStatus).toHaveBeenCalledWith('CONNECTING');
      expect(mockSetError).toHaveBeenCalledWith("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
      expect(mockSetServerUrl).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('discoverServer', () => {
    it('should resolve with server details when mDNS discovers a medical-api service', async () => {
      const zeroconfInstance = (MDNSScannerService as any).zeroconf;
      zeroconfInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'resolved') {
          setTimeout(() => {
            callback({
              type: 'medical-api',
              addresses: ['192.168.1.10'],
              port: 3333
            });
          }, 0);
        }
      });

      const result = await MDNSScannerService.discoverServer();

      expect(result).toEqual({
        ip: '192.168.1.10',
        port: 3333,
        fullUrl: 'http://192.168.1.10:3333'
      });

      expect(mockSetStatus).toHaveBeenCalledWith('SEARCHING_SERVER');
      expect(zeroconfInstance.scan).toHaveBeenCalledWith('medical-api', 'tcp', 'local.');
      expect(zeroconfInstance.stop).toHaveBeenCalled();
      expect(zeroconfInstance.removeAllListeners).toHaveBeenCalledWith('resolved');
      expect(zeroconfInstance.removeAllListeners).toHaveBeenCalledWith('error');
    });

    it('should not crash and ignore malformed service payloads', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.useFakeTimers();

      const zeroconfInstance = (MDNSScannerService as any).zeroconf;
      zeroconfInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'resolved') {
          setTimeout(() => {
            callback({ type: 'medical-api' }); // Missing addresses
            callback(null); // Null service
            callback({ type: 'medical-api', addresses: 'not-an-array' }); // Invalid addresses
          }, 0);
        }
      });

      const promise = MDNSScannerService.discoverServer();

      vi.runAllTimers(); // Advance all timers to trigger the 8s timeout

      await expect(promise).rejects.toThrow('Timeout de 8s atteint lors du scan mDNS.');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[mDNS Scanner] Payload service ignoré'), { type: 'medical-api' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[mDNS Scanner] Payload service ignoré'), null);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[mDNS Scanner] Payload service ignoré'), { type: 'medical-api', addresses: 'not-an-array' });

      consoleWarnSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should reject and enable manual fallback when mDNS times out', async () => {
      vi.useFakeTimers();

      const zeroconfInstance = (MDNSScannerService as any).zeroconf;
      zeroconfInstance.on.mockImplementation(() => {});

      const promise = MDNSScannerService.discoverServer();

      vi.advanceTimersByTime(8000);

      await expect(promise).rejects.toThrow('Timeout de 8s atteint lors du scan mDNS.');

      expect(mockEnableManualFallback).toHaveBeenCalled();
      expect(mockStoreState.status).toBe('MANUAL_FALLBACK');
      expect(mockStoreState.errorMessage).toBe("Découverte automatique échouée. Veuillez saisir l'IP manuellement.");
      expect(zeroconfInstance.stop).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should reject and enable manual fallback when zeroconf emits an error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const zeroconfInstance = (MDNSScannerService as any).zeroconf;

      zeroconfInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          setTimeout(() => {
            callback(new Error('Permission denied'));
          }, 0);
        }
      });

      const promise = MDNSScannerService.discoverServer();

      await expect(promise).rejects.toThrow('Erreur du scanner réseau: Error: Permission denied');

      expect(mockEnableManualFallback).toHaveBeenCalled();
      expect(mockStoreState.status).toBe('MANUAL_FALLBACK');
      expect(zeroconfInstance.stop).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('bootstrapConnection', () => {
    it('should discover and verify server health successfully', async () => {
      const discoverSpy = vi.spyOn(MDNSScannerService, 'discoverServer').mockResolvedValueOnce({
        ip: '192.168.1.10',
        port: 3333,
        fullUrl: 'http://192.168.1.10:3333'
      });
      const verifySpy = vi.spyOn(MDNSScannerService, 'verifyServerHealth').mockResolvedValueOnce(true);

      await MDNSScannerService.bootstrapConnection();

      expect(discoverSpy).toHaveBeenCalled();
      expect(verifySpy).toHaveBeenCalledWith('http://192.168.1.10:3333');

      discoverSpy.mockRestore();
      verifySpy.mockRestore();
    });

    it('should enable offline mode if server is discovered but health check fails', async () => {
      const discoverSpy = vi.spyOn(MDNSScannerService, 'discoverServer').mockResolvedValueOnce({
        ip: '192.168.1.10',
        port: 3333,
        fullUrl: 'http://192.168.1.10:3333'
      });
      const verifySpy = vi.spyOn(MDNSScannerService, 'verifyServerHealth').mockResolvedValueOnce(false);

      await MDNSScannerService.bootstrapConnection();

      expect(discoverSpy).toHaveBeenCalled();
      expect(verifySpy).toHaveBeenCalledWith('http://192.168.1.10:3333');

      expect(mockEnableOfflineMode).toHaveBeenCalled();
      expect(mockStoreState.status).toBe('OFFLINE_MODE');
      expect(mockStoreState.errorMessage).toContain('Réseau local inaccessible');

      discoverSpy.mockRestore();
      verifySpy.mockRestore();
    });

    it('should catch discovery error without crashing (handled by store state)', async () => {
      const discoverSpy = vi.spyOn(MDNSScannerService, 'discoverServer').mockRejectedValueOnce(new Error('Timeout'));
      const verifySpy = vi.spyOn(MDNSScannerService, 'verifyServerHealth');

      await MDNSScannerService.bootstrapConnection();

      expect(discoverSpy).toHaveBeenCalled();
      expect(verifySpy).not.toHaveBeenCalled();

      discoverSpy.mockRestore();
      verifySpy.mockRestore();
    });
  });
});
