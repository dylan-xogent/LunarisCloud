import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './config/env';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );

  const configService = app.get(ConfigService);

  // Security middleware
  await app.register(helmet);

  // CORS
  app.enableCors({
    origin: env.WEB_URL,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(env.PORT, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
}

bootstrap();
