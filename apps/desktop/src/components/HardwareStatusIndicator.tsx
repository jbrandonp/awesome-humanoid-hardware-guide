import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Cpu,
  Printer,
  ServerCrash,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HardwareStatus {
  total_memory: number;
  available_memory: number;
  cpu_cores: number;
  thermal_printers_found: number;
  os_version: string;
}

export function HardwareStatusIndicator() {
  const [status, setStatus] = useState<HardwareStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // @ts-ignore
        if (window.__TAURI_INTERNALS__) {
          const res = await invoke<HardwareStatus>('check_hardware_health');
          setStatus(res);
        }
      } catch (e) {
        console.error('Hardware check failed', e);
      }
    };

    fetchStatus();
    // Rafraichir l'info toutes les minutes
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const isRamCritical = status.available_memory < 500; // Moins de 500Mo de RAM = Critique

  return (
    <div className="flex gap-4 items-center bg-medical-surface px-4 py-2 rounded-lg border border-medical-border text-xs">
      <div
        className={`flex items-center gap-2 ${isRamCritical ? 'text-medical-danger font-bold' : 'text-emerald-400'}`}
      >
        {isRamCritical ? (
          <ServerCrash className="w-4 h-4" />
        ) : (
          <Cpu className="w-4 h-4" />
        )}
        <span>
          RAM Lib: {status.available_memory} Mo / {status.total_memory} Mo
        </span>
      </div>

      <div className="w-px h-4 bg-medical-border" />

      <div
        className={`flex items-center gap-2 ${status.thermal_printers_found > 0 ? 'text-emerald-400' : 'text-slate-400'}`}
      >
        <Printer className="w-4 h-4" />
        <span>
          ESC/POS: {status.thermal_printers_found > 0 ? 'Prêt' : 'Non détectée'}
        </span>
        {status.thermal_printers_found > 0 ? (
          <CheckCircle2 className="w-3 h-3 ml-1" />
        ) : (
          <AlertTriangle className="w-3 h-3 ml-1" />
        )}
      </div>
    </div>
  );
}
