import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { BlacklistService } from './blacklist.service';
import * as crypto from 'crypto';

class MockPrismaService {}

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
      decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
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
      mockPrismaService as any
    );
    jwtService = mockJwtService as any;
    blacklistService = mockBlacklistService as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should generate an access token and an encrypted refresh token', async () => {
      const result = await service.login('user123', 'DOCTOR');

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();

      // Check encryption format (iv:hex)
      const parts = result.refreshToken.split(':');
      expect(parts.length).toBe(2);
    });
  });

  describe('logout', () => {
    it('should invalidate the decrypted refresh token via blacklist service', async () => {
      // Manually encrypt a token to test decryption and invalidation
      const rawToken = 'raw-refresh-token';
      const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY.substring(0, 32));
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
      let encrypted = cipher.update(rawToken, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const encryptedToken = iv.toString('hex') + ':' + encrypted;

      await service.logout(encryptedToken);

      expect(jwtService.decode).toHaveBeenCalledWith(rawToken);
      expect(blacklistService.invalidateToken).toHaveBeenCalled();
    });
  });

  describe('isRefreshTokenValid', () => {
     it('should return false if the token is blacklisted', async () => {
        (blacklistService.isTokenBlacklisted as any).mockResolvedValue(true);
        const rawToken = 'raw-refresh-token';
        const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY.substring(0, 32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
        let encrypted = cipher.update(rawToken, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedToken = iv.toString('hex') + ':' + encrypted;

        const isValid = await service.isRefreshTokenValid(encryptedToken);

        expect(isValid).toBe(false);
     });

     it('should return true if token is valid and not blacklisted', async () => {
        (blacklistService.isTokenBlacklisted as any).mockResolvedValue(false);
        const rawToken = 'raw-refresh-token';
        const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY.substring(0, 32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
        let encrypted = cipher.update(rawToken, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedToken = iv.toString('hex') + ':' + encrypted;

        const isValid = await service.isRefreshTokenValid(encryptedToken);

        expect(isValid).toBe(true);
     });
  });
});
