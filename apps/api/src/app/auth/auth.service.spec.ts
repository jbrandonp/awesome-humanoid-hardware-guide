import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { BlacklistService } from './blacklist.service';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let blacklistService: BlacklistService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.TOKEN_ENCRYPTION_KEY = '12345678901234567890123456789012';

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      decode: jest
        .fn()
        .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      verify: jest.fn(),
    };

    const mockBlacklistService = {
      invalidateToken: jest.fn(),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    const mockPrismaService = {};

    service = new AuthService(
      mockJwtService as any,
      mockBlacklistService as any,
      mockPrismaService as any,
    );
    jwtService = mockJwtService as any;
    blacklistService = mockBlacklistService as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor validation', () => {
    it('should throw error if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => new AuthService({} as any, {} as any, {} as any)).toThrow(
        'CRITICAL SECURITY ERROR: JWT_SECRET is not defined',
      );
    });

    it('should throw error if TOKEN_ENCRYPTION_KEY is too short', () => {
      process.env.JWT_SECRET = 'secret';
      process.env.JWT_REFRESH_SECRET = 'refresh';
      process.env.TOKEN_ENCRYPTION_KEY = 'short';
      expect(() => new AuthService({} as any, {} as any, {} as any)).toThrow(
        'CRITICAL SECURITY ERROR: TOKEN_ENCRYPTION_KEY must be at least 32 characters long',
      );
    });
  });

  describe('login', () => {
    it('should throw if JWT_SECRET is missing at runtime', async () => {
      const orig = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      await expect(service.login('user123', 'DOCTOR')).rejects.toThrow(
        'CRITICAL SECURITY ERROR: JWT_SECRET is not defined in environment variables.',
      );
      process.env.JWT_SECRET = orig;
    });

    it('should throw if JWT_REFRESH_SECRET is missing at runtime', async () => {
      const orig = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      await expect(service.login('user123', 'DOCTOR')).rejects.toThrow(
        'CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET is not defined in environment variables.',
      );
      process.env.JWT_REFRESH_SECRET = orig;
    });

    it('should generate an access token and an encrypted refresh token', async () => {
      const result = await service.login('user123', 'DOCTOR');

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();

      // Check encryption format (iv:authTag:encrypted)
      const parts = result.refreshToken.split(':');
      expect(parts.length).toBe(3);
    });
  });

  describe('logout', () => {
    it('should invalidate the decrypted refresh token via blacklist service', async () => {
      // Manually encrypt a token to test decryption and invalidation
      const rawToken = 'raw-refresh-token';
      const secret = crypto
        .createHash('sha256')
        .update(process.env.TOKEN_ENCRYPTION_KEY!)
        .digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
      let encrypted = cipher.update(rawToken, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const encryptedToken = iv.toString('hex') + ':' + authTag + ':' + encrypted;

      await service.logout(encryptedToken);

      expect(jwtService.decode).toHaveBeenCalledWith(rawToken);
      expect(blacklistService.invalidateToken).toHaveBeenCalled();
    });
  });

  describe('isRefreshTokenValid', () => {
    it('should return false if the token is blacklisted', async () => {
      (blacklistService.isTokenBlacklisted as any).mockResolvedValue(true);
      const rawToken = 'raw-refresh-token';
      const secret = crypto
        .createHash('sha256')
        .update(process.env.TOKEN_ENCRYPTION_KEY!)
        .digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
      let encrypted = cipher.update(rawToken, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const encryptedToken = iv.toString('hex') + ':' + authTag + ':' + encrypted;

      const isValid = await service.isRefreshTokenValid(encryptedToken);

      expect(isValid).toBe(false);
    });

    it('should return true if token is valid and not blacklisted', async () => {
      (blacklistService.isTokenBlacklisted as any).mockResolvedValue(false);
      const rawToken = 'raw-refresh-token';
      const secret = crypto
        .createHash('sha256')
        .update(process.env.TOKEN_ENCRYPTION_KEY!)
        .digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
      let encrypted = cipher.update(rawToken, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const encryptedToken = iv.toString('hex') + ':' + authTag + ':' + encrypted;

      const isValid = await service.isRefreshTokenValid(encryptedToken);

      expect(isValid).toBe(true);
    });
  });
});
