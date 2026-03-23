import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ZenConsultationLayout } from '../components/ZenConsultationLayout';

export function App() {
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualIp, setManualIp] = useState<string>('');

  useEffect(() => {
    async function discoverApi() {
      try {
        const url = await invoke<string>('discover_medical_api');
        setApiUrl(url);
      } catch (e) {
        setError(e as string);
      }
    }

    // Only run in Tauri environment
    // @ts-ignore
    if (window.__TAURI_INTERNALS__) {
      discoverApi();
    } else {
      setApiUrl('http://localhost:3000'); // Dev fallback
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h2>Service Non Trouvé</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <div>
          <label>Entrez l'IP du serveur manuellement :</label>
          <br />
          <input
            type="text"
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="http://192.168.1.10:3000"
            style={{ padding: '0.5rem', margin: '0.5rem 0' }}
          />
          <button onClick={() => setApiUrl(manualIp)}>Se Connecter</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => setApiUrl('https://cloud.systemesante.com')}>
            Bascule sur le Cloud (Fallback)
          </button>
        </div>
      </div>
    );
  }

  if (!apiUrl) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h2>Recherche du Serveur Médical...</h2>
        <p>Scan du réseau local via mDNS en cours...</p>
      </div>
    );
  }

  return <ZenConsultationLayout />;
}

export default App;
