import { CornerstoneStateService } from './cornerstone-state.service';

describe('CornerstoneStateService', () => {
  describe('deserializeToolState', () => {
    it('should throw if globalToolStateManager is null', () => {
      expect(() => {
        CornerstoneStateService.deserializeToolState(null, { some: 'state' });
      }).toThrow('globalToolStateManager doit être un objet valide non-null');
    });

    it('should throw if globalToolStateManager is undefined', () => {
      expect(() => {
        CornerstoneStateService.deserializeToolState(undefined, {
          some: 'state',
        });
      }).toThrow('globalToolStateManager doit être un objet valide non-null');
    });

    it('should throw if globalToolStateManager is a primitive', () => {
      expect(() => {
        CornerstoneStateService.deserializeToolState('string', {
          some: 'state',
        });
      }).toThrow('globalToolStateManager doit être un objet valide non-null');

      expect(() => {
        CornerstoneStateService.deserializeToolState(123, { some: 'state' });
      }).toThrow('globalToolStateManager doit être un objet valide non-null');
    });

    it('should throw if globalToolStateManager is an array', () => {
      expect(() => {
        CornerstoneStateService.deserializeToolState([], { some: 'state' });
      }).toThrow('globalToolStateManager doit être un objet valide non-null');
    });

    it('should do nothing if state is invalid', () => {
      const manager = { existing: 'data' };
      CornerstoneStateService.deserializeToolState(manager, null as any);
      expect(manager).toEqual({ existing: 'data' });

      CornerstoneStateService.deserializeToolState(
        manager,
        'not object' as any,
      );
      expect(manager).toEqual({ existing: 'data' });

      CornerstoneStateService.deserializeToolState(manager, [] as any);
      expect(manager).toEqual({ existing: 'data' });
    });

    it('should copy valid state properties to the manager', () => {
      const manager = { existing: 'data' };
      const state = { newProp: 'value', nested: { a: 1 } };

      CornerstoneStateService.deserializeToolState(manager, state);

      expect(manager).toEqual({
        existing: 'data',
        newProp: 'value',
        nested: { a: 1 },
      });
    });

    it('should not copy dangerous properties', () => {
      const manager = {};
      const state = {
        validProp: 'yes',
        __proto__: { injected: true },
        constructor: function () {},
        prototype: { foo: 'bar' },
      };

      CornerstoneStateService.deserializeToolState(manager, state);

      expect(manager).toEqual({ validProp: 'yes' });
      expect((manager as any).__proto__.injected).toBeUndefined();
    });

    it('should not overwrite existing functions on the manager', () => {
      const mockMethod = jest.fn();
      const manager = {
        save: mockMethod,
        data: 'old',
      };
      const state = {
        save: 'hacked', // Trying to overwrite a method
        data: 'new',
        extra: 'value',
      };

      CornerstoneStateService.deserializeToolState(manager, state);

      expect(manager.save).toBe(mockMethod); // Method remains intact
      expect(manager.data).toBe('new'); // Data is updated
      expect((manager as any).extra).toBe('value'); // New property is added
    });
  });
});
