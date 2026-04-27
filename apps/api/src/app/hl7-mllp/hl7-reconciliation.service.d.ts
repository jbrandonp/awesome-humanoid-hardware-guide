import { PrismaService } from '../prisma/prisma.service';
export declare class Hl7ReconciliationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findPatient(patientLabId: string | null, patientNameRaw: string | null, patientDobRaw: string | null): Promise<string | null>;
}
//# sourceMappingURL=hl7-reconciliation.service.d.ts.map