import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

interface AuthenticatedUser {
  role?: string;
}

// Décorateur pour définir les scopes FHIR nécessaires sur un endpoint
export const FHIR_SCOPES_KEY = 'fhir_scopes';
export const FhirScopes = (...scopes: string[]): MethodDecorator & ClassDecorator => SetMetadata(FHIR_SCOPES_KEY, scopes);

@Injectable()
export class SmartOnFhirGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(FHIR_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    // Simuler l'extraction des scopes depuis le req.user (JWT vérifié par AuthGuard)
    // Dans une implémentation réelle OAuth2/SMART, les scopes sont dans le token
    const user = (request as { user?: AuthenticatedUser }).user;

    if (!user) {
      return false; // Not authenticated
    }

    // On mocke les scopes disponibles de l'utilisateur.
    // Un vrai système les lirait de user.scopes (ex: "patient/Observation.read patient/Patient.read")
    // Pour ce prototype, s'il a le role ADMIN, il a tous les scopes.
    // Sinon, on le laisse passer si le scope est simulé présent.
    const userScopes: string[] = user.role === 'ADMIN'
      ? ['*/*.*'] // wildcard super admin
      : ['patient/Patient.read', 'patient/Observation.read', 'user/MedicationRequest.write'];

    // Vérifier si l'utilisateur possède TOUS les scopes requis
    const hasAccess = requiredScopes.every(scope =>
      userScopes.includes('*/*.*') || userScopes.includes(scope)
    );

    return hasAccess;
  }
}
