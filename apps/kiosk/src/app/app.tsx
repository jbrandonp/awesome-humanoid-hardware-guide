import { useEffect } from 'react';
import { useKioskConnection, Patient } from '../hooks/useKioskConnection';
import '../styles.css'; // Make sure global styles are imported

// Mask parts of the name for privacy on a public screen
const maskName = (firstName: string, lastName: string) => {
  if (!firstName && !lastName) return 'Anonyme';
  const initial = firstName ? firstName.charAt(0).toUpperCase() + '.' : '';
  const surname = lastName ? lastName.toUpperCase() : '';
  return `${initial} ${surname}`;
};

export function App() {
  const { isConnected, kioskState } = useKioskConnection(
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
  );

  // Auto fullscreen attempt on load
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
           // It usually requires user interaction to enter fullscreen,
           // but we try it anyway. In a real kiosk scenario,
           // the browser is often launched with a kiosk flag.
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
         console.warn("Fullscreen request failed, likely needs user interaction:", e);
      }
    };
    
    // Add a listener to click to enter fullscreen to make it easy to start
    document.addEventListener('click', enterFullscreen, { once: true });
    
    return () => {
       document.removeEventListener('click', enterFullscreen);
    };
  }, []);

  return (
    <div className="kiosk-container">
      {!isConnected && (
        <div className="connection-overlay">
           <div className="spinner"></div>
           <h2>Reconnexion au serveur...</h2>
        </div>
      )}

      <header className="kiosk-header">
        <h1>Salle d'attente</h1>
      </header>

      <main className="kiosk-main">
        <section className="current-patient-section">
           <h2>Patient Attendu</h2>
           {kioskState.currentPatient ? (
             <div className="current-patient-card animate-pulse">
                <span className="patient-name">
                  {maskName(kioskState.currentPatient.firstName, kioskState.currentPatient.lastName)}
                </span>
                <span className="destination">Bureau 1</span>
             </div>
           ) : (
             <div className="current-patient-card empty">
                <span>En attente du prochain appel...</span>
             </div>
           )}
        </section>

        <section className="last-called-section">
           <h2>Derniers Appels</h2>
           <ul className="last-called-list">
             {kioskState.lastCalledPatients.length > 0 ? (
               kioskState.lastCalledPatients.map((patient: Patient, index: number) => (
                 <li key={patient.id || index} className="last-called-item">
                   <span className="patient-name">
                     {maskName(patient.firstName, patient.lastName)}
                   </span>
                 </li>
               ))
             ) : (
               <li className="last-called-item empty">
                  Aucun appel récent
               </li>
             )}
           </ul>
        </section>
      </main>
      
      <footer className="kiosk-footer">
          <p>Merci de patienter, un médecin va vous recevoir.</p>
          <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></div>
      </footer>
    </div>
  );
}

export default App;
