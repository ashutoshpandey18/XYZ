import { Body, Controller, Post, HttpCode, HttpStatus, Get, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto, ResetPasswordDto, VerifyEmailDto } from './dto/password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('test')
  testAuth() {
    console.log('✅ Auth module test endpoint hit');
    return {
      status: 'ok',
      message: 'Auth module is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    console.log('📝 REGISTER REQUEST:', { email: dto.email, name: dto.name });
    try {
      const result = await this.authService.register(dto.name, dto.email, dto.password);
      console.log('✅ Registration successful');
      return result;
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    console.log('🔐 LOGIN REQUEST:', {
      email: dto.email,
      hasPassword: !!dto.password,
      passwordLength: dto.password?.length || 0,
    });

    try {
      const result = await this.authService.login(dto.email, dto.password);
      console.log('✅ Login successful, returning tokens');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const success = await this.authService.verifyEmail(dto.token);
    return { success, message: 'Email verified successfully' };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    const { token, userId } = await this.authService.generatePasswordResetToken(dto.email);
    // In production, send this via email. For now, return it.
    return {
      message: 'Password reset link sent to your email',
      // Remove token from response in production - send via email only
      resetToken: token
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const success = await this.authService.resetPassword(dto.token, dto.newPassword);
    return { success, message: 'Password reset successfully' };
  }
}
