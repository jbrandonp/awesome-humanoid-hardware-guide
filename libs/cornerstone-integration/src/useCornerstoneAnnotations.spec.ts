import { renderHook, act } from '@testing-library/react';
import { useCornerstoneAnnotations } from './useCornerstoneAnnotations';
import { CornerstoneStateService } from './cornerstone-state.service';

// Mock dependencies
global.fetch = jest.fn();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('./cornerstone-state.service', () => ({
  CornerstoneStateService: {
    serializeToolState: jest.fn(),
    deserializeToolState: jest.fn(),
  },
}));

describe('useCornerstoneAnnotations', () => {
  const apiUrl = 'http://test-api';
  const patientId = 'patient-123';
  const imageId = 'img-456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default fetch mock response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
      status: 200,
    });
  });

  describe('saveAnnotations', () => {
    it('should successfully save annotations and call the API correctly', async () => {
      const mockState = { some: 'state' };
      (CornerstoneStateService.serializeToolState as jest.Mock).mockReturnValue(mockState);

      const { result } = renderHook(() => useCornerstoneAnnotations(apiUrl, patientId, imageId));

      const toolStateManager = {};

      await act(async () => {
        await result.current.saveAnnotations(toolStateManager);
      });

      expect(CornerstoneStateService.serializeToolState).toHaveBeenCalledWith(toolStateManager);
      expect(global.fetch).toHaveBeenCalledWith(
        `${apiUrl}/api/clinical-records/${patientId}/radiology/annotations`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            imageId,
            annotations: mockState,
          }),
        })
      );

      // Check for X-Idempotency-Key
      const fetchCallArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchCallArgs.headers['X-Idempotency-Key']).toBeDefined();
    });

    it('should throw an error and log if the API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCornerstoneAnnotations(apiUrl, patientId, imageId));

      await expect(
        act(async () => {
          await result.current.saveAnnotations({});
        })
      ).rejects.toThrow('Erreur lors de la sauvegarde des annotations');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Erreur API sauvegarde annotations',
        expect.any(Error)
      );
    });
  });

  describe('loadAnnotations', () => {
    it('should successfully load annotations, call the API, and invoke deserializeToolState', async () => {
      const mockAnnotations = { some: 'annotations' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAnnotations),
        status: 200,
      });

      const { result } = renderHook(() => useCornerstoneAnnotations(apiUrl, patientId, imageId));

      const toolStateManager = {};

      await act(async () => {
        await result.current.loadAnnotations(toolStateManager);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${apiUrl}/api/clinical-records/${patientId}/radiology/annotations/${imageId}`
      );
      expect(CornerstoneStateService.deserializeToolState).toHaveBeenCalledWith(toolStateManager, mockAnnotations);
    });

    it('should handle 404 gracefully (not throw an error)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useCornerstoneAnnotations(apiUrl, patientId, imageId));

      await act(async () => {
        await result.current.loadAnnotations({});
      });

      // Should not call deserializeToolState if 404
      expect(CornerstoneStateService.deserializeToolState).not.toHaveBeenCalled();
      // Error should not be logged
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should throw an error and log if the API call fails with other status codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCornerstoneAnnotations(apiUrl, patientId, imageId));

      await expect(
        act(async () => {
          await result.current.loadAnnotations({});
        })
      ).rejects.toThrow('Erreur lors du chargement des annotations');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Erreur API chargement annotations',
        expect.any(Error)
      );
    });
  });
});
