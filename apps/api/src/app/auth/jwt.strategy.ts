import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistService } from './blacklist.service';

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

  async validate(req: any, payload: any) {
    // Extract raw token from Authorization header to check against blacklist
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (token && await this.blacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Ce token a été invalidé (Déconnexion effectuée).');
    }

    // Return structured user info for req.user
    return { userId: payload.sub, role: payload.role };
  }
}
