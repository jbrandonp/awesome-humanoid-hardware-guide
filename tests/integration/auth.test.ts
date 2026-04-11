import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../apps/api/src/app/app.module';

describe('Auth Integration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // Create testing module with the full AppModule
    // We'll mock external dependencies (Prisma, MongoDB) to avoid needing real databases
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      })
      .overrideProvider('MongooseConnection')
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    
    // Apply CORS similar to production
    app.enableCors({
      origin: true, // Allow all in tests
      credentials: true,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'invalid' })
        .expect(401);
    });

    it('should return 400 with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid')
        .expect(401);
    });
  });
});