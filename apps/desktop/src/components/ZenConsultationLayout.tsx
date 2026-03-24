import React, { useState, useRef, useEffect } from 'react';
import { useHardwareOptimization } from '../hooks/useHardwareOptimization';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ClinicalTicker } from './ClinicalTicker';
import { DesktopOmnibox } from './DesktopOmnibox';
import { HardwareStatusIndicator } from './HardwareStatusIndicator';
import { DicomViewer } from './DicomViewer';

export function ZenConsultationLayout() {
  useHardwareOptimization(); // Désactive les animations (Windows 7 / Low-Resource)

  // États du Thème
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHighLegibility, setIsHighLegibility] = useState(false);

  // Zéro-Menu / Interface Focus
  const [showHistory, setShowHistory] = useState(false); // Accordéon fluide
  const [showProtocols, setShowProtocols] = useState(false);

  const omniboxRef = useRef<HTMLInputElement>(null);

  // Applique les classes CSS au Body (Medical Dark Mode + Typographie 15%)
  useEffect(() => {
     document.body.className = `${isDarkMode ? 'dark bg-medical-dark text-medical-text' : 'light bg-slate-50 text-slate-800'} ${isHighLegibility ? 'high-legibility' : ''}`;
  }, [isDarkMode, isHighLegibility]);

  // "Zero-Mouse Policy": Focus automatique de l'omnibox dès l'ouverture du patient
  useEffect(() => {
      omniboxRef.current?.focus();
  }, []);

  // "Zero-Mouse Policy": Raccourcis clavier globaux (Hooks)
  useKeyboardShortcuts({
     onOpenProtocols: () => setShowProtocols(prev => !prev),
     onCloseModals: () => {
         setShowProtocols(false);
         setShowHistory(false);
     },
     onFocusOmnibox: () => omniboxRef.current?.focus()
  });

  const [showDicomViewer, setShowDicomViewer] = useState(false);

  // Example dummy image IDs representing WADO-RS URLs fetching from a local MinIO server
  const dummyImageIds = [
    'wadors:http://localhost:9000/dicom/wado-rs/studies/1/series/1/instances/1/frames/1',
    'wadors:http://localhost:9000/dicom/wado-rs/studies/1/series/1/instances/2/frames/1',
    'wadors:http://localhost:9000/dicom/wado-rs/studies/1/series/1/instances/3/frames/1',
  ];

  return (
    <div className="min-h-screen flex flex-col p-8 transition-colors duration-150 ease-in-out">
       {/* Paramètres Accessibilité & Diagnostic Hardware */}
       <div className="flex justify-between items-start gap-4 mb-4">

         {/* Diagnostic Matériel (RAM / Imprimante) */}
         <HardwareStatusIndicator />

         <div className="flex gap-4">
           <button
             tabIndex={1}
           onClick={() => setIsHighLegibility(!isHighLegibility)}
           className="px-4 py-2 rounded bg-medical-border text-sm hover:bg-slate-600 focus:outline-none focus:ring-2"
         >
            {isHighLegibility ? 'Texte Normal' : 'A+ Haute Lisibilité'}
         </button>
           <button
             tabIndex={2}
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="px-4 py-2 rounded bg-medical-border text-sm hover:bg-slate-600 focus:outline-none focus:ring-2"
           >
              {isDarkMode ? 'Mode Jour' : 'Mode Nuit Clinique'}
           </button>
         </div>
       </div>

       {/* En-tête Patient "Zen" (Zéro menu latéral) */}
       <header className="mb-10 text-center flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dossier: Jean Dupont (34 ans)</h1>
          <p className="text-slate-400 mt-2">Dernier passage: 12 Mars 2026</p>
          <button
             onClick={() => setShowDicomViewer(!showDicomViewer)}
             className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
             {showDicomViewer ? 'Fermer Viewer Scanner' : 'Ouvrir Viewer Scanner (CT)'}
          </button>
       </header>

       {/* Scanner Viewer */}
       {showDicomViewer && (
         <div className="w-full h-96 mb-8 border border-slate-600 rounded overflow-hidden">
             <DicomViewer imageIds={dummyImageIds} />
         </div>
       )}

       {/* Élément Central: L'Omnibox (Focus initial) */}
       <main className="flex-1 max-w-4xl w-full mx-auto mt-8 mb-24 relative z-10">
          <DesktopOmnibox ref={omniboxRef} />

          {/* Raccourcis visuels (Si Ctrl+P activé) */}
          {showProtocols && (
            <div className="mt-4 p-4 bg-medical-border rounded-lg flex gap-4">
               <button tabIndex={4} className="bg-medical-primary text-white px-4 py-2 rounded-md font-medium">Paludisme Simple</button>
               <button tabIndex={5} className="bg-medical-primary text-white px-4 py-2 rounded-md font-medium">Grippe A</button>
            </div>
          )}

          {/* Widgets Rétractables (Accordéons) */}
          <div className="mt-12 space-y-4">
             <button
               tabIndex={6}
               onClick={() => setShowHistory(!showHistory)}
               className="w-full text-left bg-medical-surface p-4 rounded-lg flex justify-between items-center hover:bg-slate-700"
             >
                <span className="font-semibold">Historique Ancien & Allergies</span>
                <span>{showHistory ? '▲' : '▼'}</span>
             </button>

             {showHistory && (
               <div className="p-6 bg-slate-800 rounded-lg border-l-4 border-medical-danger">
                  <h3 className="font-bold text-red-400 mb-2">! ALLERGIE GRAVE : Pénicilline</h3>
                  <p className="text-slate-300">Choc anaphylactique rapporté en 2019.</p>
               </div>
             )}
          </div>
       </main>

       <ClinicalTicker />
    </div>
  );
}
