import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActionType, DicomStudyStatus } from '@prisma/client';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';


if (!isMainThread) {
  const dicomParser = require('dicom-parser');
  try {
    const byteArray = new Uint8Array(workerData);
    const dataSet = dicomParser.parseDicom(byteArray);
    if (parentPort) {
      parentPort.postMessage({
        patientId: dataSet.string('x00100020') || null,
        studyInstanceUID: dataSet.string('x0020000d') || null,
        seriesInstanceUID: dataSet.string('x0020000e') || null,
        sopInstanceUID: dataSet.string('x00080018') || null,
      });
    }
  } catch (error) {
    throw error;
  }
}

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

@Processor('pacs-indexer', {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
@Injectable()
export class PacsIndexerProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PacsIndexerProcessor.name);
  private s3Client!: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  onModuleInit() {
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('CRITICAL: S3 credentials (S3_ACCESS_KEY, S3_SECRET_KEY) are missing. PACS Indexing will fail.');
      return;
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Downloads only the first 2MB of the DICOM file to extract the header,
   * avoiding full file download into RAM.
   */
  private async downloadDicomHeader(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: 'bytes=0-2097152', // Download first 2MB
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Failed to download DICOM from S3: ${bucket}/${key}`);
    }

    const chunks: Uint8Array[] = [];
    if (response.Body instanceof Readable) {
      for await (const chunk of response.Body) {
        chunks.push(chunk as Uint8Array);
      }
    } else {
      throw new Error('Unsupported S3 body type');
    }
    return Buffer.concat(chunks);
  }

  private async parseDicomMetadata(buffer: Buffer): Promise<DicomMetadata> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: buffer });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }

  async process(job: Job<PacsIndexerJobData, void, string>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for key ${job.data.objectKey}`);
    try {
      // Step 1: DICOM S3 Download and Parsing Logic
      const buffer = await this.downloadDicomHeader(job.data.bucket, job.data.objectKey);
      const metadata = await this.parseDicomMetadata(buffer);

      this.logger.log(`Parsed metadata: ${JSON.stringify(metadata)}`);

      if (!metadata.studyInstanceUID || !metadata.seriesInstanceUID || !metadata.sopInstanceUID) {
        throw new Error('Incomplete DICOM hierarchy identifiers in file header');
      }

      // Step 2: Prisma Upserts and Patient Reconciliation
      let dbPatientId: string | null = null;
      let status: DicomStudyStatus = DicomStudyStatus.ORPHANED;

      if (metadata.patientId) {
        // Assume patientId from DICOM matches our Patient ID (UUID) or an external ID that we would search by. 
        // We will try finding the patient by ID directly.
        const patient = await this.prisma.patient.findUnique({
          where: { id: metadata.patientId },
        });

        if (patient) {
          dbPatientId = patient.id;
          status = DicomStudyStatus.MATCHED;
        } else {
          this.logger.warn(`PatientID ${metadata.patientId} from DICOM not found in database. Marking as ORPHANED.`);
        }
      } else {
        this.logger.warn(`No PatientID found in DICOM file. Marking as ORPHANED.`);
      }

      if (status === DicomStudyStatus.ORPHANED && dbPatientId === null) {
        // Trigger alert for an administrator via NotificationStatus table
        // Since we don't have a specific admin ID, we queue a system-level alert.
        await this.prisma.notificationStatus.create({
          data: {
            patientId: '00000000-0000-0000-0000-000000000000', // system user or general admin alert bucket
            channel: 'SYSTEM_ALERT',
            messagePayload: JSON.stringify({
              event: 'DICOM_ORPHANED',
              studyInstanceUID: metadata.studyInstanceUID,
              dicomPatientId: metadata.patientId,
              message: 'Manual reconciliation required for new DICOM study.'
            }),
            status: 'QUEUED'
          }
        });
      }

      // Upsert DicomStudy
      const study = await this.prisma.dicomStudy.upsert({
        where: { studyInstanceUID: metadata.studyInstanceUID },
        create: {
          studyInstanceUID: metadata.studyInstanceUID,
          dicomPatientId: metadata.patientId,
          patientId: dbPatientId,
          status,
        },
        update: {
          dicomPatientId: metadata.patientId,
          patientId: dbPatientId,
          status,
        },
      });

      // Upsert DicomSeries
      const series = await this.prisma.dicomSeries.upsert({
        where: { seriesInstanceUID: metadata.seriesInstanceUID },
        create: {
          seriesInstanceUID: metadata.seriesInstanceUID,
          studyId: study.id,
        },
        update: {
          studyId: study.id,
        },
      });

      // Upsert DicomInstance
      const instance = await this.prisma.dicomInstance.upsert({
        where: { sopInstanceUID: metadata.sopInstanceUID },
        create: {
          sopInstanceUID: metadata.sopInstanceUID,
          seriesId: series.id,
        },
        update: {
          seriesId: series.id,
        },
      });

      // Audit Logging
      const systemUserId = '00000000-0000-0000-0000-000000000000'; // Replace with a configured system user if needed
      await this.auditService.logAudit({
        userId: systemUserId,
        patientId: dbPatientId || 'ORPHANED',
        actionType: ActionType.CREATE,
        resourceId: instance.id,
        phiDataAccessed: {
          dicomPatientId: metadata.patientId,
          studyInstanceUID: metadata.studyInstanceUID,
          status: status,
        },
        ipAddress: '127.0.0.1', // Background worker
      });

      // Step 3: Thumbnail Generation
      // Extract first frame and upload to pacs-thumbnails
      // Due to the complexity of DICOM pixel data parsing, we use a lightweight external tool like `dcmjs` or a child process (e.g. ImageMagick/dcmtk)
      // We'll write a mock child process function using dcmjs or assuming dcmj2pnm is available in our docker.
      const thumbnailUrl = await this.generateThumbnail(job.data.bucket, job.data.objectKey, instance.id);

      if (thumbnailUrl) {
        await this.prisma.dicomInstance.update({
          where: { id: instance.id },
          data: { thumbnailUrl }
        });
      }

    } catch (error) {
      this.logger.error(`Error processing job ${job.id}: ${error}`);
      if (job.attemptsMade && job.opts.attempts && job.attemptsMade >= job.opts.attempts - 1) {
        // Entering Dead Letter Queue (DLQ) state on final failure
        this.logger.error(`CRITICAL ALERT: Job ${job.id} for ${job.data.objectKey} has failed all retries and is now in DLQ.`);
        await this.prisma.notificationStatus.create({
          data: {
            patientId: '00000000-0000-0000-0000-000000000000', // system user or general admin alert bucket
            channel: 'SYSTEM_ALERT',
            messagePayload: JSON.stringify({
              event: 'DICOM_DLQ_CRITICAL',
              jobId: job.id,
              objectKey: job.data.objectKey,
              error: error instanceof Error ? error.message : String(error)
            }),
            status: 'QUEUED'
          }
        });
      }
      // BullMQ will handle the retry logic via exponential backoff.
      throw error;
    }
  }

  /**
   * Example Thumbnail Generation using dcmjs or an external tool (dcmj2pnm/dcmtk).
   * For production, we prefer not to load the whole DICOM pixel data into RAM in Node.js.
   * A child process with bounded resources is safer.
   */
  private async generateThumbnail(bucket: string, objectKey: string, instanceId: string): Promise<string | null> {
    const tempDicomPath = path.join(os.tmpdir(), `${instanceId}.dcm`);
    const tempJpegPath = path.join(os.tmpdir(), `${instanceId}.jpg`);

    try {
      // Download full DICOM to a temporary file (to keep RAM low)
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) return null;

      const writeStream = fs.createWriteStream(tempDicomPath);
      await new Promise<void>((resolve, reject) => {
        if (response.Body instanceof Readable) {
          response.Body.pipe(writeStream);
          response.Body.on('error', reject);
          writeStream.on('finish', resolve);
        } else {
          reject(new Error('Unsupported S3 body type for streaming'));
        }
      });

      // Extract frame using dcmj2pnm (DCMTK) - max 256x256
      await new Promise<void>((resolve, reject) => {
        // If dcmtk is not installed, this will fail. We use it as the "industrial grade" approach.
        // You could also use an npm package like dcmjs-dimse or python integration.
        const pnm = spawn('dcmj2pnm', [
          '+oj', '+Wn', // output jpeg, window level
          '+Sxi', '256', // max size 256
          tempDicomPath, tempJpegPath
        ]);
        pnm.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`dcmj2pnm exited with code ${code}`));
        });
        pnm.on('error', (err) => {
          this.logger.warn(`dcmj2pnm not found or failed, falling back or skipping thumbnail: ${err.message}`);
          reject(err);
        });
      }).catch((_e) => { /* ignore */ }); // Ignore error and skip thumbnail if tool missing

      if (fs.existsSync(tempJpegPath)) {
        const jpegBuffer = fs.readFileSync(tempJpegPath);
        const thumbKey = `${instanceId}.jpg`;

        await this.s3Client.send(new PutObjectCommand({
          Bucket: 'pacs-thumbnails',
          Key: thumbKey,
          Body: jpegBuffer,
          ContentType: 'image/jpeg'
        }));

        const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
        return `${s3Endpoint}/pacs-thumbnails/${thumbKey}`;
      }

      return null;

    } catch (e) {
      this.logger.error(`Thumbnail generation failed for instance ${instanceId}`, e);
      return null;
    } finally {
      // Robust cleanup to prevent disk leaks (using try-catch for safety)
      try {
        if (fs.existsSync(tempDicomPath)) fs.unlinkSync(tempDicomPath);
        if (fs.existsSync(tempJpegPath)) fs.unlinkSync(tempJpegPath);
      } catch (unlinkError) {
        this.logger.warn(`Failed to cleanup temp PACS files: ${unlinkError}`);
      }
    }
  }
}
