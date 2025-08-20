import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Service } from '../s3/s3.service';

@Module({
  imports: [PrismaModule],
  controllers: [InternalController],
  providers: [InternalService, S3Service],
  exports: [InternalService],
})
export class InternalModule {}
