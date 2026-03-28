import { Test, TestingModule } from '@nestjs/testing';
import { KeyRotationService, EncryptedPayload } from './key-rotation.service';
import { getConnectionToken } from '@nestjs/mongoose';
import * as crypto from 'crypto';

describe('KeyRotationService', () => {
  let service: KeyRotationService;
  
  // Mock mongoose connection and model
  let mockCursor: any;
  let mockModel: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockCursor = {
      [Symbol.asyncIterator]: jest.fn().mockImplementation(async function* () {
        // Yield some mock documents
        yield {
          _id: 'doc1',
          notes: {
            iv: 'dummy_iv',
            tag: 'dummy_tag',
            ciphertext: 'dummy_ciphertext',
            keyVersion: 1
          }
        };
        yield {
          _id: 'doc2',
          notes: {
            iv: 'dummy_iv2',
            tag: 'dummy_tag2',
            ciphertext: 'dummy_ciphertext2',
            keyVersion: 1
          }
        };
      })
    };

    mockModel = {
      find: jest.fn().mockReturnValue({
        cursor: () => mockCursor
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
    };

    mockConnection = {
      model: jest.fn().mockImplementation((name) => {
         if (name === 'ClinicalRecord') return mockModel;
         throw new Error("Schema hasn't been registered");
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyRotationService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<KeyRotationService>(KeyRotationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should correctly encrypt and decrypt a string using a valid DEK', () => {
      const dek = crypto.randomBytes(32);
      const plaintext = 'Sensitive psychiatric note about patient X';
      const keyVersion = 1;

      const encrypted = service.encrypt(plaintext, dek, keyVersion);

      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted.keyVersion).toBe(keyVersion);
      expect(encrypted.ciphertext).not.toBe(plaintext);

      const decrypted = service.decrypt(encrypted, dek);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw an error if DEK length is invalid for encryption', () => {
      const invalidDek = crypto.randomBytes(16);
      expect(() => service.encrypt('test', invalidDek, 1)).toThrow('Invalid DEK length');
    });

    it('should throw an error if DEK length is invalid for decryption', () => {
      const validDek = crypto.randomBytes(32);
      const invalidDek = crypto.randomBytes(16);
      const encrypted = service.encrypt('test', validDek, 1);
      
      expect(() => service.decrypt(encrypted, invalidDek)).toThrow('Invalid DEK length');
    });

    it('should throw an error if decrypting with the wrong DEK', () => {
      const dek1 = crypto.randomBytes(32);
      const dek2 = crypto.randomBytes(32);
      const encrypted = service.encrypt('test', dek1, 1);

      expect(() => service.decrypt(encrypted, dek2)).toThrow();
    });
  });

  describe('rotateKeys', () => {
    it('should rotate keys successfully for all documents in the cursor', async () => {
      // Overwrite the encrypt/decrypt methods for the mock test to avoid actual crypto operations on dummy data
      const mockEncrypt = jest.spyOn(service, 'encrypt').mockReturnValue({
        iv: 'new_iv',
        tag: 'new_tag',
        ciphertext: 'new_ciphertext',
        keyVersion: 2
      });
      const mockDecrypt = jest.spyOn(service, 'decrypt').mockReturnValue('decrypted_text');

      const oldDek = crypto.randomBytes(32);
      const newDek = crypto.randomBytes(32);

      const result = await service.rotateKeys('ClinicalRecord', 'notes', oldDek, newDek, 1, 2);

      expect(mockConnection.model).toHaveBeenCalledWith('ClinicalRecord');
      expect(mockModel.find).toHaveBeenCalledWith({ 'notes.keyVersion': 1 });
      
      // Should have decrypted twice (for doc1 and doc2)
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockEncrypt).toHaveBeenCalledTimes(2);
      
      // Should have updated twice
      expect(mockModel.updateOne).toHaveBeenCalledTimes(2);
      expect(mockModel.updateOne).toHaveBeenCalledWith(
        { _id: 'doc1', 'notes.keyVersion': 1 },
        { $set: { notes: { iv: 'new_iv', tag: 'new_tag', ciphertext: 'new_ciphertext', keyVersion: 2 } } }
      );

      expect(result.rotatedCount).toBe(2);
      expect(result.errors.length).toBe(0);

      mockEncrypt.mockRestore();
      mockDecrypt.mockRestore();
    });

    it('should handle missing models gracefully', async () => {
      const oldDek = crypto.randomBytes(32);
      const newDek = crypto.randomBytes(32);

      await expect(service.rotateKeys('UnknownModel', 'notes', oldDek, newDek, 1, 2)).rejects.toThrow('Model UnknownModel not registered.');
    });

    it('should skip documents with invalid payload format', async () => {
      mockCursor = {
        [Symbol.asyncIterator]: jest.fn().mockImplementation(async function* () {
          yield {
            _id: 'doc3',
            notes: 'not_an_object' // Invalid format
          };
          yield {
            _id: 'doc4',
            notes: { iv: 'missing_tag_and_ciphertext' } // Invalid format
          };
        })
      };

      const oldDek = crypto.randomBytes(32);
      const newDek = crypto.randomBytes(32);

      const result = await service.rotateKeys('ClinicalRecord', 'notes', oldDek, newDek, 1, 2);

      expect(result.rotatedCount).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(mockModel.updateOne).not.toHaveBeenCalled();
    });

    it('should record errors if decryption or update fails for a document', async () => {
      const mockDecrypt = jest.spyOn(service, 'decrypt').mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const oldDek = crypto.randomBytes(32);
      const newDek = crypto.randomBytes(32);

      const result = await service.rotateKeys('ClinicalRecord', 'notes', oldDek, newDek, 1, 2);

      expect(result.rotatedCount).toBe(0);
      expect(result.errors.length).toBe(2); // Failed for both doc1 and doc2
      expect(result.errors[0].message).toBe('Decryption failed');

      mockDecrypt.mockRestore();
    });
  });
});
