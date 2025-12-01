import { Module } from '@nestjs/common';
import { EmailRequestController } from './email-request.controller';
import { EmailRequestService } from './email-request.service';
import { PrismaService } from '../../prisma.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [EmailRequestController],
  providers: [EmailRequestService, PrismaService, S3Service],
})
export class EmailRequestModule {}
