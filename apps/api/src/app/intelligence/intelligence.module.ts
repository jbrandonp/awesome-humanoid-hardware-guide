import { Module } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DpdpaModule } from '../audit/audit-dpdpa.module';

@Module({
  imports: [PrismaModule, DpdpaModule],
  providers: [IntelligenceService],
  controllers: [IntelligenceController],
})
export class IntelligenceModule {}
