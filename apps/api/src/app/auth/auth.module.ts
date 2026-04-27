import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BlacklistService } from './blacklist.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      // Secret is managed within AuthService to handle dual secrets for access/refresh
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
  ],
  providers: [
    AuthService,
    BlacklistService,
    JwtStrategy,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, BlacklistService],
})
export class AuthModule {}
