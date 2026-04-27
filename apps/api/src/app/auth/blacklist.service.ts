import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BlacklistService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  onModuleInit(): void {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times) => null // Don't retry
    });
    // Suppress connection errors
    this.redisClient.on('error', (err) => {
      console.warn('Redis connection error in BlacklistService:', err.message);
    });
  }

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  /**
   * Invalidates a token by adding it to the Redis blacklist.
   * @param token The token string.
   * @param expiresInSeconds The number of seconds until the token naturally expires.
   */
  async invalidateToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    // Set the token in Redis with an expiration to avoid indefinite memory usage
    await this.redisClient.set(key, 'invalid', 'EX', expiresInSeconds);
  }

  /**
   * Checks if a token is in the blacklist.
   * @param token The token string.
   * @returns true if blacklisted, false otherwise.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redisClient.get(key);
    return result !== null;
  }
}
