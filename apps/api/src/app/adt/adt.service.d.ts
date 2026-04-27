import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';
import { Bed, BedEncounter } from '@prisma/client';
export declare const AdmissionSchema: z.ZodObject<{
    patientId: z.ZodString;
    bedId: z.ZodString;
    patientAge: z.ZodNumber;
    version: z.ZodNumber;
}, z.core.$strip>;
export type AdmissionInput = z.infer<typeof AdmissionSchema>;
export declare class AdtService {
    private readonly prisma;
    private readonly eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    admitPatient(input: AdmissionInput): Promise<{
        bed: Bed;
        encounter: BedEncounter;
    }>;
    dischargePatient(patientId: string, bedId: string, dischargeReason: string): Promise<Bed>;
    markBedAsAvailable(bedId: string, version: number): Promise<Bed>;
    transferPatient(patientId: string, fromBedId: string, toBedId: string, fromBedVersion: number, toBedVersion: number): Promise<{
        fromBed: Bed;
        toBed: Bed;
        encounter: BedEncounter;
    }>;
}
//# sourceMappingURL=adt.service.d.ts.map