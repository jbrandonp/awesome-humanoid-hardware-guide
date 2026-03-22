/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
// @ts-ignore
import dnssd from 'node-dns-sd';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  // Listen on all network interfaces for local network access
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);

  // Start mDNS advertisement
  try {
    await dnssd.publish({
      name: 'systeme-sante-api',
      type: '_medical-api._tcp',
      port: Number(port)
    });
    Logger.log(`📢 Service mDNS publié: _medical-api._tcp sur le port ${port}`);
  } catch (error) {
    Logger.error('Erreur lors de la publication du service mDNS', error);
  }
}

bootstrap();
