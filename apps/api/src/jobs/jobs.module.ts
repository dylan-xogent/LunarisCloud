import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SharesModule } from '../shares/shares.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SharesModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
