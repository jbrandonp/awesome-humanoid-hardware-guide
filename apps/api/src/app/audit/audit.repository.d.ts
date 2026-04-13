import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AuditLog } from '@prisma/client';
export declare class AuditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog>;
    findMany(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.AuditLogWhereUniqueInput;
        where?: Prisma.AuditLogWhereInput;
        orderBy?: Prisma.AuditLogOrderByWithRelationInput;
    }): Promise<AuditLog[]>;
}
//# sourceMappingURL=audit.repository.d.ts.map