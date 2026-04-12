import { useState, useRef, useEffect } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ClinicalTicker } from './ClinicalTicker';
import { DesktopOmnibox } from './DesktopOmnibox';
import { HardwareStatusIndicator } from './HardwareStatusIndicator';
import { NavigationBar } from './NavigationBar';
import { DicomViewer } from './DicomViewer';
import { SmartCardReader } from './SmartCardReader';
import { PurchaseOrderQueue } from './PurchaseOrderQueue';
import { ClinicalDashboard } from './ClinicalDashboard';
import { BedManagement } from './BedManagement';

type ViewType = 'consultation' | 'dashboard' | 'imaging' | 'bed-management' | 'smart-card' | 'procurement';

export function ZenConsultationLayout({ apiUrl }: { apiUrl: string }) {
  // États du Thème
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHighLegibility, setIsHighLegibility] = useState(false);

  // Zéro-Menu / Interface Focus
  const [showHistory, setShowHistory] = useState(false); // Accordéon fluide
  const [showProtocols, setShowProtocols] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('consultation');

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

   const renderView = () => {
     switch (activeView) {
       case 'consultation':
         return (
           <>
             <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Dossier: Jean Dupont (34 ans)</h1>
                <p className="text-slate-400 mt-2">Dernier passage: 12 Mars 2026</p>
             </header>
             <main className="flex-1 max-w-4xl w-full mx-auto mt-8 mb-24 relative z-10">
                <DesktopOmnibox ref={omniboxRef} />
                {showProtocols && (
                  <div className="mt-4 p-4 bg-medical-border rounded-lg flex gap-4">
                     <button tabIndex={4} className="bg-medical-primary text-white px-4 py-2 rounded-md font-medium">Paludisme Simple</button>
                     <button tabIndex={5} className="bg-medical-primary text-white px-4 py-2 rounded-md font-medium">Grippe A</button>
                  </div>
                )}
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
           </>
         );
        case 'dashboard':
          return (
            <main className="flex-1 w-full mt-4 mb-24 relative z-10" style={{ height: 'calc(100vh - 200px)' }}>
               <ClinicalDashboard apiUrl={apiUrl} />
            </main>
          );
       case 'imaging':
         // Mock image IDs for DICOM viewer
         const mockImageIds = Array.from({ length: 20 }, (_, i) => `dicom://example.com/series/1/image${i + 1}`);
         return (
           <main className="flex-1 w-full mt-4 mb-24 relative z-10">
              <DicomViewer imageIds={mockImageIds} />
           </main>
         );
        case 'bed-management':
          return (
            <main className="flex-1 w-full mt-4 mb-24 relative z-10 p-8">
               <BedManagement apiUrl={apiUrl} />
            </main>
          );
       case 'smart-card':
         return (
           <main className="flex-1 w-full mt-4 mb-24 relative z-10 p-8">
              <div className="bg-medical-surface p-6 rounded-lg shadow-md border border-medical-border">
                 <h2 className="text-2xl font-bold mb-4">Lecture de Carte Santé</h2>
                 <SmartCardReader />
              </div>
           </main>
         );
       case 'procurement':
         return (
           <main className="flex-1 w-full mt-4 mb-24 relative z-10 p-8">
              <PurchaseOrderQueue apiUrl={apiUrl} />
           </main>
         );
       default:
         return null;
     }
   };

   return (
     <div className="min-h-screen flex flex-col transition-colors duration-150 ease-in-out">
        <NavigationBar activeView={activeView} onViewChange={setActiveView} />
        
        {/* Toolbar with hardware status and accessibility buttons */}
        <div className="flex justify-between items-center p-4 border-b border-medical-border bg-medical-surface">
          <HardwareStatusIndicator />
          <div className="flex gap-4">
            <button
              tabIndex={2}
              onClick={() => setIsHighLegibility(!isHighLegibility)}
              className="px-4 py-2 rounded bg-medical-border text-sm hover:bg-slate-600 focus:outline-none focus:ring-2"
            >
              {isHighLegibility ? 'Texte Normal' : 'A+ Haute Lisibilité'}
            </button>
            <button
              tabIndex={3}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-2 rounded bg-medical-border text-sm hover:bg-slate-600 focus:outline-none focus:ring-2"
            >
              {isDarkMode ? 'Mode Jour' : 'Mode Nuit Clinique'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-8">
          {renderView()}
        </div>

        <ClinicalTicker />
     </div>
   );
}
