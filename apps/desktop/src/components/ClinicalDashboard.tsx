import { useState, useEffect } from 'react';
import { MedicalApi, Bed, Vital, Alert, QueueEntry } from '../services/api';
import { Bed as BedIcon, Activity, AlertTriangle, Users, Heart, Thermometer, Clock } from 'lucide-react';

interface ClinicalDashboardProps {
  apiUrl: string;
}

export function ClinicalDashboard({ apiUrl }: ClinicalDashboardProps) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = new MedicalApi(apiUrl);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bedsData, vitalsData, alertsData, queueData] = await Promise.all([
        api.getBeds(),
        api.getVitals(),
        api.getAlerts(),
        api.getQueue(),
      ]);
      setBeds(bedsData);
      setVitals(vitalsData);
      setAlerts(alertsData);
      setQueue(queueData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiUrl]);

  const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
  const criticalAlerts = alerts.filter(a => a.type === 'SYSTEM').length;
  const latestVitals = vitals.slice(0, 5); // Show recent 5

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Tableau de Bord Clinique
          </h1>
          <p className="text-gray-600">Vue d'ensemble des lits, constantes vitales, alertes et file d'attente.</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 transition-colors"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lits Occupés</p>
              <p className="text-3xl font-bold">{occupiedBeds}</p>
            </div>
            <BedIcon className="w-10 h-10 text-red-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {availableBeds} lits disponibles
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Alertes Critiques</p>
              <p className="text-3xl font-bold">{criticalAlerts}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {alerts.length} alertes totales
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Patients en File</p>
              <p className="text-3xl font-bold">{queue.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Priorité ESI 1-2: {queue.filter(q => q.esiScore <= 2).length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Constantes Vitales</p>
              <p className="text-3xl font-bold">{vitals.length}</p>
            </div>
            <Heart className="w-10 h-10 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Dernière heure: {latestVitals.length}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vitals */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5" /> Constantes Vitales Récentes
          </h3>
          {latestVitals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune donnée de constantes vitales.</p>
          ) : (
            <div className="space-y-3">
              {latestVitals.map((vital) => (
                <div key={vital.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Patient {vital.patientId.substring(0, 8)}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      {vital.bloodPressure && <span>TA: {vital.bloodPressure}</span>}
                      {vital.heartRate && <span>FC: {vital.heartRate} bpm</span>}
                      {vital.temperature && <span>Temp: {vital.temperature}°C</span>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(vital.recordedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Alertes Récentes
          </h3>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune alerte.</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex justify-between">
                    <p className="font-medium text-red-800">{alert.message}</p>
                    <span className="text-xs text-red-600">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-red-600">Patient: {alert.patientId}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> File d'Attente
          </h3>
          {queue.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun patient en file d'attente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Patient ID</th>
                    <th className="text-left py-2">Score ESI</th>
                    <th className="text-left py-2">Heure d'Arrivée</th>
                    <th className="text-left py-2">Motif Principal</th>
                    <th className="text-left py-2">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((entry) => (
                    <tr key={entry.patientId} className="border-b last:border-0">
                      <td className="py-2">{entry.patientId}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${entry.esiScore <= 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {entry.esiScore}
                        </span>
                      </td>
                      <td className="py-2">{new Date(entry.arrivalTime).toLocaleTimeString()}</td>
                      <td className="py-2">{entry.input?.chiefComplaint || 'N/A'}</td>
                      <td className="py-2">{entry.isOverridden ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}