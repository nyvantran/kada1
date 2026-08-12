import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api/docs');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security & Middleware
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Enable Graceful Shutdown
  app.enableShutdownHooks();

  // Global Prefix
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/'],
  });

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Global Filters (Order matters: specific Prisma filter first, general HTTP filter second)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(),
  );

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription(
      'Enterprise Backend API built with NestJS, Prisma ORM (PostgreSQL), and Redis Cache.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Health and system diagnostics')
    .addTag('Users', 'User management and caching operations')
    .addTag('Posts', 'Post publication and relational data')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'NestJS API Documentation',
  });

  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger Documentation is at: http://localhost:${port}/${swaggerPath}`);
  logger.log(`🩺 Health check endpoint is at: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🌱 Environment: [${nodeEnv}]`);
  logger.log(`====================================================`);
}

void bootstrap();
