import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailGenerationService } from './email-generation.service';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    EmailGenerationService,
    AuditLogService,
    PrismaService,
  ],
  exports: [AdminService, AuditLogService],
})
export class AdminModule {}
