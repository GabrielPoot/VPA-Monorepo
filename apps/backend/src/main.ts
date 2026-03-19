import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // CORS configuration
  app.enableCors({
    origin: '*', // Adjust this in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe using nestjs-zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filters
  app.useGlobalFilters(new HttpExceptionFilter(), new ZodExceptionFilter());

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API backend running on port ${port}`);
}

bootstrap();
