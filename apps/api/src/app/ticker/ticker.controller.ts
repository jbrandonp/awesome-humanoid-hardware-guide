import { Controller, Sse, UseGuards, Post, Req, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EpiTickerService } from './epi-ticker.service';
import type { FastifyRequest } from 'fastify';

import { AuditService } from '../audit/audit.service';
import { ActionType } from '@prisma/client';

type AuthenticatedFastifyRequest = FastifyRequest & { user?: { userId: string } };

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('ticker')
export class TickerController {
  constructor(
    private readonly tickerService: EpiTickerService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Server-Sent Events endpoint pour le bandeau d'actualité en temps réel.
   * Utilise très peu de RAM, idéal pour les vieux PC (contrairement à Socket.io).
   *
   * NOTE: L'EventSource du navigateur ne supporte pas nativement l'envoi
   * d'un header Authorization "Bearer ...". Dans un vrai cas sécurisé,
   * on validerait un cookie HttpOnly ou un Token dans l'URL.
   */
  @Sse('stream')
  sse(): Observable<MessageEvent> {
    return this.tickerService.getTickerStream().pipe(
      map(payload => ({
        id: payload.id,
        type: 'message',
        data: payload
      }))
    );
  }

  @Post('export/epidemiology')
  @UseGuards(AuthGuard('jwt'))
  async exportEpidemiologyReport(@Req() req: AuthenticatedFastifyRequest): Promise<{ success: boolean; message: string }> {
    const user = req.user;
    if (!user || !user.userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    try {
      await this.auditService.logAudit({
        userId: user.userId,
        patientId: 'SYSTEM', // Pas lié à un patient spécifique
        actionType: ActionType.EXPORT_REPORT,
        resourceId: 'Epidemiology_Monthly',
        phiDataAccessed: {}, // Anonymisé/Agrégé
         ipAddress: (req as { ip?: string }).ip || (req.socket as { remoteAddress?: string })?.remoteAddress || 'unknown',
      });
      return { success: true, message: 'Export autorisé et tracé' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
      throw new InternalServerErrorException('Échec de la journalisation AuditLog. Export bloqué.');
    }
  }
}
