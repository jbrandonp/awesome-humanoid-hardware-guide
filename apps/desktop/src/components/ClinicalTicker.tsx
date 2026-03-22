import React, { useState, useEffect } from 'react';
import { AlertCircle, Package } from 'lucide-react';

export function ClinicalTicker() {
  const [alerts, setAlerts] = useState<{ id: string, msg: string, type: 'epi' | 'stock' }[]>([
    { id: '1', msg: 'Alerte Flash: Pic anormal de cas de Paludisme détecté en 48h (+35 cas).', type: 'epi' },
    { id: '2', msg: 'Stock Critique: Artemether < 15 unités. Prévoyez une rupture imminente.', type: 'stock' }
  ]);

  // En production, ce hook s'abonnerait au Server-Sent Events (SSE) :
  // useEffect(() => {
  //   const eventSource = new EventSource('http://localhost:3000/api/ticker/stream');
  //   eventSource.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     setAlerts(prev => [...prev, { id: data.id, msg: data.message, type: data.type === 'EPIDEMIOLOGY' ? 'epi' : 'stock' }]);
  //   };
  //   return () => eventSource.close();
  // }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-950 border-t border-medical-border flex items-center overflow-hidden z-50">
      <div className="flex animate-marquee whitespace-nowrap items-center h-full px-4">
        {alerts.map((alert) => (
          <span key={alert.id} className="flex items-center text-sm font-medium mr-16 text-slate-300">
            {alert.type === 'epi' ? (
              <AlertCircle className="w-4 h-4 text-medical-danger mr-2" />
            ) : (
              <Package className="w-4 h-4 text-orange-400 mr-2" />
            )}
            {alert.msg}
          </span>
        ))}
        {/* Clone for infinite scroll effect */}
        {alerts.map((alert) => (
          <span key={`clone-${alert.id}`} className="flex items-center text-sm font-medium mr-16 text-slate-300">
            {alert.type === 'epi' ? (
               <AlertCircle className="w-4 h-4 text-medical-danger mr-2" />
            ) : (
               <Package className="w-4 h-4 text-orange-400 mr-2" />
            )}
            {alert.msg}
          </span>
        ))}
      </div>
    </div>
  );
}
