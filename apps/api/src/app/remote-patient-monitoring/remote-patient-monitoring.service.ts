import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OnEvent } from '@nestjs/event-emitter';
import type { BleBloodPressurePayload } from '../iot/iot.service';
import { EpiTickerService, TickerAlert } from '../ticker/epi-ticker.service';

@Injectable()
export class RemotePatientMonitoringService {
  private readonly logger = new Logger(RemotePatientMonitoringService.name);

  // In-memory cache to store the last measurement per patient ID
  // Map<patientId, BleBloodPressurePayload>
  private lastMeasurements: Map<string, BleBloodPressurePayload> = new Map();

  // Mock vitals data for development
  private mockVitals: any[] = [
    {
      id: 'vital-1',
      patientId: 'patient-1',
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.6,
      glucose: 5.2,
      recordedAt: new Date(Date.now() - 3600000), // 1 hour ago
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'created',
      deletedAt: null,
    },
    {
      id: 'vital-2',
      patientId: 'patient-1',
      bloodPressure: '118/78',
      heartRate: 70,
      temperature: 36.8,
      glucose: 5.0,
      recordedAt: new Date(Date.now() - 7200000), // 2 hours ago
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'created',
      deletedAt: null,
    },
    {
      id: 'vital-3',
      patientId: 'patient-2',
      bloodPressure: '135/85',
      heartRate: 80,
      temperature: 37.2,
      glucose: 6.1,
      recordedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'created',
      deletedAt: null,
    },
  ];

  // Mock alerts
  private mockAlerts: any[] = [];

  // Thresholds
  private readonly SYSTOLIC_THRESHOLD_MMHG = 180;
  // Note: the payload doesn't currently contain SpO2, but the prompt gave "ex: si SpO2 < 92% ou Tension Systolique > 180 mmHg sur 2 mesures consécutives".
  // We will check what is available in BleBloodPressurePayload: systolicMmHg, diastolicMmHg, pulseRateBpm, etc.
  
  constructor(private readonly tickerService: EpiTickerService) {}

  @OnEvent('iot.vitals.received')
   handleVitalsReceived(payload: BleBloodPressurePayload): void {
    this.logger.log(`[RPM] Reçu de nouvelles constantes vitales pour le patient: ${payload.patientId}`);
    
    // Evaluate rules
    const isCriticalNow = this.evaluateCriticalThresholds(payload);

    if (isCriticalNow) {
      const lastMeasurement = this.lastMeasurements.get(payload.patientId);
      
      if (lastMeasurement && this.evaluateCriticalThresholds(lastMeasurement)) {
        // Trigger escalation
        this.triggerHighPriorityAlert(payload);
        
        // Optionally, clear the cache for this patient so we don't spam alerts if the 3rd measurement is also critical
        this.lastMeasurements.delete(payload.patientId);
      } else {
        // First time it's critical, store it and wait for next measurement
        this.lastMeasurements.set(payload.patientId, payload);
      }
    } else {
      // Not critical, clear the cache to ensure consecutive requirement
      this.lastMeasurements.delete(payload.patientId);
    }
  }

  private evaluateCriticalThresholds(payload: BleBloodPressurePayload): boolean {
    if (payload.systolicMmHg > this.SYSTOLIC_THRESHOLD_MMHG) {
      return true;
    }
    return false;
  }

   private triggerHighPriorityAlert(payload: BleBloodPressurePayload): void {
    this.logger.error(`[CRITICAL ALERT] Constantes vitales dangereuses détectées (Tension Systolique > ${this.SYSTOLIC_THRESHOLD_MMHG} mmHg) pour le patient ${payload.patientId}`);

    const alert: TickerAlert = {
      id: `RPM-${Date.now()}-${randomUUID()}`,
      type: 'SYSTEM', // Using SYSTEM to force high priority/red banner in the UI
      message: `🚨 ALERTE CLINIQUE (HAUTE PRIORITÉ) : Le patient a une Tension Systolique critique de ${payload.systolicMmHg} mmHg sur 2 mesures consécutives.`,
      timestamp: new Date()
    };

    this.tickerService.broadcastAlert(alert);
    // Store alert for REST API
    this.mockAlerts.push({
      id: alert.id,
      patientId: payload.patientId,
      type: alert.type,
      message: alert.message,
      timestamp: alert.timestamp,
      systolicMmHg: payload.systolicMmHg,
      diastolicMmHg: payload.diastolicMmHg,
      pulseRateBpm: payload.pulseRateBpm,
    });
  }

  async getVitals(patientId?: string): Promise<any[]> {
    if (patientId) {
      return this.mockVitals.filter(v => v.patientId === patientId);
    }
    return this.mockVitals;
  }

  async getLatestVitals(patientId: string): Promise<any | null> {
    const vitals = this.mockVitals
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    return vitals.length > 0 ? vitals[0] : null;
  }

  async getAlerts(): Promise<any[]> {
    return this.mockAlerts;
  }
}
