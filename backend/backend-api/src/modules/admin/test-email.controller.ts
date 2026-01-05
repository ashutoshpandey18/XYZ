import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Controller('test')
export class TestEmailController {
  constructor(private emailService: EmailService) {}

  @Post('send-email')
  async testEmail(@Body() body: { email: string; name: string }) {
    try {
      console.log('🧪 TEST EMAIL ENDPOINT CALLED');
      console.log('Email:', body.email);
      console.log('Name:', body.name);

      const result = await this.emailService.sendCollegeEmailIssued(
        body.email,
        body.name,
        'test123@college.edu',
        'TestPassword123!'
      );

      console.log('✅ Email sent successfully:', result);

      return {
        success: true,
        message: 'Email sent successfully',
        result
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
}
