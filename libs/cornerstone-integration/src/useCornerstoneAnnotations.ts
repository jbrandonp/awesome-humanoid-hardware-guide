import { useCallback } from 'react';
import { CornerstoneStateService } from './cornerstone-state.service';

export function useCornerstoneAnnotations(apiUrl: string, patientId: string, imageId: string) {
  
  const saveAnnotations = useCallback(async (toolStateManager: unknown) => {
    try {
      const state = CornerstoneStateService.serializeToolState(toolStateManager);
      
      const response = await fetch(`${apiUrl}/api/clinical-records/${patientId}/radiology/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          imageId,
          annotations: state,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des annotations');
      }
    } catch (e) {
      console.error('Erreur API sauvegarde annotations', e);
      throw e;
    }
  }, [apiUrl, patientId, imageId]);

  const loadAnnotations = useCallback(async (toolStateManager: unknown) => {
    try {
      const response = await fetch(`${apiUrl}/api/clinical-records/${patientId}/radiology/annotations/${imageId}`);
      if (!response.ok) {
        if (response.status === 404) return; // No annotations yet
        throw new Error('Erreur lors du chargement des annotations');
      }

      const annotations = await response.json();
      if (annotations) {
        CornerstoneStateService.deserializeToolState(toolStateManager, annotations as Record<string, unknown>);
      }
    } catch (e) {
      console.error('Erreur API chargement annotations', e);
      throw e;
    }
  }, [apiUrl, patientId, imageId]);

  return { saveAnnotations, loadAnnotations };
}
