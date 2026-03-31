import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { MDNSScannerService } from './mdns-scanner.service';
import { useConnectionStore } from '../stores/connection.store';

// Mock dependencies
vi.mock('axios');
vi.mock('react-native-zeroconf', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        on: vi.fn(),
        scan: vi.fn(),
        stop: vi.fn(),
      };
    }),
  };
});

describe('MDNSScannerService.verifyServerHealth', () => {
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

  it('should return false and set error when axios throws a network error', async () => {
    // Arrange
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

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
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { status: 500 },
      message: 'Request failed with status code 500'
    });

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
