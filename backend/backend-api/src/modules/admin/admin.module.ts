import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailGenerationService } from './email-generation.service';
import { AuditLogService } from './audit-log.service';
import { TestEmailController } from './test-email.controller';
import { PrismaService } from '../../prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AdminController, TestEmailController],
  providers: [
    AdminService,
    EmailGenerationService,
    AuditLogService,
    PrismaService,
  ],
  exports: [AdminService, AuditLogService],
})
export class AdminModule {}
