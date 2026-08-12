import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'NestJS Backend API',
      version: '1.0.0',
      description: 'NestJS + PostgreSQL (Prisma ORM) + Redis Cache backend boilerplate',
      documentation: '/api/docs',
      healthCheck: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
