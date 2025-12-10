import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [EmailService, PrismaService],
  exports: [EmailService],
})
export class EmailModule {}
