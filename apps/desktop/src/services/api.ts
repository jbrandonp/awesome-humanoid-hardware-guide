export interface Bed {
  id: string;
  roomNumber: string;
  bedType: string;
  status: string;
  currentPatientId: string | null;
  features: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string | null;
  otp: string | null;
  otpExpiresAt: string | null;
  zipCode: string | null;
  status: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vital {
  id: string;
  patientId: string;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  glucose: number | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  deletedAt: string | null;
}

export interface Alert {
  id: string;
  patientId: string;
  type: string;
  message: string;
  timestamp: string;
  systolicMmHg?: number;
  diastolicMmHg?: number;
  pulseRateBpm?: number;
}

export interface QueueEntry {
  patientId: string;
  esiScore: number;
  arrivalTime: string;
  input: any;
  isOverridden?: boolean;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export class MedicalApi {
  constructor(private baseUrl: string) {}

  async getBeds(): Promise<Bed[]> {
    return fetchJson(`${this.baseUrl}/nursing-station/beds`);
  }

  async getBed(id: string): Promise<Bed> {
    return fetchJson(`${this.baseUrl}/nursing-station/beds/${id}`);
  }

  async updateBedStatus(id: string, status: string): Promise<Bed> {
    return fetchJson(`${this.baseUrl}/nursing-station/beds/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async getPatients(): Promise<Patient[]> {
    return fetchJson(`${this.baseUrl}/nursing-station/patients`);
  }

  async getVitals(patientId?: string): Promise<Vital[]> {
    const url = patientId 
      ? `${this.baseUrl}/remote-patient-monitoring/vitals?patientId=${patientId}`
      : `${this.baseUrl}/remote-patient-monitoring/vitals`;
    return fetchJson(url);
  }

  async getLatestVitals(patientId: string): Promise<Vital | null> {
    return fetchJson(`${this.baseUrl}/remote-patient-monitoring/vitals/latest/${patientId}`);
  }

  async getAlerts(): Promise<Alert[]> {
    return fetchJson(`${this.baseUrl}/remote-patient-monitoring/alerts`);
  }

  async getQueue(): Promise<QueueEntry[]> {
    return fetchJson(`${this.baseUrl}/queue`);
  }

  async addPatientToQueue(patientId: string, input: any): Promise<QueueEntry> {
    return fetchJson(`${this.baseUrl}/queue/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, input }),
    });
  }

  async overrideTriage(patientId: string, newScore: number, nurseId: string, overrideReason: string): Promise<QueueEntry> {
    return fetchJson(`${this.baseUrl}/queue/${patientId}/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newScore, nurseId, overrideReason }),
    });
  }
}