import { PrismaService } from '../prisma/prisma.service';
import type { Cache } from 'cache-manager';
export declare class EpidemiologyReportService {
    private prisma;
    private cacheManager;
    private readonly logger;
    constructor(prisma: PrismaService, cacheManager: Cache);
    generateDailyReport(): Promise<void>;
    getReport(startDate: Date, endDate: Date): Promise<unknown>;
}
//# sourceMappingURL=epidemiology-report.service.d.ts.map