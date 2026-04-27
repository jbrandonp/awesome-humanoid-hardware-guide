import { OcrService } from './ocr.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class OcrController {
    private readonly ocrService;
    private readonly prisma;
    constructor(ocrService: OcrService, prisma: PrismaService);
    extractVitals(text: string, patientId: string, forceInjection?: boolean): Promise<{
        message: string;
        entities: unknown[];
        vitalId: string;
    }>;
}
//# sourceMappingURL=ocr.controller.d.ts.map