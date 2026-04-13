import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class BlacklistService implements OnModuleInit, OnModuleDestroy {
    private redisClient;
    onModuleInit(): void;
    onModuleDestroy(): void;
    /**
     * Invalidates a token by adding it to the Redis blacklist.
     * @param token The token string.
     * @param expiresInSeconds The number of seconds until the token naturally expires.
     */
    invalidateToken(token: string, expiresInSeconds: number): Promise<void>;
    /**
     * Checks if a token is in the blacklist.
     * @param token The token string.
     * @returns true if blacklisted, false otherwise.
     */
    isTokenBlacklisted(token: string): Promise<boolean>;
}
//# sourceMappingURL=blacklist.service.d.ts.map