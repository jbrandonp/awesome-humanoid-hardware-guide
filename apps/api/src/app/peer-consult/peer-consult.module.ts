import { Module } from '@nestjs/common';
import { PeerConsultService } from './peer-consult.service';
import { PeerConsultController } from './peer-consult.controller';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [ClinicalRecordModule],
  providers: [PeerConsultService],
  controllers: [PeerConsultController],
})
export class PeerConsultModule {}
