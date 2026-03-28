import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KioskPatient {
  id: string;
  firstName: string;
  lastName: string;
}

export interface KioskState {
  currentPatient: KioskPatient | null;
  lastCalledPatients: KioskPatient[];
}

@Injectable()
export class KioskService {
  private readonly logger = new Logger(KioskService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the current kiosk state.
   * Since there's no explicit "Queue" table, we deduce the state from the most recent Visits.
   * The most recently created Visit is considered the "currently called" patient.
   * The 5 preceding Visits are considered the "last called" patients.
   */
  async getCurrentState(): Promise<KioskState> {
    try {
      // Find the 6 most recent visits to deduce current and history
      const recentVisits = await this.prisma.visit.findMany({
        take: 6,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          status: { not: 'deleted' }, // Filter out deleted visits
        }
      });

      if (recentVisits.length === 0) {
        return {
          currentPatient: null,
          lastCalledPatients: [],
        };
      }

      // The first element is the most recent (current patient)
      const currentPatient = recentVisits[0].patient;
      
      // The rest (up to 5) are the history
      const history = recentVisits.slice(1).map(visit => visit.patient);

      return {
        currentPatient: {
            id: currentPatient.id,
            firstName: currentPatient.firstName,
            lastName: currentPatient.lastName,
        },
        lastCalledPatients: history.map(p => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve kiosk state', error);
      // Fallback to empty state on error so we don't crash the kiosk
      return {
        currentPatient: null,
        lastCalledPatients: [],
      };
    }
  }
}
