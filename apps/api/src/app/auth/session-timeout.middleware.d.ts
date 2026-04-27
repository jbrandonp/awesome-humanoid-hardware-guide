import { NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
export declare class SessionTimeoutMiddleware implements NestMiddleware {
    use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void): void;
}
//# sourceMappingURL=session-timeout.middleware.d.ts.map