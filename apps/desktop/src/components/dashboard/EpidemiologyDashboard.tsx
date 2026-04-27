import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Filter, Calendar, Activity, Users, FileText } from 'lucide-react';
import { EpidemiologyRecord, FilterCriteria, ChartDataResult } from './epidemiology.worker';

// Simulated large dataset generator (runs once on mount)
function generateMockData(count: number): EpidemiologyRecord[] {
  const specialties = ['Cardiology', 'Pediatrics', 'General Practice', 'Neurology', 'Oncology'];
  const icd10Codes = ['J00', 'I10', 'E11', 'J20', 'M54', 'K21', 'N39', 'L03', 'F41', 'H10'];
  const now = Date.now();
  const yearInMs = 365 * 24 * 60 * 60 * 1000;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `rec-${i}`,
    date: new Date(now - Math.random() * yearInMs).toISOString(),
    age: Math.floor(Math.random() * 100),
    specialty: specialties[Math.floor(Math.random() * specialties.length)],
    icd10: icd10Codes[Math.floor(Math.random() * icd10Codes.length)],
  }));
}

export function EpidemiologyDashboard() {
  const [filters, setFilters] = useState<FilterCriteria>({
    startDate: null,
    endDate: null,
    minAge: null,
    maxAge: null,
    specialty: null,
    icd10: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartDataResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Use useMemo so we generate the mock data only once
  const mockData = useMemo(() => generateMockData(50000), []);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL('./epidemiology.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e: MessageEvent<ChartDataResult>) => {
      setChartData(e.data);
      setIsLoading(false);
    };

    return () => {
      // Clean up worker on unmount
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    // Trigger worker processing when filters or data change
    if (workerRef.current) {
      setIsLoading(true);
      workerRef.current.postMessage({ records: mockData, filters });
    }
  }, [filters, mockData]);

  const handleFilterChange = (key: keyof FilterCriteria, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value || null }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-medical-surface text-slate-800 dark:text-medical-text rounded-xl shadow-lg border border-slate-200 dark:border-medical-border overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-medical-border bg-white dark:bg-medical-dark flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-medical-primary" />
            Tableau de Bord Épidémiologique
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyse haute performance de {mockData.length.toLocaleString()} dossiers patients (Worker Thread)
          </p>
        </div>
        {!isLoading && chartData && (
          <div className="bg-medical-primary/10 text-medical-primary px-4 py-2 rounded-lg flex items-center gap-2 font-semibold">
            <Users className="w-5 h-5" />
            {chartData.totalCases.toLocaleString()} Cas Filtrés
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        <div className="w-80 border-r border-slate-200 dark:border-medical-border bg-white dark:bg-medical-surface p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filtres Avancés
          </h3>
          
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Période
              </label>
              <div className="space-y-2">
                <input 
                  type="date" 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <input 
                  type="date" 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Tranche d'âge</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                  onChange={(e) => handleFilterChange('minAge', e.target.value ? Number(e.target.value) : null)}
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                  onChange={(e) => handleFilterChange('maxAge', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> Spécialité
              </label>
              <select 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
              >
                <option value="">Toutes les spécialités</option>
                <option value="Cardiology">Cardiologie</option>
                <option value="Pediatrics">Pédiatrie</option>
                <option value="General Practice">Médecine Générale</option>
                <option value="Neurology">Neurologie</option>
                <option value="Oncology">Oncologie</option>
              </select>
            </div>

            {/* ICD-10 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Code CIM-10
              </label>
              <input 
                type="text" 
                placeholder="Ex: J00" 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-medical-primary"
                onChange={(e) => handleFilterChange('icd10', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/50">
          {isLoading || !chartData ? (
            // Elegant Skeleton Loaders
            <div className="grid grid-cols-2 gap-6 h-full">
              <div className="col-span-2 h-72 bg-white dark:bg-medical-surface rounded-xl animate-pulse p-6">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-80 bg-white dark:bg-medical-surface rounded-xl animate-pulse p-6">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-full scale-75"></div>
              </div>
              <div className="h-80 bg-white dark:bg-medical-surface rounded-xl animate-pulse p-6">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          ) : (
            // Charts Grid
            <div className="grid grid-cols-2 gap-6">
              
              {/* Timeline Chart */}
              <div className="col-span-2 bg-white dark:bg-medical-surface p-6 rounded-xl shadow-sm border border-slate-200 dark:border-medical-border">
                <h3 className="text-lg font-semibold mb-4">Évolution Temporelle</h3>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer>
                    <LineChart data={chartData.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="date" tick={{fill: '#64748b'}} tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', {month: 'short', year: '2-digit'})} minTickGap={30} />
                      <YAxis tick={{fill: '#64748b'}} />
                      <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                      <Line type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top ICD-10 Bar Chart */}
              <div className="bg-white dark:bg-medical-surface p-6 rounded-xl shadow-sm border border-slate-200 dark:border-medical-border">
                <h3 className="text-lg font-semibold mb-4">Top Codes CIM-10</h3>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer>
                    <BarChart data={chartData.icd10Data} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                      <XAxis type="number" tick={{fill: '#64748b'}} />
                      <YAxis dataKey="name" type="category" tick={{fill: '#64748b'}} width={40} />
                      <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} cursor={{fill: '#334155', opacity: 0.1}} />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Specialty Pie Chart */}
              <div className="bg-white dark:bg-medical-surface p-6 rounded-xl shadow-sm border border-slate-200 dark:border-medical-border">
                <h3 className="text-lg font-semibold mb-4">Répartition par Spécialité</h3>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={chartData.specialtyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.specialtyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
