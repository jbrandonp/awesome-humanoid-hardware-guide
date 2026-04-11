import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../apps/api/src/app/app.module';

describe('Patient Integration', () => {
  let app: NestFastifyApplication;
  let authToken: string;

  beforeAll(async () => {
    // Create testing module with mocked external dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        patient: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation((data) => ({
            id: 'test-patient-id',
            ...data.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'test-user-id',
            email: 'doctor@test.com',
            role: 'DOCTOR',
          }),
        },
      })
      .overrideProvider('MongooseConnection')
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableCors({ origin: true });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Simulate authentication for authenticated tests
    // In a real test, we would get a token from the login endpoint
    authToken = 'mock-jwt-token-for-testing';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/patients', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/patients')
        .expect(401);
    });

    it('should return empty array with authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /api/patients', () => {
    it('should create a patient with valid data', async () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        phoneNumber: '+1234567890',
      };

      await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.firstName).toBe(patientData.firstName);
          expect(res.body.lastName).toBe(patientData.lastName);
        });
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty data
        .expect(400);
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .get('/api/patients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return patient by id', async () => {
      // This test would require a pre-created patient in the mock
      // For now, we test the endpoint structure
      await request(app.getHttpServer())
        .get('/api/patients/test-patient-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});