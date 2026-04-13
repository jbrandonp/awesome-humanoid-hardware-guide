import { PrismaService } from '../prisma/prisma.service';
export declare class ProcurementService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDrafts(): Promise<unknown>;
    approveDraft(id: string, updates?: {
        quantity?: number;
        supplierId?: string;
    }): Promise<unknown>;
}
//# sourceMappingURL=procurement.service.d.ts.map