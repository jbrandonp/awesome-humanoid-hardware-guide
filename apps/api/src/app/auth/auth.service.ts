import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BlacklistService } from './blacklist.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly blacklistService: BlacklistService,
    private readonly prisma: PrismaService,
  ) {
    this.validateSecrets();
  }

  private validateSecrets(): void {
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'TOKEN_ENCRYPTION_KEY',
    ];
    const defaultValues = new Set([
      'change-me-to-a-secure-random-string-at-least-32-chars',
      'production-secret-key-change-me',
      'production-refresh-secret-key-change-me',
      'medical-system-secure-32-byte-key-min',
    ]);
    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        throw new Error(
          `CRITICAL SECURITY ERROR: ${secret} is not defined in environment variables.`,
        );
      }
      if (defaultValues.has(process.env[secret]!)) {
        throw new Error(
          `CRITICAL SECURITY ERROR: ${secret} is set to an insecure default value. Please generate a strong secret.`,
        );
      }
    }
    if (
      process.env.TOKEN_ENCRYPTION_KEY &&
      process.env.TOKEN_ENCRYPTION_KEY.length < 32
    ) {
      throw new Error(
        'CRITICAL SECURITY ERROR: TOKEN_ENCRYPTION_KEY must be at least 32 characters long.',
      );
    }
  }

  /**
   * Generates a new Access Token (15 mins) and an encrypted Refresh Token (7 days).
   */
  async login(userId: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, role };

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET is not defined in environment variables.',
      );
    }

    // Access Token: 15 minutes
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET is not defined in environment variables.',
      );
    }

    // Refresh Token: 7 days
    const rawRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    // Encrypt the Refresh Token
    const encryptedRefreshToken = this.encryptToken(rawRefreshToken);

    return {
      accessToken,
      refreshToken: encryptedRefreshToken,
    };
  }

  /**
   * Logs out the user by blacklisting the Refresh Token.
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    interface JwtDecoded {
      sub: string;
      role: string;
      exp?: number;
      iat?: number;
    }

    try {
      const decrypted = this.decryptToken(refreshToken);
      const decoded = this.jwtService.decode(decrypted) as JwtDecoded | null;
      if (decoded && decoded.exp) {
        const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresInSeconds > 0) {
          await this.blacklistService.invalidateToken(
            decrypted,
            expiresInSeconds,
          );
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // Invalid token format, ignore
    }
  }

  async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
    try {
      const decrypted = this.decryptToken(refreshToken);
      const isBlacklisted =
        await this.blacklistService.isTokenBlacklisted(decrypted);
      if (isBlacklisted) {
        return false;
      }
      this.jwtService.verify(decrypted, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return false;
    }
  }

  async requestOtp(phone: string): Promise<{ message: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      throw new UnauthorizedException('Patient non trouvé avec ce numéro.');
    }

    // Generate a 6-digit OTP (Cryptographically Secure)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.patient.update({
      where: { phone },
      data: { otp, otpExpiresAt },
    });

    // HIPAA/DPDPA Compliance: Mask PHI in logs
    const maskedPhone = phone.replace(/.(?=.{4})/g, '*');
    this.logger.log(`[OTP] Un OTP a été généré et envoyé au numéro: ${maskedPhone}`);

    return { message: 'OTP envoyé avec succès.' };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ accessToken: string; refreshToken: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient || !patient.otp || !patient.otpExpiresAt) {
      throw new UnauthorizedException('OTP invalide ou expiré.');
    }

    if (patient.otp !== otp || patient.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP invalide ou expiré.');
    }

    // Clear OTP after successful validation
    await this.prisma.patient.update({
      where: { phone },
      data: { otp: null, otpExpiresAt: null },
    });

    // PWA users authenticate as a PATIENT role (or similar)
    // Here we'll just return a standard login payload using their ID
    return this.login(patient.id, 'PATIENT');
  }

  // --- Utility Methods for Encryption ---

  private getEncryptionSecret(): Buffer {
    // Generate a consistent 32-byte key using SHA-256 to support multi-byte characters safely
    return crypto
      .createHash('sha256')
      .update(process.env.TOKEN_ENCRYPTION_KEY || '')
      .digest();
  }

  private encryptToken(token: string): string {
    const secret = this.getEncryptionSecret();
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptToken(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted token format (Expected IV:AuthTag:Ciphertext)');
    
    const secret = this.getEncryptionSecret();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', secret, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
