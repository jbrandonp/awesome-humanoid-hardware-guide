import { Module } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { WhisperController } from './whisper.controller';

@Module({
  providers: [WhisperService],
  controllers: [WhisperController],
})
export class WhisperModule {}
