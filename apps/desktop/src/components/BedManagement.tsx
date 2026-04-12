import { useState, useEffect } from 'react';
import { MedicalApi, Bed } from '../services/api';
import { Bed as BedIcon, User, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BedManagementProps {
  apiUrl: string;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-300',
  OCCUPIED: 'bg-red-100 text-red-800 border-red-300',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CLEANING: 'bg-blue-100 text-blue-800 border-blue-300',
  OUT_OF_SERVICE: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  AVAILABLE: <CheckCircle className="w-5 h-5" />,
  OCCUPIED: <User className="w-5 h-5" />,
  MAINTENANCE: <AlertCircle className="w-5 h-5" />,
  CLEANING: <RefreshCw className="w-5 h-5" />,
  OUT_OF_SERVICE: <XCircle className="w-5 h-5" />,
};

export function BedManagement({ apiUrl }: BedManagementProps) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = new MedicalApi(apiUrl);

  const loadBeds = async () => {
    try {
      setLoading(true);
      const data = await api.getBeds();
      setBeds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load beds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, [apiUrl]);

  const handleStatusChange = async (bedId: string, newStatus: string) => {
    try {
      await api.updateBedStatus(bedId, newStatus);
      await loadBeds(); // Reload after update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bed status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BedIcon className="w-6 h-6" />
            Gestion des Lits
          </h1>
          <p className="text-gray-600">Affiche l'état des lits et permet de mettre à jour leur statut.</p>
        </div>
        <button
          onClick={loadBeds}
          className="flex items-center gap-2 px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-xl p-4 h-40"></div>
          ))}
        </div>
      ) : beds.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BedIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Aucun lit trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beds.map((bed) => (
            <div
              key={bed.id}
              className={`border rounded-xl p-4 shadow-sm ${statusColors[bed.status] || 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">Lit {bed.roomNumber}</h3>
                  <p className="text-sm opacity-75">Type: {bed.bedType}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${statusColors[bed.status]}`}>
                  {statusIcons[bed.status]}
                  {bed.status}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm mb-2">
                  <span className="font-semibold">Patient:</span>{' '}
                  {bed.currentPatientId ? `ID: ${bed.currentPatientId}` : 'Aucun'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {bed.features.map((feat) => (
                    <span key={feat} className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                  value={bed.status}
                  onChange={(e) => handleStatusChange(bed.id, e.target.value)}
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="OCCUPIED">Occupé</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="CLEANING">Nettoyage</option>
                  <option value="OUT_OF_SERVICE">Hors service</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}