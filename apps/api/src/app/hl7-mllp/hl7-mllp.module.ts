import { Module } from '@nestjs/common';
import { Hl7MllpService } from './hl7-mllp.service';
import { Hl7ParserService } from './hl7-parser.service';
import { Hl7ReconciliationService } from './hl7-reconciliation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [Hl7MllpService, Hl7ParserService, Hl7ReconciliationService],
  exports: [Hl7MllpService],
})
export class Hl7MllpModule {}
