import { Module } from '@nestjs/common';
import { KeyRotationService } from './key-rotation.service';

@Module({
  providers: [KeyRotationService],
  exports: [KeyRotationService],
})
export class CryptoModule {}
