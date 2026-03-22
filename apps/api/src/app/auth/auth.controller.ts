import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {

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
