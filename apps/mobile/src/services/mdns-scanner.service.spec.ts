import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      };
    }),
  };
});

// Mock useConnectionStore correctly
vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
      setState: vi.fn(),
    },
  };
});

// Mock console.warn and console.error to avoid cluttering test output
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = vi.fn();
  console.error = vi.fn();

  // Setup default state for the store mock before each test
  vi.mocked(useConnectionStore.getState).mockReturnValue({
    status: 'INITIALIZING',
    serverUrl: null,
    errorMessage: null,
    setStatus: vi.fn(),
    setServerUrl: vi.fn(),
    setError: vi.fn(),
    enableOfflineMode: vi.fn(),
    enableManualFallback: vi.fn(),
  });
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
  vi.clearAllMocks();
});

describe('MDNSScannerService.verifyServerHealth', () => {
  const mockServerUrl = 'http://192.168.1.100:3333';

  it('should return true and set server URL when health check is successful', async () => {
    const mockResponse = {
      data: {
        status: 'ok',
        databaseConnected: true,
        version: '1.0.0',
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const mockStore = useConnectionStore.getState();

    const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

    expect(result).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

    expect(mockStore.setStatus).toHaveBeenCalledWith('CONNECTING');
    expect(mockStore.setServerUrl).toHaveBeenCalledWith(mockServerUrl);
  });

  it('should return false and set error state on network error (e.g. timeout)', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network timeout'));

    const mockStore = useConnectionStore.getState();

    const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Health Check] Échec du test de connectivité:'),
      expect.any(Error)
    );

    expect(mockStore.setStatus).toHaveBeenCalledWith('CONNECTING');
    expect(mockStore.setError).toHaveBeenCalledWith("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
    expect(mockStore.setServerUrl).not.toHaveBeenCalled();
  });

  it('should return false and set error state on 500 status code', async () => {
    // Axios throws an error for status codes outside 2xx by default
    const mockError = new Error('Request failed with status code 500');
    (mockError as any).response = { status: 500 };

    vi.mocked(axios.get).mockRejectedValueOnce(mockError);

    const mockStore = useConnectionStore.getState();

    const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Health Check] Échec du test de connectivité:'),
      expect.any(Error)
    );

    expect(mockStore.setStatus).toHaveBeenCalledWith('CONNECTING');
    expect(mockStore.setError).toHaveBeenCalledWith("Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.");
    expect(mockStore.setServerUrl).not.toHaveBeenCalled();
// Mock dependencies
vi.mock('axios');
vi.mock('react-native-zeroconf', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        on: vi.fn(),
        removeAllListeners: vi.fn(),
        scan: vi.fn(),
        stop: vi.fn(),
      };
    }),
  };
});

describe('MDNSScannerService', () => {
  const mockServerUrl = 'http://192.168.1.10:3333';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state before each test
    useConnectionStore.setState({
      status: 'INITIALIZING',
      serverUrl: null,
      errorMessage: null,
    });
  });

  it('should return true and set serverUrl when health check is successful', async () => {
    // Arrange
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { status: 'ok', databaseConnected: true, version: '1.0.0' },
    });

    // Act
    const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

    // Assert
    expect(result).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

    const state = useConnectionStore.getState();
    expect(state.status).toBe('CONNECTED');
    expect(state.serverUrl).toBe(mockServerUrl);
    expect(state.errorMessage).toBeNull();
  });

  it('should return false and set error when database is not connected', async () => {
    // Arrange
    // In the code, it throws an error which is caught, leading to setting errorMessage and returning false
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { status: 'ok', databaseConnected: false, version: '1.0.0' },
    });

    // Act
    const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

    // Assert
    expect(result).toBe(false);
    expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

    const state = useConnectionStore.getState();
    expect(state.status).toBe('CONNECTING'); // The status does not get reverted in the catch block based on the code
    expect(state.serverUrl).toBeNull();
    expect(state.errorMessage).toBe('Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.');

    consoleWarnSpy.mockRestore();
  });

  describe('verifyServerHealth', () => {
    it('should return false and set error when axios throws a network error', async () => {
      // Arrange
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const networkError = new Error('Network Error') as any;
      networkError.code = 'ECONNABORTED';
      vi.mocked(axios.get).mockRejectedValueOnce(networkError);

      // Act
      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      // Assert
      expect(result).toBe(false);
      expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

      const state = useConnectionStore.getState();
      expect(state.status).toBe('CONNECTING');
      expect(state.serverUrl).toBeNull();
      expect(state.errorMessage).toBe('Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.');

      consoleWarnSpy.mockRestore();
    });

    it('should return false and set error when axios returns a 500 status code', async () => {
      // Arrange
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Axios rejects with an error for non-2xx status codes
      const serverError = new Error('Request failed with status code 500') as any;
      serverError.response = { status: 500 };
      vi.mocked(axios.get).mockRejectedValueOnce(serverError);

      // Act
      const result = await MDNSScannerService.verifyServerHealth(mockServerUrl);

      // Assert
      expect(result).toBe(false);
      expect(axios.get).toHaveBeenCalledWith(`${mockServerUrl}/api/health`, { timeout: 3000 });

      const state = useConnectionStore.getState();
      expect(state.status).toBe('CONNECTING');
      expect(state.serverUrl).toBeNull();
      expect(state.errorMessage).toBe('Le serveur a été trouvé mais ne répond pas correctement. Passage en mode Dégradé.');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('discoverServer', () => {
    it('should resolve with server details when mDNS discovers a medical-api service', async () => {
      // Get the mock instance
      const zeroconfInstance = (MDNSScannerService as any).zeroconf;

      // Setup the event listener simulation
      zeroconfInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'resolved') {
          // Simulate resolved event for medical-api
          setTimeout(() => {
            callback({
              type: 'medical-api',
              addresses: ['192.168.1.10'],
              port: 3333
            });
          }, 0);
        }
      });

      const promise = MDNSScannerService.discoverServer();

      // Advance timers if necessary or just await
      const result = await promise;

      expect(result).toEqual({
        ip: '192.168.1.10',
        port: 3333,
        fullUrl: 'http://192.168.1.10:3333'
      });

      const state = useConnectionStore.getState();
      expect(state.status).toBe('SEARCHING_SERVER');
      expect(zeroconfInstance.scan).toHaveBeenCalledWith('medical-api', 'tcp', 'local.');
      expect(zeroconfInstance.stop).toHaveBeenCalled();
      expect(zeroconfInstance.removeAllListeners).toHaveBeenCalledWith('resolved');
      expect(zeroconfInstance.removeAllListeners).toHaveBeenCalledWith('error');
    });

    it('should reject and enable manual fallback when mDNS times out', async () => {
      vi.useFakeTimers();

      const zeroconfInstance = (MDNSScannerService as any).zeroconf;
      zeroconfInstance.on.mockImplementation(() => {}); // Do nothing, let it timeout

      const promise = MDNSScannerService.discoverServer();

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      await expect(promise).rejects.toThrow('Timeout de 5s atteint lors du scan mDNS.');

      const state = useConnectionStore.getState();
      expect(state.status).toBe('MANUAL_FALLBACK');
      expect(state.errorMessage).toBe("Découverte automatique échouée. Veuillez saisir l'IP manuellement.");
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

      const state = useConnectionStore.getState();
      expect(state.status).toBe('MANUAL_FALLBACK');
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

      // verifyServerHealth will set CONNECTED if mocked properly or if we mock the whole chain
      // In this case, we just check that the sequence works
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

      const state = useConnectionStore.getState();
      expect(state.status).toBe('OFFLINE_MODE');
      expect(state.errorMessage).toContain('Réseau local inaccessible. Mode Hors-Ligne activé');
    });

    it('should catch discovery error without crashing (handled by store state)', async () => {
      const discoverSpy = vi.spyOn(MDNSScannerService, 'discoverServer').mockRejectedValueOnce(new Error('Timeout'));
      const verifySpy = vi.spyOn(MDNSScannerService, 'verifyServerHealth');

      await MDNSScannerService.bootstrapConnection();

      expect(discoverSpy).toHaveBeenCalled();
      expect(verifySpy).not.toHaveBeenCalled();

      // Store state is expected to have been set by discoverServer's rejection handling,
      // but since we mocked discoverServer directly, we just verify it doesn't throw.
    });
  });
});
