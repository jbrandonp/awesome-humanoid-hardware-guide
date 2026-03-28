import { useEffect } from 'react';

/**
 * Hook de la "Zero-Mouse Policy"
 * Gère les raccourcis vitaux (Moins de 15s de consultation)
 */
export function useKeyboardShortcuts(actions: {
  onOpenProtocols: () => void;
  onCloseModals: () => void;
  onFocusOmnibox: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P / Cmd+P : Ouvrir Protocoles Rapides
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        actions.onOpenProtocols();
      }

      // Echap : Fermer Alertes / Menus Rétractables
      if (e.key === 'Escape') {
        actions.onCloseModals();
      }

      // Ctrl+F / Cmd+F : Focus Omnibox
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        actions.onFocusOmnibox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
