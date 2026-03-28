import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmarController } from './emar.controller';
import { EmarsyncListener } from './emarsync-listener.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [EmarController],
  providers: [EmarsyncListener],
})
export class EmarModule {}
