import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmailGenerationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate college email from name and roll number
   * Format: firstname + last 2 digits of roll @ college.edu
   * Handle conflicts with incremental suffix
   */
  async generateCollegeEmail(name: string, roll: string): Promise<string> {
    // Extract first name and sanitize
    const firstName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');

    if (!firstName) {
      throw new Error('Invalid name: unable to extract first name');
    }

    // Extract last 2 digits from roll
    const rollDigits = roll.slice(-2);

    // Base username
    const baseUsername = `${firstName}${rollDigits}`;
    let username = baseUsername;
    let suffix = 0;

    // Check for conflicts and increment
    while (await this.emailExists(`${username}@college.edu`)) {
      suffix++;
      username = `${baseUsername}_${suffix}`;
    }

    const collegeEmail = `${username}@college.edu`;
    console.log(`📧 Generated college email: ${collegeEmail}${suffix > 0 ? ` (conflict resolved with suffix _${suffix})` : ''}`);

    return collegeEmail;
  }

  /**
   * Check if college email already exists
   */
  private async emailExists(email: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({
      where: { collegeEmail: email },
    });
    return !!existing;
  }

  /**
   * Generate secure random password
   * 12-16 characters with uppercase, lowercase, and digits
   */
  generateSecurePassword(): string {
    const length = 12 + Math.floor(Math.random() * 5); // 12-16 chars
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const allChars = uppercase + lowercase + digits;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];

    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
