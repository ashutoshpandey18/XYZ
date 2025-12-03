import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailGenerationService } from './email-generation.service';
import { EmailSenderService } from './email-sender.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    EmailGenerationService,
    EmailSenderService,
    PrismaService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
