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
  });
});
