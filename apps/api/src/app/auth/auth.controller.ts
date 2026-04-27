import { Controller, Post, Get, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';

interface RegisterStaffDto {
  email: string;
  role: Role;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: { email?: string; password?: string }): Promise<unknown> {
    if (!body.email || !body.password) {
      throw new UnauthorizedException('Email et mot de passe requis.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const hashedInput = crypto.createHash('sha256').update(body.password).digest('hex');
    const storedPassword = user.password;

    if (hashedInput !== storedPassword) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    return this.authService.login(user.id, user.role);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('request-otp')
  async requestOtp(@Body() body: { phone: string }): Promise<unknown> {
    if (!body.phone) {
      throw new Error('Phone number is required');
    }
    return this.authService.requestOtp(body.phone);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string }): Promise<unknown> {
    if (!body.phone || !body.otp) {
      throw new Error('Phone number and OTP are required');
    }
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  /**
   * Endpoint de logout pour invalider instantanément le Refresh Token via Redis.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully.' };
  }

  /**
   * Endpoint de gestion protégé par RBAC (Role-Based Access Control)
   * Seuls les administrateurs peuvent enregistrer un nouveau praticien ou employé.
   */
  @Post('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async registerNewStaff(@Body() userData: RegisterStaffDto): Promise<{ message: string; userId: string }> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: userData.email } });
    if (existingUser) {
      throw new UnauthorizedException('Un utilisateur avec cet email existe déjà.');
    }
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        role: userData.role,
        password: crypto.randomBytes(32).toString('hex'),
      },
    });
    return {
      message: 'Utilisateur créé avec succès.',
      userId: user.id,
    };
  }

  /**
   * Endpoint consultatif accessible aux DOCTOR et NURSE
   */
  @Get('dashboard-stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DOCTOR, Role.NURSE)
  async getDashboardStats(): Promise<{ patientsSeen: number; pendingConsults: number }> {
     return { patientsSeen: 12, pendingConsults: 4 };
  }
}
