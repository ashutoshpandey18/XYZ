import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  // Create Express app first
  const expressApp = express();

  // ULTRA-AGGRESSIVE CORS - Applied at Express level BEFORE NestJS
  expressApp.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    
    // Set CORS headers immediately
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    res.header('Access-Control-Max-Age', '86400');

    // Handle OPTIONS immediately
    if (req.method === 'OPTIONS') {
      console.log(`✅ CORS Preflight: ${req.method} ${req.url} from ${origin}`);
      return res.status(204).send('');
    }

    console.log(`📨 Request: ${req.method} ${req.url} from ${origin}`);
    next();
  });

  // Create NestJS app with CORS enabled
  const app = await NestFactory.create<NestExpressApplication>(AppModule, expressApp, {
    cors: true,
  });

  // Also enable NestJS CORS (redundant but safe)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
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
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application running: http://localhost:${port}`);
  console.log(`🌐 CORS: ULTRA-PERMISSIVE MODE (all origins allowed)`);
  console.log(`📍 Version: nuclear-v3`);
}
bootstrap();
