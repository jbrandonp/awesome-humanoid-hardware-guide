import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SmartCardData {
  reader_name: string;
  atr_hex: string;
}

export function SmartCardReader() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SmartCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReadCard = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await invoke<SmartCardData>('read_smart_card');
      setData(result);
    } catch (e: any) {
      console.error('Erreur lecture carte à puce:', e);
      // Gère à la fois les objets d'erreur Rust {message, code} et les simples chaînes
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 items-center bg-medical-surface px-4 py-2 rounded-lg border border-medical-border text-xs">
      <div className="flex items-center gap-2 text-slate-300">
        <CreditCard className="w-4 h-4" />
        <span className="font-semibold">ABDM Auth</span>
      </div>

      <button
        onClick={handleReadCard}
        disabled={loading}
        className="px-3 py-1 bg-medical-primary text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Lecture...' : 'Lire la carte'}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-medical-danger">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>ATR: <code className="bg-slate-800 px-1 rounded">{data.atr_hex}</code></span>
        </div>
      )}
    </div>
  );
}
