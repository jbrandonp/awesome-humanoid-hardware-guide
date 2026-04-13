import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
import { z } from 'zod';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare const IotDeviceMetadataSchema: z.ZodObject<{
    hardwareMacAddress: z.ZodString;
    manufacturerName: z.ZodString;
    batteryLevelPercentage: z.ZodNumber;
}, z.core.$strip>;
export declare const BleBloodPressurePayloadSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    deviceMetadata: z.ZodObject<{
        hardwareMacAddress: z.ZodString;
        manufacturerName: z.ZodString;
        batteryLevelPercentage: z.ZodNumber;
    }, z.core.$strip>;
    systolicMmHg: z.ZodNumber;
    diastolicMmHg: z.ZodNumber;
    meanArterialPressureMmHg: z.ZodNumber;
    pulseRateBpm: z.ZodOptional<z.ZodNumber>;
    acquisitionTimestampIso: z.ZodString;
}, z.core.$strip>;
export declare const SmartPenInkPayloadSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    deviceMetadata: z.ZodObject<{
        hardwareMacAddress: z.ZodString;
        manufacturerName: z.ZodString;
        batteryLevelPercentage: z.ZodNumber;
    }, z.core.$strip>;
    rawSvgPathData: z.ZodString;
    acquisitionTimestampIso: z.ZodString;
}, z.core.$strip>;
export type BleBloodPressurePayload = z.infer<typeof BleBloodPressurePayloadSchema>;
export type SmartPenInkPayload = z.infer<typeof SmartPenInkPayloadSchema>;
export interface IotIngestionResult {
    status: 'SUCCESS' | 'QUEUED' | 'REJECTED';
    vitalRecordId?: string;
    message: string;
    warning?: string;
}
export declare class IotMedicalService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly consentManager;
    private readonly eventEmitter;
    private readonly logger;
    private watchdogInterval;
    private fallbackQueue;
    private isProcessingQueue;
    private readonly AUTHORIZED_SENSORS_MAC;
    constructor(prisma: PrismaService, consentManager: DpdpaConsentService, eventEmitter: EventEmitter2);
    onModuleInit(): void;
    onModuleDestroy(): void;
    /**
     * INGESTION SÉCURISÉE DES DONNÉES BLUETOOTH LOW ENERGY (Tensiomètres)
     */
    processBleGattData(rawPayload: unknown, fromQueue?: boolean): Promise<IotIngestionResult>;
    /**
     * INGESTION SÉCURISÉE DES TRACÉS DE STYLOS INTELLIGENTS (WONDRx)
     */
    processSmartPenInk(rawPayload: unknown, fromQueue?: boolean): Promise<IotIngestionResult>;
    private enqueueForLater;
    private processFallbackQueue;
    /**
     * Utilitaire de création autonome de log de sécurité (Isolé).
     */
    private logSecurityEvent;
}
//# sourceMappingURL=iot.service.d.ts.map