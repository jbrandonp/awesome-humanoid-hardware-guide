import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistService } from './blacklist.service';
import type { FastifyRequest } from 'fastify';

interface JwtPayload {
  sub: string;
  role: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly blacklistService: BlacklistService) {
    if (!process.env.JWT_SECRET) {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET is not defined in environment variables.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: FastifyRequest, payload: JwtPayload): Promise<{ userId: string; role: string }> {
    // Extract raw token from Authorization header to check against blacklist
    const authHeader = (req.headers as Record<string, string | undefined>)['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (token && await this.blacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Ce token a été invalidé (Déconnexion effectuée).');
    }

    // Return structured user info for req.user
    return { userId: payload.sub, role: payload.role };
  }
}
