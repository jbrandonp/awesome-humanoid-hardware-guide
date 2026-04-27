import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Hl7ReconciliationService {

  constructor(private readonly prisma: PrismaService) {}

  public async findPatient(
    patientLabId: string | null,
    patientNameRaw: string | null,
    patientDobRaw: string | null,
  ): Promise<string | null> {
    
    // First, try matching by Patient Lab ID mapping to our UUID
    if (patientLabId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientLabId },
      });
      if (patient) return patient.id;
    }

    // Second, try matching by Name + DOB
    if (patientNameRaw && patientDobRaw) {
      // HL7 Name format: LAST^FIRST^MIDDLE...
      const nameParts = patientNameRaw.split('^');
      const lastName = nameParts[0]?.trim();
      const firstName = nameParts[1]?.trim();

      // HL7 Date format: YYYYMMDD
      if (patientDobRaw.length === 8) {
        const year = parseInt(patientDobRaw.substring(0, 4), 10);
        const month = parseInt(patientDobRaw.substring(4, 6), 10);
        const day = parseInt(patientDobRaw.substring(6, 8), 10);

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          if (lastName && firstName) {
            const patients = await this.prisma.patient.findMany({
              where: {
                firstName: { equals: firstName, mode: 'insensitive' },
                lastName: { equals: lastName, mode: 'insensitive' },
                dateOfBirth: {
                   gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
                   lt: new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
                }
              },
            });

            if (patients.length === 1) {
              return patients[0].id;
            }
          }
        }
      }
    }

    return null; // Fallback: no exact match or multiple matches
  }
}
