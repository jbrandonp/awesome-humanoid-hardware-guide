import { Strategy } from 'passport-jwt';
import { BlacklistService } from './blacklist.service';
import type { FastifyRequest } from 'fastify';
interface JwtPayload {
    sub: string;
    role: string;
    exp?: number;
    iat?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly blacklistService;
    constructor(blacklistService: BlacklistService);
    validate(req: FastifyRequest, payload: JwtPayload): Promise<{
        userId: string;
        role: string;
    }>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map