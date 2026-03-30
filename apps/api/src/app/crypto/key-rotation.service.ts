import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as crypto from 'crypto';

export interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
  keyVersion: number;
}

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Encrypts data using AES-256-GCM.
   */
  encrypt(text: string, dek: Buffer, keyVersion: number): EncryptedPayload {
    if (dek.length !== 32) {
      throw new Error('Invalid DEK length. AES-256 requires a 32-byte key.');
    }
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, dek, iv);
    let ciphertext = cipher.update(text, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      ciphertext,
      keyVersion,
    };
  }

  /**
   * Decrypts data encrypted with AES-256-GCM.
   */
  decrypt(payload: EncryptedPayload, dek: Buffer): string {
    if (dek.length !== 32) {
      throw new Error('Invalid DEK length. AES-256 requires a 32-byte key.');
    }
    const iv = Buffer.from(payload.iv, 'hex');
    const tag = Buffer.from(payload.tag, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
    decipher.setAuthTag(tag);
    
    let cleartext = decipher.update(payload.ciphertext, 'hex', 'utf8');
    cleartext += decipher.final('utf8');
    return cleartext;
  }

  /**
   * Rotates keys for a specific model by decrypting with the old key and re-encrypting with the new key.
   * Uses atomic $set updates to avoid race conditions.
   * 
   * @param modelName The Mongoose model name.
   * @param fieldName The name of the field to rotate (e.g. 'notes').
   * @param oldDek The old Data Encryption Key (Buffer).
   * @param newDek The new Data Encryption Key (Buffer).
   * @param oldKeyVersion The old key version.
   * @param newKeyVersion The new key version.
   * @returns An object containing the number of successfully rotated documents and any errors.
   */
  async rotateKeys(
    modelName: string,
    fieldName: string,
    oldDek: Buffer,
    newDek: Buffer,
    oldKeyVersion: number,
    newKeyVersion: number
  ): Promise<{ rotatedCount: number; errors: Error[] }> {
    this.logger.log(`Starting key rotation for ${modelName}.${fieldName} from v${oldKeyVersion} to v${newKeyVersion}`);
    
    let model: Model<any>;
    try {
      model = this.connection.model(modelName);
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        this.logger.error(`Model ${modelName} not found.`);
      }
      throw new Error(`Model ${modelName} not registered.`);
    }

    // Find all documents where the encrypted field matches the old key version
    const filter = {
      [`${fieldName}.keyVersion`]: oldKeyVersion,
    };

    // We stream the documents to avoid loading everything into memory (Offline-First devices might have low RAM)
    const cursor = model.find(filter as any).cursor();
    
    let rotatedCount = 0;
    const errors: Error[] = [];

    for await (const doc of cursor) {
      const docRecord = doc as any;
      const encryptedField = docRecord[fieldName] as unknown;

      if (!this.isEncryptedPayload(encryptedField)) {
        this.logger.warn(`Document ${String(docRecord['_id'])} has invalid encrypted payload format. Skipping.`);
        continue;
      }

      try {
        // 1. Decrypt with old DEK
        const cleartext = this.decrypt(encryptedField, oldDek);

        // 2. Encrypt with new DEK
        const newEncryptedPayload = this.encrypt(cleartext, newDek, newKeyVersion);

        // 3. Atomically update the specific field using $set
        const updateResult = await model.updateOne(
          { _id: docRecord['_id'], [`${fieldName}.keyVersion`]: oldKeyVersion }, // ensure it wasn't modified in between
          { $set: { [fieldName]: newEncryptedPayload } }
        );

        if (updateResult.modifiedCount === 1) {
          rotatedCount++;
        } else {
           this.logger.warn(`Failed to update document ${String(docRecord['_id'])} (concurrent modification or not found).`);
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (process.env.NODE_ENV !== 'test') {
          this.logger.error(`Failed to rotate keys for document ${String(docRecord['_id'])}: ${errorMsg}`);
        }
        errors.push(err instanceof Error ? err : new Error(errorMsg));
      }
    }

    this.logger.log(`Finished key rotation for ${modelName}.${fieldName}. Rotated: ${rotatedCount}, Errors: ${errors.length}`);
    return { rotatedCount, errors };
  }

  /**
   * Type guard for EncryptedPayload to enforce zero `any` policy.
   */
  private isEncryptedPayload(obj: unknown): obj is EncryptedPayload {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    const payload = obj as Record<string, unknown>;
    return (
      typeof payload['iv'] === 'string' &&
      typeof payload['tag'] === 'string' &&
      typeof payload['ciphertext'] === 'string' &&
      typeof payload['keyVersion'] === 'number'
    );
  }
}
