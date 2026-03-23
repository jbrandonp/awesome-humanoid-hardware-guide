/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
// @ts-ignore
import dnssd from 'node-dns-sd';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({
    // Support Yjs CRDT payloads, High-Res Images & Whisper audio (up to 50MB)
    bodyLimit: 50 * 1024 * 1024,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // Enable Cross-Origin Resource Sharing for Desktop (Tauri Webview) & Mobile (Expo)
  app.enableCors({
    origin: '*', // En production "Offline", on est sur le réseau LAN donc toutes les requêtes locales sont acceptées
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  // Listen on all network interfaces for local network access
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );

  // Start mDNS advertisement
  try {
    await dnssd.publish({
      name: 'systeme-sante-api',
      type: '_medical-api._tcp',
      port: Number(port),
    });
    Logger.log(`📢 Service mDNS publié: _medical-api._tcp sur le port ${port}`);
  } catch (error) {
    Logger.error('Erreur lors de la publication du service mDNS', error);
  }
}

bootstrap();
