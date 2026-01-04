import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Create NestJS app with CORS enabled at creation
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Get underlying Express instance for raw middleware
  const expressApp = app.getHttpAdapter().getInstance();

  // EXTREME CORS - Raw Express middleware (runs before NestJS routing)
  expressApp.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin || req.headers.host || '*';

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
    res.header('Access-Control-Expose-Headers', 'Content-Range,X-Content-Range');
    res.header('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      console.log(`✅ Preflight: ${req.url} from ${origin}`);
      return res.status(204).send('');
    }

    console.log(`📨 ${req.method} ${req.url} from ${origin}`);
    next();
  });

  // NestJS CORS (backup layer)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Static files
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

  // Listen on all interfaces for Railway
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server: http://localhost:${port}`);
  console.log(`🌐 CORS: Enabled for all origins`);
  console.log(`📍 Version: v4-fixed-build`);
}

