
import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

describe('CORS Configuration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // We cannot easily test the main.ts bootstrap logic here,
    // but we can verify how NestJS handles the origins we've whitelisted.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    // Replicate the logic from main.ts
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [
          'http://localhost:4200',
          'tauri://localhost',
          'http://tauri.localhost',
          'http://localhost:8081',
        ];

    app.enableCors({
      origin: allowedOrigins,
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
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/',
      headers: {
        'Origin': 'http://localhost:4200',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  it('should reject non-whitelisted origins', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/',
      headers: {
        'Origin': 'http://malicious.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // When the origin is not allowed, the Access-Control-Allow-Origin header is either missing
    // or set to something else (depending on how the CORS middleware is configured).
    // In NestJS/Fastify with an array of origins, it typically doesn't echo back the origin if not matched.
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
