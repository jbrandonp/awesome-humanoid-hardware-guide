import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la route ne spécifie pas de rôle avec @Roles(), elle est ouverte
    // (à condition de passer l'AuthGuard principal)
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // L'utilisateur doit être logué et posséder le bon rôle
    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
