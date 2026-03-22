import React, { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import { Pill, Activity, Stethoscope, CheckCircle2 } from 'lucide-react';

const MEDICAL_DATABASE = [
  { id: '1', type: 'icd10', code: 'B50.9', name: 'Paludisme à Plasmodium falciparum, sans complication' },
  { id: '2', type: 'icd10', code: 'J01.9', name: 'Sinusite aiguë, sans précision' },
  { id: '3', type: 'medication', name: 'Artemether 20mg / Lumefantrine 120mg', dosage: '1 cp matin et soir pendant 3 jours' },
  { id: '4', type: 'medication', name: 'Paracétamol 1000mg', dosage: '1 cp toutes les 6h si fièvre > 38.5°C' },
  { id: '5', type: 'medication', name: 'Amoxicilline 1g', dosage: '1 cp matin, midi et soir pendant 7 jours' },
  { id: '6', type: 'lab', code: 'HGB', name: 'Hémoglobine' },
  { id: '7', type: 'lab', code: 'GLU', name: 'Glycémie à jeun' },
];

export const DesktopOmnibox = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  const [query, setQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Fuzzy Search Index
  const fuse = useMemo(() => new Fuse(MEDICAL_DATABASE, {
    keys: ['name', 'code', 'dosage'],
    threshold: 0.3,
  }), []);

  const searchResults = query ? fuse.search(query).map(result => result.item) : [];

  const handleSelect = (item: any) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      setSelectedItems([...selectedItems, item]);
    }
    setQuery('');
    // Auto-refocus for continuous typing (Zero Mouse Policy)
    if (typeof ref === 'function') {
        // no-op, using actual ref logic below would be cleaner but this works for mock
    } else if (ref && ref.current) {
        ref.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelect(searchResults[0]);
    }
  };

  return (
    <div className="w-full relative">
       {/* Barre Principale */}
       <div className="relative group shadow-lg rounded-xl">
           <input
             ref={ref}
             tabIndex={3}
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Tapez un Médicament, Diagnostic ICD-10, ou Ctrl+P (Protocoles)..."
             className="w-full bg-medical-surface border-2 border-medical-border text-2xl p-6 rounded-xl placeholder-slate-500 focus:ring-4 focus:border-medical-primary focus:outline-none transition-colors"
           />
           <div className="absolute right-6 top-7 text-sm font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded">Prescription Éclair (15s)</div>
       </div>

       {/* Autocomplete Dropdown */}
       {query.length > 0 && (
         <div className="absolute top-full left-0 right-0 mt-2 bg-medical-surface border border-medical-border rounded-xl overflow-hidden shadow-2xl z-40 max-h-80 overflow-y-auto">
            {searchResults.map((item, idx) => (
               <button
                 key={item.id}
                 onClick={() => handleSelect(item)}
                 className={`w-full text-left p-4 border-b border-medical-border hover:bg-slate-700 focus:bg-slate-700 focus:outline-none flex items-center justify-between ${idx === 0 ? 'bg-slate-800/50' : ''}`}
               >
                 <div className="flex items-center gap-3">
                   {item.type === 'icd10' && <Stethoscope className="text-blue-400" />}
                   {item.type === 'medication' && <Pill className="text-emerald-400" />}
                   {item.type === 'lab' && <Activity className="text-purple-400" />}
                   <div>
                     <div className="font-semibold text-medical-text text-lg">
                       {item.type === 'icd10' ? `[${item.code}] ` : ''} {item.name}
                     </div>
                     {item.dosage && <div className="text-sm text-slate-400 mt-1">{item.dosage}</div>}
                   </div>
                 </div>
                 {idx === 0 && <span className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">Appuyez sur Entrée ↵</span>}
               </button>
            ))}
         </div>
       )}

       {/* Panier / Ordonnance en cours */}
       {selectedItems.length > 0 && (
         <div className="mt-8 space-y-3">
           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Ordonnance en cours</h3>
           {selectedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-medical-surface p-4 rounded-lg border-l-4 border-medical-primary">
                 <div className="flex items-center gap-3">
                   <CheckCircle2 className="text-medical-primary w-5 h-5" />
                   <div>
                     <p className="font-semibold text-medical-text">{item.name}</p>
                     {item.dosage && <p className="text-sm text-slate-400">{item.dosage}</p>}
                   </div>
                 </div>
                 <button
                   onClick={() => setSelectedItems(prev => prev.filter(i => i.id !== item.id))}
                   className="text-slate-500 hover:text-medical-danger focus:outline-none"
                 >
                    Retirer
                 </button>
              </div>
           ))}

           <div className="pt-6 flex justify-end">
              <button tabIndex={10} className="bg-medical-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg focus:ring-4 focus:ring-blue-300 transition-colors">
                VALIDER L'ORDONNANCE
              </button>
           </div>
         </div>
       )}
    </div>
  );
});
