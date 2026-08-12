import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint', description: 'Checks database and Redis connectivity and system status' })
  @ApiResponse({ status: 200, description: 'Services are operational' })
  async check() {
    let postgresStatus = 'down';
    let redisStatus = 'down';
    let redisLatency = 'N/A';

    // Check Postgres
    try {
      const isPgHealthy = await this.prisma.isHealthy();
      postgresStatus = isPgHealthy ? 'up' : 'down';
    } catch {
      postgresStatus = 'down';
    }

    // Check Redis
    try {
      const start = Date.now();
      const pingResult = await this.redis.ping();
      const latency = Date.now() - start;
      if (pingResult === 'PONG') {
        redisStatus = 'up';
        redisLatency = `${latency}ms`;
      }
    } catch {
      redisStatus = 'down';
    }

    const isHealthy = postgresStatus === 'up' && redisStatus === 'up';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
      services: {
        database: {
          type: 'PostgreSQL',
          status: postgresStatus,
        },
        cache: {
          type: 'Redis',
          status: redisStatus,
          latency: redisLatency,
        },
      },
    };
  }
}
