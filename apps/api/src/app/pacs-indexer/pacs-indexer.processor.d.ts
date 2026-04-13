import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export interface PacsIndexerJobData {
    bucket: string;
    objectKey: string;
}
export interface DicomMetadata {
    patientId: string | null;
    studyInstanceUID: string | null;
    seriesInstanceUID: string | null;
    sopInstanceUID: string | null;
}
export declare class PacsIndexerProcessor extends WorkerHost implements OnModuleInit {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private s3Client;
    constructor(prisma: PrismaService, auditService: AuditService);
    onModuleInit(): void;
    /**
     * Downloads only the first 2MB of the DICOM file to extract the header,
     * avoiding full file download into RAM.
     */
    private downloadDicomHeader;
    private parseDicomMetadata;
    process(job: Job<PacsIndexerJobData, void, string>): Promise<void>;
    /**
     * Example Thumbnail Generation using dcmjs or an external tool (dcmj2pnm/dcmtk).
     * For production, we prefer not to load the whole DICOM pixel data into RAM in Node.js.
     * A child process with bounded resources is safer.
     */
    private generateThumbnail;
}
//# sourceMappingURL=pacs-indexer.processor.d.ts.map