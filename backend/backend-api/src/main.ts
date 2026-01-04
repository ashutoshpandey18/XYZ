import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Create app with CORS enabled from the start
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // Enable CORS at creation time
  });

  // ============================================
  // ULTRA-PERMISSIVE CORS (for debugging)
  // Once working, we can tighten this
  // ============================================
  app.enableCors({
    origin: true, // Allow all origins (will reflect the requesting origin)
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Bind to all interfaces for Railway
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌐 CORS enabled for all origins (debug mode)`);
}
bootstrap();
