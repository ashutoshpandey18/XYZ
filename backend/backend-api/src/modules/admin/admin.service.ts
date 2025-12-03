import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailGenerationService } from './email-generation.service';
import { EmailSenderService } from './email-sender.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailGenerator: EmailGenerationService,
    private emailSender: EmailSenderService,
  ) {}

  /**
   * Issue college email for approved request
   */
  async issueCollegeEmail(requestId: string) {
    // Load the email request with student data
    const emailRequest = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!emailRequest) {
      throw new NotFoundException(`Email request with ID ${requestId} not found`);
    }

    if (!emailRequest.student) {
      throw new NotFoundException('Student not found for this request');
    }

    // Validate request is approved
    if (emailRequest.status !== 'APPROVED') {
      throw new Error(
        `Cannot issue email for request with status: ${emailRequest.status}. Request must be APPROVED first.`
      );
    }

    // Check if email already issued
    if (emailRequest.student.emailIssued) {
      throw new Error(
        `College email already issued for student ${emailRequest.student.name} (${emailRequest.student.collegeEmail})`
      );
    }

    const student = emailRequest.student;

    // Validate extracted roll number exists
    if (!emailRequest.extractedRoll) {
      throw new Error(
        'Cannot issue email: Roll number not extracted from ID card. Please verify OCR processing completed.'
      );
    }

    // Generate college email
    const collegeEmail = await this.emailGenerator.generateCollegeEmail(
      student.name,
      emailRequest.extractedRoll,
    );

    // Generate secure password
    const tempPassword = this.emailGenerator.generateSecurePassword();
    const hashedPassword = await this.emailGenerator.hashPassword(tempPassword);

    // IMPORTANT: Log password server-side only (admin can check logs if needed)
    console.log(`🔐 TEMP PASSWORD for ${student.email}: ${tempPassword}`);

    // Update student record
    const updatedStudent = await this.prisma.user.update({
      where: { id: student.id },
      data: {
        collegeEmail,
        emailIssued: true,
        emailIssuedAt: new Date(),
        emailPassword: hashedPassword,
      },
    });

    // Create issuance history
    await this.prisma.issuedEmailHistory.create({
      data: {
        studentId: student.id,
        issuedEmail: collegeEmail,
      },
    });

    // Send credentials email to student
    let emailSent = false;
    try {
      await this.emailSender.sendCollegeEmailCredentials(
        student.email,
        student.name,
        collegeEmail,
        tempPassword,
      );
      emailSent = true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${student.email}:`, error.message);
      // Don't throw - issuance is saved, admin can manually send credentials
    }

    console.log(`✅ College email issued: ${collegeEmail} for ${student.name}`);

    // SECURITY: Never return plain password in API response
    return {
      success: true,
      collegeEmail,
      studentName: student.name,
      studentEmail: student.email,
      emailSent,
      issuedAt: updatedStudent.emailIssuedAt,
      message: emailSent
        ? 'College email created and credentials sent to student'
        : 'College email created but failed to send credentials. Check server logs for password.',
    };
  }

  /**
   * Get all issued emails history (admin only)
   */
  async getIssuedEmailsHistory() {
    const history = await this.prisma.issuedEmailHistory.findMany({
      include: {
        student: {
          select: {
            name: true,
            email: true,
            collegeEmail: true,
            emailIssuedAt: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return history;
  }

  /**
   * Get all pending email requests (approved but not issued)
   */
  async getPendingIssuances() {
    const pendingRequests = await this.prisma.emailRequest.findMany({
      where: {
        status: 'APPROVED',
        student: {
          emailIssued: false,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            emailIssued: true,
          },
        },
        // Include extractedRoll for email generation
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests;
  }
}
