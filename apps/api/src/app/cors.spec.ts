import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

describe('CORS Configuration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // 1. Simuler l'initialisation de l'application SANS dépendances externes bloquantes (Prisma/Mongo)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: { getData: () => ({ message: 'Hello API' }) } }],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    // 2. Reproduire la logique CORS de `main.ts`
    const allowedOriginsRaw = 'http://localhost:4200, tauri://localhost, http://tauri.localhost, http://localhost:8081';
    const whitelistedOrigins = allowedOriginsRaw.split(',').map(o => o.trim());

    app.enableCors({
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin || whitelistedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS'), false);
        }
      } as any,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow whitelisted origins', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('Origin', 'http://localhost:4200')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  it('should reject non-whitelisted origins', async () => {
    const response = await request(app.getHttpServer())
      .options('/')
      .set('Origin', 'http://malicious.com');

    // Fastify/NestJS by default drops the headers or returns 500 when CORS cb fails
    expect(response.status).not.toBe(204);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
