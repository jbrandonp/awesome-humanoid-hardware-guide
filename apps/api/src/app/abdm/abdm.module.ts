import { Module } from '@nestjs/common';
import { AbdmService } from './abdm.service';
import { AbdmController } from './abdm.controller';

@Module({
  providers: [AbdmService],
  controllers: [AbdmController],
})
export class AbdmModule {}
