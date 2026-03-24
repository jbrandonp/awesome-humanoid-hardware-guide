import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login avec Rate Limiting pour contrer les attaques force brute.
   * On simule ici la validation des identifiants (qui utiliserait bcrypt.compare en vrai).
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requêtes par minute
  @Post('login')
  async login(@Body() body: any) {
    // NOTE: In a real scenario, validate email/password here.
    // For now we assume they are valid and fetch the user (or fake one)
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const role = Role.DOCTOR;
    return this.authService.login(userId, role);
  }

  /**
   * Endpoint de logout pour invalider instantanément le Refresh Token via Redis.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
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
  async registerNewStaff(@Body() userData: any) {
    // Cette route rejettera tout User n'ayant pas le rôle "ADMIN" (code HTTP 403 Forbidden).
    // Dans une DB réelle, on chiffrerait le mot de passe avec bcrypt ici.
    return {
      message: 'Utilisateur administratif ou praticien créé avec succès.',
      data: userData
    };
  }

  /**
   * Endpoint consultatif accessible aux DOCTOR et NURSE
   */
  @Get('dashboard-stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DOCTOR, Role.NURSE)
  async getDashboardStats() {
     return { patientsSeen: 12, pendingConsults: 4 };
  }
}
