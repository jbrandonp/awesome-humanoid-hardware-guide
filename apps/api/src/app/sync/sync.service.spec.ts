import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { EpiTickerService } from '../ticker/epi-ticker.service';


describe('SyncService Performance', () => {
  let service: SyncService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: {
            patient: { update: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
            visit: { update: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
            prescription: { update: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
            vital: { update: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
            clinicalIncident: { create: jest.fn() },
            $transaction: jest.fn(async (ops) => Promise.all(ops)),
          }
        },
        {
          provide: EpiTickerService,
          useValue: { broadcastAlert: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('benchmark pushChanges', async () => {
    const patients = [];
    const visits = [];
    const prescriptions = [];
    const vitals = [];

    for (let i = 0; i < 50; i++) {
      patients.push({ id: `pat_${i}`, first_name: `First${i}`, last_name: `Last${i}`, date_of_birth: new Date().toISOString() });
      visits.push({ id: `vis_${i}`, date: new Date().toISOString(), notes: Buffer.from('test').toString('base64') });
      prescriptions.push({ id: `pres_${i}`, medication_name: `Med${i}`, dosage: '10mg', instructions: 'Take daily', prescribed_at: new Date().toISOString() });
      vitals.push({ id: `vit_${i}`, blood_pressure: '120/80', heart_rate: 70, recorded_at: new Date().toISOString() });
    }

    // Mock findMany responses
    (prisma.visit.findMany as jest.Mock).mockResolvedValue(
      visits.map(v => ({ id: v.id, notes: null }))
    );
    (prisma.prescription.findMany as jest.Mock).mockResolvedValue(
      prescriptions.map(p => ({ id: p.id, patientId: 'pat1', medicationName: 'Med', crdtAdministrations: null }))
    );

    const changes = {
      patients: { created: [], updated: patients, deleted: [] },
      visits: { created: [], updated: visits, deleted: [] },
      prescriptions: { created: [], updated: prescriptions, deleted: [] },
      vitals: { created: [], updated: vitals, deleted: [] }
    };

    const start = performance.now();
    await service.pushChanges(changes);
    const end = performance.now();
    console.log(`Execution time (optimized mock): ${end - start} ms`);
  });
});
