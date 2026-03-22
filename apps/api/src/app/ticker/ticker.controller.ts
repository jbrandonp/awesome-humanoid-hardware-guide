import { Controller, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EpiTickerService } from './epi-ticker.service';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('ticker')
// On retire l'authentification JWT classique pour le SSE car l'EventSource du navigateur
// ne supporte pas nativement l'envoi d'un header Authorization "Bearer ...".
// Dans un vrai cas sécurisé, on validerait un cookie HttpOnly ou un Token dans l'URL.
// @UseGuards(AuthGuard('jwt'))
export class TickerController {
  constructor(private readonly tickerService: EpiTickerService) {}

  /**
   * Server-Sent Events endpoint pour le bandeau d'actualité en temps réel.
   * Utilise très peu de RAM, idéal pour les vieux PC (contrairement à Socket.io).
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
}
