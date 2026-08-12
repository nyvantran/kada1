import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const db = this.configService.get<number>('REDIS_DB', 0);
    this.defaultTtl = this.configService.get<number>('REDIS_TTL', 3600);

    this.client = new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis client connected to ${host}:${port} [DB ${db}]`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client is ready to accept commands');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', (time: number) => {
      this.logger.log(`Reconnecting to Redis in ${time}ms`);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn('Could not connect to Redis during startup. Redis operations will retry automatically.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis client gracefully closed');
    } catch (error) {
      this.logger.error('Error closing Redis client', error);
    }
  }

  /**
   * Get raw ioredis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Check if Redis is alive
   */
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  /**
   * Get cached item by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key "${key}" from Redis:`, error);
      return null;
    }
  }

  /**
   * Set cached item with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    try {
      const ttl = ttlInSeconds ?? this.defaultTtl;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl > 0) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting key "${key}" in Redis:`, error);
    }
  }

  /**
   * Delete one or multiple keys
   */
  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error deleting keys from Redis:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern safely using SCAN (non-blocking)
   */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let totalDeleted = 0;
    try {
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error(`Error deleting pattern "${pattern}" from Redis:`, error);
    }
    return totalDeleted;
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking exists for key "${key}" in Redis:`, error);
      return false;
    }
  }

  /**
   * Set expiration time on key in seconds
   */
  async expire(key: string, ttlInSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlInSeconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expire for key "${key}" in Redis:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL of a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key "${key}" in Redis:`, error);
      return -2;
    }
  }

  /**
   * Cache-Aside Helper: Get cached value or execute fallback function, cache result, and return
   */
  async getOrSet<T>(key: string, fallbackFn: () => Promise<T>, ttlInSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const freshData = await fallbackFn();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlInSeconds);
    }
    return freshData;
  }
}
