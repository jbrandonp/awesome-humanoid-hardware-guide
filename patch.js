const fs = require('fs');

let fileContent = fs.readFileSync('apps/api/src/app/sync/sync.service.ts', 'utf8');

fileContent = fileContent.replace(
`      for (const id of changes.patients.deleted) {
        await this.prisma.patient.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`,
`      if (changes.patients.deleted.length > 0) {
        await this.prisma.patient.updateMany({
          where: { id: { in: changes.patients.deleted } },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`
);

fileContent = fileContent.replace(
`      for (const id of changes.visits.deleted) {
        await this.prisma.visit.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`,
`      if (changes.visits.deleted.length > 0) {
        await this.prisma.visit.updateMany({
          where: { id: { in: changes.visits.deleted } },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`
);

fileContent = fileContent.replace(
`      for (const id of changes.prescriptions.deleted) {
        await this.prisma.prescription.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`,
`      if (changes.prescriptions.deleted.length > 0) {
        await this.prisma.prescription.updateMany({
          where: { id: { in: changes.prescriptions.deleted } },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`
);

fileContent = fileContent.replace(
`      for (const id of changes.vitals.deleted) {
        await this.prisma.vital.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`,
`      if (changes.vitals.deleted.length > 0) {
        await this.prisma.vital.updateMany({
          where: { id: { in: changes.vitals.deleted } },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }`
);

fs.writeFileSync('apps/api/src/app/sync/sync.service.ts', fileContent, 'utf8');
