import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailBrevoApiService } from './email-brevo-api.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [
    EmailService,
    EmailBrevoApiService,
    PrismaService,
    // Use Brevo API service as the default email provider for Railway
    {
      provide: 'EMAIL_PROVIDER',
      useClass: EmailBrevoApiService,
    },
  ],
  exports: [EmailService, EmailBrevoApiService, 'EMAIL_PROVIDER'],
})
export class EmailModule {}
