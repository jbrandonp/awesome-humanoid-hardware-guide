import { Module } from '@nestjs/common';
import { PeerConsultService } from './peer-consult.service';
import { PeerConsultController } from './peer-consult.controller';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ClinicalRecordModule, PrismaModule],
  providers: [PeerConsultService],
  controllers: [PeerConsultController],
})
export class PeerConsultModule {}
