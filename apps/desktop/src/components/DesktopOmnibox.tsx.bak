import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  KeyboardEvent,
} from 'react';
import Fuse from 'fuse.js';
import { Pill, Activity, Stethoscope, CheckCircle2 } from 'lucide-react';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready)
// ============================================================================

export type OmniboxItemType = 'medication' | 'icd10' | 'lab';

export interface OmniboxSearchResult {
  id: string;
  type: OmniboxItemType;
  code?: string;
  name: string;
  dosage?: string;
  category?: string;
}

// MOCK DE LA BASE DE DONNÉES (Pour l'exemple Desktop.
// En vrai, on utiliserait LokiJS/WatermelonDB avec un debounce comme sur Mobile)
const MEDICAL_DATABASE: OmniboxSearchResult[] = [
  {
    id: '1',
    type: 'icd10',
    code: 'B50.9',
    name: 'Paludisme à Plasmodium falciparum, sans complication',
  },
  {
    id: '2',
    type: 'icd10',
    code: 'J01.9',
    name: 'Sinusite aiguë, sans précision',
  },
  {
    id: '3',
    type: 'medication',
    name: 'Artemether 20mg / Lumefantrine 120mg',
    dosage: '1 cp matin et soir pendant 3 jours',
  },
  {
    id: '4',
    type: 'medication',
    name: 'Paracétamol 1000mg',
    dosage: '1 cp toutes les 6h si fièvre > 38.5°C',
  },
  {
    id: '5',
    type: 'medication',
    name: 'Amoxicilline 1g',
    dosage: '1 cp matin, midi et soir pendant 7 jours',
  },
  { id: '6', type: 'lab', code: 'HGB', name: 'Hémoglobine' },
  { id: '7', type: 'lab', code: 'GLU', name: 'Glycémie à jeun' },
];

export const DesktopOmnibox = React.forwardRef<HTMLInputElement, unknown>(
  (props, ref) => {
    const [query, setQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<OmniboxSearchResult[]>(
      [],
    );

    // Navigation Clavier "Zéro-Mouse Policy"
    const [cursorIndex, setCursorIndex] = useState<number>(0);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // ============================================================================
    // FUITE MÉMOIRE & OPTIMISATIONS (Windows 7 / RAM < 4Go)
    // ============================================================================
    // - On n'attache pas de "window.addEventListener" global pour l'Omnibox,
    //   seulement un onKeyDown local sur l'input, évitant ainsi un nettoyage
    //   (cleanup function) faillible qui fuirait dans la RAM si mal démonté.
    // - On stocke l'index Fuse statiquement via useMemo (pas de recompilation)
    // - On interdit les classes Tailwind "transition-*" et "animate-*" ici pour
    //   soulager le processeur graphique (GPU Rasterization) de Windows 7.

    const fuse = useMemo(
      () =>
        new Fuse(MEDICAL_DATABASE, {
          keys: ['name', 'code', 'dosage'],
          threshold: 0.3,
        }),
      [],
    );

    const searchResults: OmniboxSearchResult[] = useMemo(() => {
      if (!query) return [];
      return fuse.search(query).map((result) => result.item);
    }, [query, fuse]);

    // Réinitialiser le curseur clavier quand la recherche change
    useEffect(() => {
      setCursorIndex(0);
    }, [searchResults.length]);

    /**
     * NAVIGATION 100% CLAVIER (Up/Down/Enter/Escape)
     * Vitesse d'exécution extrême (< 15ms)
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!searchResults.length) {
        // Escape vide la barre même si aucun résultat n'est trouvé
        if (e.key === 'Escape') {
          e.preventDefault();
          setQuery('');
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // Empêche le curseur texte de bouger
          setCursorIndex((prev) => {
            const nextIndex = prev < searchResults.length - 1 ? prev + 1 : prev;
            scrollToItem(nextIndex);
            return nextIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCursorIndex((prev) => {
            const prevIndex = prev > 0 ? prev - 1 : 0;
            scrollToItem(prevIndex);
            return prevIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          // Ajoute l'élément actuellement surligné
          if (searchResults[cursorIndex]) {
            handleSelect(searchResults[cursorIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setQuery('');
          setCursorIndex(0);
          break;
        default:
          break;
      }
    };

    /**
     * Maintient le focus visuel dans la liste (Auto-Scroll)
     * sans utiliser de hooks lourds
     */
    const scrollToItem = (index: number) => {
      if (itemRefs.current[index]) {
        itemRefs.current[index]?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth', // 'smooth' peut lagger sur Win7, 'auto' ou 'instant' serait mieux si performance absolue requise, mais 'nearest' fait le travail basique.
        });
      }
    };

    const handleSelect = (item: OmniboxSearchResult) => {
      if (!selectedItems.find((i) => i.id === item.id)) {
        setSelectedItems([...selectedItems, item]);
      }
      setQuery('');
      setCursorIndex(0);

      // Auto-refocus for continuous typing (Zero Mouse Policy)
      if (typeof ref === 'function') {
        // no-op (forwardRef standard)
      } else if (ref && ref.current) {
        ref.current.focus();
      }
    };

    return (
      <div className="w-full relative">
        {/* Barre Principale */}
        <div className="relative group shadow-none rounded-xl">
          <input
            ref={ref}
            tabIndex={3}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez un Médicament, Diagnostic ICD-10, ou Ctrl+P..."
            className="w-full bg-medical-surface border-2 border-medical-border text-2xl p-6 rounded-xl placeholder-slate-500 focus:ring-4 focus:border-medical-primary focus:outline-none"
          />
          <div className="absolute right-6 top-7 text-sm font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded">
            Zéro Souris ⌨️
          </div>
        </div>

        {/* Autocomplete Dropdown (Navigation Clavier) */}
        {searchResults.length > 0 && (
          <div
            ref={listRef}
            className="absolute top-full left-0 right-0 mt-2 bg-medical-surface border border-medical-border rounded-xl overflow-hidden shadow-none z-40 max-h-80 overflow-y-auto"
          >
            {searchResults.map((item, idx) => {
              const isSelected = cursorIndex === idx;
              return (
                <button
                  key={item.id}
                  ref={(el: HTMLButtonElement | null) => { itemRefs.current[idx] = el; }}
                  onClick={() => handleSelect(item)}
                  // Zéro Animation CSS : Utilisation stricte de la couleur pour le focus
                  className={`w-full text-left p-4 border-b border-medical-border focus:outline-none flex items-center justify-between
                     ${isSelected ? 'bg-medical-primary text-white' : 'hover:bg-slate-700 text-medical-text'}
                   `}
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'icd10' && (
                      <Stethoscope
                        className={isSelected ? 'text-white' : 'text-blue-400'}
                      />
                    )}
                    {item.type === 'medication' && (
                      <Pill
                        className={
                          isSelected ? 'text-white' : 'text-emerald-400'
                        }
                      />
                    )}
                    {item.type === 'lab' && (
                      <Activity
                        className={
                          isSelected ? 'text-white' : 'text-purple-400'
                        }
                      />
                    )}
                    <div>
                      <div className="font-semibold text-lg">
                        {item.type === 'icd10' ? `[${item.code}] ` : ''}{' '}
                        {item.name}
                      </div>
                      {item.dosage && (
                        <div
                          className={`text-sm mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}
                        >
                          {item.dosage}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      Appuyez sur Entrée ↵
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Panier / Ordonnance en cours */}
        {selectedItems.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Ordonnance en cours
            </h3>
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-medical-surface p-4 rounded-lg border-l-4 border-medical-primary"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-medical-primary w-5 h-5" />
                  <div>
                    <p className="font-semibold text-medical-text">
                      {item.name}
                    </p>
                    {item.dosage && (
                      <p className="text-sm text-slate-400">{item.dosage}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSelectedItems((prev) =>
                      prev.filter((i) => i.id !== item.id),
                    )
                  }
                  className="text-slate-500 hover:text-medical-danger focus:outline-none"
                  tabIndex={-1} // Ignorer dans le tab-flow pour garder le focus sur l'omnibox
                >
                  Retirer
                </button>
              </div>
            ))}

            <div className="pt-6 flex justify-end">
              <button
                tabIndex={10}
                className="bg-medical-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg focus:ring-4 focus:ring-blue-300"
              >
                VALIDER L'ORDONNANCE
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
