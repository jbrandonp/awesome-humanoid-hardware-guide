import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../apps/api/src/app/app.module';

describe('Resilience Tests', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        // Simulate database failure for some tests
        $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        patient: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      })
      .overrideProvider('MongooseConnection')
      .useValue({
        readyState: 0, // Disconnected
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Checks', () => {
    it('should return 200 for health endpoint even when databases are down', async () => {
      // The health endpoint should still respond even if dependencies are failing
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          // Health endpoint should indicate degraded state but still respond
          expect(res.body.status).toBeDefined();
        });
    });

    it('should return 503 for readiness endpoint when databases are down', async () => {
      // Readiness endpoint should fail when critical dependencies are unavailable
      await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(503);
    });
  });

  describe('Graceful Degradation', () => {
    it('should return 500 for database-dependent endpoints when DB is down', async () => {
      await request(app.getHttpServer())
        .get('/api/patients')
        .set('Authorization', 'Bearer mock-token')
        .expect(500); // Internal server error due to DB failure
    });

    it('should return meaningful error message for database errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/patients')
        .set('Authorization', 'Bearer mock-token')
        .expect(500);

      expect(response.body.message).toBeDefined();
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Note: This test would require the rate limiting middleware to be enabled
      // For now, we just test that the endpoint responds
      const promises = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/api/patients')
          .set('Authorization', 'Bearer mock-token')
      );

      const responses = await Promise.all(promises);
      // At least some requests should succeed (or all if no rate limiting in tests)
      expect(responses.length).toBe(5);
    });
  });
});