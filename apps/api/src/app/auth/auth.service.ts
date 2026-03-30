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
  ) {}

  /**
   * Generates a new Access Token (15 mins) and an encrypted Refresh Token (7 days).
   */
  async login(userId: string, role: string) {
    const payload = { sub: userId, role };

    // Access Token: 15 minutes
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET || 'super-secret',
    });

    // Refresh Token: 7 days
    const rawRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
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
  async logout(refreshToken: string) {
    if (!refreshToken) return;

    try {
      const decrypted = this.decryptToken(refreshToken);
      const decoded = this.jwtService.decode(decrypted) as any;
      if (decoded && decoded.exp) {
        const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresInSeconds > 0) {
           await this.blacklistService.invalidateToken(decrypted, expiresInSeconds);
        }
      }
    } catch (e) {
      // Invalid token format, ignore
    }
  }

  async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
    try {
       const decrypted = this.decryptToken(refreshToken);
       const isBlacklisted = await this.blacklistService.isTokenBlacklisted(decrypted);
       if (isBlacklisted) {
           return false;
       }
       this.jwtService.verify(decrypted, { secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret' });
       return true;
    } catch (e) {
       return false;
    }
  }

  async requestOtp(phone: string) {
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

    // In a real scenario, integrate with SMS/WhatsApp provider here
    this.logger.log(`[OTP] Un OTP a été généré et envoyé au numéro: ${phone}`);

    return { message: 'OTP envoyé avec succès.' };
  }

  async verifyOtp(phone: string, otp: string) {
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

  private encryptToken(token: string): string {
    const secret = (process.env.TOKEN_ENCRYPTION_KEY || '12345678901234567890123456789012').substring(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptToken(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted token format');
    const secret = (process.env.TOKEN_ENCRYPTION_KEY || '12345678901234567890123456789012').substring(0, 32);
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
