/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
// @ts-expect-error - node-dns-sd does not have TypeScript definitions
import dnssd from 'node-dns-sd';

async function bootstrap(): Promise<void> {
  // Blocker le demarrage si JWT_SECRET n'est pas configure
  if (process.env.NODE_ENV === 'production' &&
      (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'production-secret-key-change-me')) {
    throw new Error('JWT_SECRET non configure — demarrage bloque en production');
  }

  const fastifyAdapter = new FastifyAdapter({
    // Support Yjs CRDT payloads, High-Res Images & Whisper audio (up to 50MB)
    bodyLimit: 50 * 1024 * 1024,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  );

  // Enable Cross-Origin Resource Sharing for Desktop (Tauri Webview) & Mobile (Expo)
  // Restricted origins for security (Zero-Trust policy)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:4200',
        'tauri://localhost',
        'http://tauri.localhost',
        'http://localhost:8081',
        'http://localhost:3001',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  // Listen on all network interfaces for local network access
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);

  // Start mDNS advertisement
  try {
    await dnssd.publish({
      name: 'medical-api',
      type: '_medical-api._tcp',
      port: Number(port)
    });
    Logger.log(`📢 Service mDNS publié: _medical-api._tcp sur le port ${port}`);
  } catch (error) {
    Logger.error('Erreur lors de la publication du service mDNS', error);
  }
}

bootstrap();
