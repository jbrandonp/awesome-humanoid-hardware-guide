import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncController } from './sync/sync.controller';
import { SyncService } from './sync/sync.service';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [SyncModule],
  controllers: [AppController, SyncController],
  providers: [AppService, SyncService],
})
export class AppModule {}
