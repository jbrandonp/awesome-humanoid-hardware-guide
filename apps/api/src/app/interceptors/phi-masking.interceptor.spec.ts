import { PhiMaskingInterceptor } from './phi-masking.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('PhiMaskingInterceptor', () => {
  let interceptor: PhiMaskingInterceptor;

  beforeEach(() => {
    interceptor = new PhiMaskingInterceptor();
  });

  const mockExecutionContext = (role: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role },
        }),
      }),
    } as ExecutionContext;
  };

  const mockCallHandler = (data: unknown): CallHandler => {
    return {
      handle: () => of(data),
    };
  };

  it('should mask phone number for Patient and clinical details for ClinicalRecord for RECEPTIONIST', (done) => {
    const context = mockExecutionContext('RECEPTIONIST');
    const appointmentTime = new Date();

    // Create a mock Patient object (needs firstName, lastName, dateOfBirth)
    const mockPatient = {
      id: 'patient-1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      phone: '+91 9876543210',
      appointmentTime: appointmentTime,
    };

    // Create a mock ClinicalRecord object (needs patientId, specialty, data)
    const mockClinicalRecord = {
      patientId: 'patient-1',
      specialty: 'Cardiology',
      data: {
        bloodPressure: '120/80',
        viralLoad: 'undetectable',
      },
      clinicalDetails: 'Patient shows improvement',
    };

    const handler = mockCallHandler([mockPatient, mockClinicalRecord]);

    interceptor.intercept(context, handler).subscribe((result) => {
      const arr = result as Array<Record<string, unknown>>;
      const patient = arr[0];
      const record = arr[1];

      // Patient phone should be masked
      expect(patient['phone']).toBe('+91 9876***');
      expect((patient['phone'] as string).endsWith('***')).toBeTruthy();
      expect((patient['phone'] as string)).not.toContain('543210');

      // Patient appointment time and name should be preserved
      expect(patient['appointmentTime']).toBe(appointmentTime);
      expect(patient['firstName']).toBe('John');

      // ClinicalRecord details should be masked
      expect(record['data']).toBe('*** MASKED ***');
      expect(record['clinicalDetails']).toBe('*** MASKED ***');
      expect(record['specialty']).toBe('Cardiology');

      done();
    });
  });

  it('should NOT mask data for DOCTOR', (done) => {
    const context = mockExecutionContext('DOCTOR');
    const appointmentTime = new Date();

    const mockPatient = {
      id: 'patient-1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      phone: '+91 9876543210',
      appointmentTime: appointmentTime,
    };

    const mockClinicalRecord = {
      patientId: 'patient-1',
      specialty: 'Cardiology',
      data: {
        bloodPressure: '120/80',
        viralLoad: 'undetectable',
      },
      clinicalDetails: 'Patient shows improvement',
    };

    const handler = mockCallHandler([mockPatient, mockClinicalRecord]);

    interceptor.intercept(context, handler).subscribe((result) => {
      const arr = result as Array<Record<string, unknown>>;
      const patient = arr[0];
      const record = arr[1];

      expect(patient['phone']).toBe('+91 9876543210');
      expect(record['data']).toEqual({
        bloodPressure: '120/80',
        viralLoad: 'undetectable',
      });
      expect(record['clinicalDetails']).toBe('Patient shows improvement');
      expect(patient['appointmentTime']).toBe(appointmentTime);
      done();
    });
  });

  it('should correctly handle normal objects and not mask them (e.g. general payload)', (done) => {
    const context = mockExecutionContext('RECEPTIONIST');

    // An object that is neither Patient nor ClinicalRecord
    const mockData = {
      someOtherEntityId: 1,
      phone: '1234567890',
      data: {
         secretData: true
      }
    };

    const handler = mockCallHandler(mockData);

    interceptor.intercept(context, handler).subscribe((result) => {
      const res = result as Record<string, unknown>;
      // Phone should NOT be masked, because it's not a Patient
      expect(res['phone']).toBe('1234567890');

      // Data should NOT be masked, because it's not a ClinicalRecord
      expect(res['data']).toEqual({ secretData: true });
      done();
    });
  });
});
