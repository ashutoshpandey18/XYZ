import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    try {
      const hashed = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: { name, email, passwordHash: hashed },
      });

      return this.createTokens(user.id, user.role, user.email);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(email: string, password: string) {
    console.log('🔐 LOGIN ATTEMPT:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password length: ${password?.length || 0} chars`);
    console.log(`   📅 Timestamp: ${new Date().toISOString()}`);

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`   ❌ USER NOT FOUND: ${email}`);
      console.log(`   💡 Available users in DB: Run 'select email from "User";' to check`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`   ✅ USER FOUND:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
    });

    // Compare password
    console.log(`   🔄 Comparing passwords...`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`   🔍 Password match result: ${isMatch}`);

    if (!isMatch) {
      console.log(`   ❌ PASSWORD MISMATCH`);
      console.log(`   📝 Provided password: ${password.substring(0, 3)}...`);
      console.log(`   📝 Hash in DB starts: ${user.passwordHash?.substring(0, 10)}...`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`   ✅ LOGIN SUCCESSFUL for ${email}`);
    return this.createTokens(user.id, user.role, user.email);
  }

  createTokens(userId: string, role: string, email?: string) {
    const payload = { sub: userId, userId, role, email };
    const accessToken = this.jwt.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  // Generate email verification token
  async generateVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<boolean> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Update user as verified
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete used token
    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return true;
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<{ token: string; userId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    return { token, userId: user.id };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return true;
  }

  // TEMPORARY: Fix admin role - remove after first use
  async fixAdminRole(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    return {
      message: 'User role updated to ADMIN',
      email: updated.email,
      role: updated.role,
    };
  }
}
