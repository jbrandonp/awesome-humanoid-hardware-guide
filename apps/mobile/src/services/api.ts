import axios from 'axios';

export interface Bed {
  id: string;
  roomNumber: string;
  bedType: 'STANDARD' | 'ICU' | 'PEDIATRIC';
  status: 'OCCUPIED' | 'AVAILABLE' | 'MAINTENANCE';
  patientName?: string;
  lastStatusChange: string;
}

export interface Vital {
  id: string;
  patientId: string;
  patientName: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  recordedAt: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
}

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedWaitMinutes: number;
  checkedInAt: string;
}

export interface MedicationAdministrationData {
  prescriptionId: string;
  nurseId: string;
  status: 'ADMINISTERED' | 'REFUSED' | 'OMITTED' | 'PARTIAL';
  dosageGiven: string;
  route: string;
  administeredAt: string; // ISO string
  isPrn: boolean;
  clinicalJustification?: string | null;
  secondaryNursePin?: string;
  secondaryNurseBadgeId?: string;
}

export class MedicalApi {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getBeds(): Promise<Bed[]> {
    const response = await axios.get(`${this.baseUrl}/nursing-station/beds`);
    return response.data;
  }

  async getVitals(): Promise<Vital[]> {
    const response = await axios.get(`${this.baseUrl}/remote-patient-monitoring/vitals`);
    return response.data;
  }

  async getAlerts(): Promise<Alert[]> {
    const response = await axios.get(`${this.baseUrl}/remote-patient-monitoring/alerts`);
    return response.data;
  }

  async getQueue(): Promise<QueueEntry[]> {
    const response = await axios.get(`${this.baseUrl}/queue`);
    return response.data;
  }

  async updateBedStatus(bedId: string, status: Bed['status']): Promise<Bed> {
    const response = await axios.put(`${this.baseUrl}/nursing-station/beds/${bedId}/status`, { status });
    return response.data;
  }

  async addQueueEntry(patientId: string, patientName: string, priority: QueueEntry['priority']): Promise<QueueEntry> {
    const response = await axios.post(`${this.baseUrl}/queue/add`, { patientId, patientName, priority });
    return response.data;
  }

  async submitVitals(vitals: Omit<Vital, 'id' | 'recordedAt'>): Promise<Vital> {
    const response = await axios.post(`${this.baseUrl}/remote-patient-monitoring/vitals`, vitals);
    return response.data;
  }

  async submitMedicationAdministration(data: MedicationAdministrationData): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/nursing-station/administrations`, data);
    return response.data;
  }
}