import { Connection } from 'mongoose';
export interface EncryptedPayload {
    iv: string;
    tag: string;
    ciphertext: string;
    keyVersion: number;
}
export declare class KeyRotationService {
    private readonly connection;
    private readonly logger;
    private readonly algorithm;
    private readonly IV_LENGTH;
    constructor(connection: Connection);
    /**
     * Encrypts data using AES-256-GCM.
     */
    encrypt(text: string, dek: Buffer, keyVersion: number): EncryptedPayload;
    /**
     * Decrypts data encrypted with AES-256-GCM.
     */
    decrypt(payload: EncryptedPayload, dek: Buffer): string;
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
    rotateKeys(modelName: string, fieldName: string, oldDek: Buffer, newDek: Buffer, oldKeyVersion: number, newKeyVersion: number): Promise<{
        rotatedCount: number;
        errors: Error[];
    }>;
    /**
     * Type guard for EncryptedPayload to enforce zero `any` policy.
     */
    private isEncryptedPayload;
}
//# sourceMappingURL=key-rotation.service.d.ts.map