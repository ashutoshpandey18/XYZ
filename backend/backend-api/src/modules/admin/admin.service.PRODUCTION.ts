import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailGenerationService } from './email-generation.service';
import { AuditLogService } from './audit-log.service';
import { EmailService } from '../email/email.service';
import { EmailRequestStatus, Prisma, AuditAction, EmailDeliveryStatus } from '@prisma/client';
import { GetRequestsQueryDto } from './dto/admin-requests.dto';
import {
  EmailRequestDto,
  RequestDetailsDto,
  DashboardStatsDto,
  PaginatedRequestsDto,
  StudentInfoDto,
  OcrDataDto,
  AiEvaluationDto,
  EmailDeliveryDto,
  AuditLogDto,
} from './dto/admin-response.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailGenerator: EmailGenerationService,
    private auditLogService: AuditLogService,
    private emailService: EmailService,
  ) {}

  /**
   * Transform Prisma EmailRequest to clean DTO
   */
  private transformToDto(request: any): EmailRequestDto {
    return {
      id: request.id,
      status: request.status,

      student: {
        id: request.student.id,
        name: request.student.name,
        email: request.student.email,
        collegeEmail: request.student.collegeEmail,
        emailIssued: request.student.emailIssued,
        emailIssuedAt: request.student.emailIssuedAt,
      },

      documentURL: request.documentURL,

      ocrData: {
        extractedName: request.extractedName,
        extractedRoll: request.extractedRoll,
        extractedCollegeId: request.extractedCollegeId,
        ocrCompletedAt: request.ocrCompletedAt,
      },

      aiEvaluation: {
        aiDecision: request.aiDecision,
        confidenceScore: request.confidenceScore,
        recommendation: this.getRecommendation(request.aiDecision, request.confidenceScore),
      },

      adminNotes: request.adminNotes,
      processedAt: request.processedAt,

      emailDelivery: {
        status: request.emailDeliveryStatus,
        sentAt: request.emailSentAt,
        retryCount: request.emailRetryCount,
        lastAttemptAt: request.lastEmailAttemptAt,
        errorMessage: request.emailError,
      },

      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  /**
   * Get AI recommendation based on decision and score
   */
  private getRecommendation(aiDecision: string | null, confidenceScore: number | null): 'APPROVE' | 'REVIEW' | 'REJECT' | 'PENDING' {
    if (!aiDecision || confidenceScore === null) return 'PENDING';

    if (aiDecision === 'LIKELY_APPROVE' && confidenceScore >= 0.9) return 'APPROVE';
    if (aiDecision === 'FLAG_SUSPICIOUS' || confidenceScore < 0.5) return 'REJECT';
    return 'REVIEW';
  }

  /**
   * Get all email requests with professional DTO formatting
   */
  async getAllRequests(query: GetRequestsQueryDto, adminId: string): Promise<PaginatedRequestsDto> {
    const {
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const where: Prisma.EmailRequestWhereInput = {};

    if (status) {
      where.status = status as EmailRequestStatus;
    }

    if (search) {
      where.OR = [
        { extractedName: { contains: search, mode: 'insensitive' } },
        { extractedRoll: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.EmailRequestOrderByWithRelationInput = {};
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = order;
    } else if (sortBy === 'confidenceScore') {
      orderBy.confidenceScore = order;
    } else if (sortBy === 'status') {
      orderBy.status = order;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [requests, total] = await Promise.all([
      this.prisma.emailRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              collegeEmail: true,
              emailIssued: true,
              emailIssuedAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.emailRequest.count({ where }),
    ]);

    // Transform to DTOs
    const dtoRequests = requests.map(req => this.transformToDto(req));

    return {
      data: dtoRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single request with full details including audit logs
   */
  async getRequestDetails(requestId: string): Promise<RequestDetailsDto> {
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeEmail: true,
            emailIssued: true,
            emailIssuedAt: true,
          },
        },
        emailRetryLogs: {
          orderBy: { attemptedAt: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    // Get audit logs
    const auditLogs = await this.auditLogService.getRequestAuditLogs(requestId);

    // Transform base DTO
    const baseDto = this.transformToDto(request);

    // Add additional details
    return {
      ...baseDto,
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        adminName: log.admin.name,
        adminEmail: log.admin.email,
        action: log.action,
        details: log.details,
        timestamp: log.createdAt,
      })),
      emailRetryHistory: request.emailRetryLogs.map(log => ({
        attemptNumber: log.attemptNumber,
        status: log.status,
        errorMessage: log.errorMessage,
        attemptedAt: log.attemptedAt,
      })),
    };
  }

  /**
   * Approve request with validation
   */
  async approveRequest(
    requestId: string,
    adminId: string,
    adminNotes?: string,
  ) {
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot approve request with status: ${request.status}`,
      );
    }

    // Validate OCR completion
    if (!request.ocrCompletedAt) {
      throw new BadRequestException(
        'Cannot approve: OCR processing not completed. Please wait for OCR to finish.',
      );
    }

    // Validate AI evaluation
    if (!request.aiDecision || request.confidenceScore === null) {
      throw new BadRequestException(
        'Cannot approve: AI evaluation not completed. Please wait for processing.',
      );
    }

    this.logger.log(`\n✅ ===== APPROVING REQUEST =====`);
    this.logger.log(`📋 Request ID: ${requestId}`);
    this.logger.log(`👤 Student: ${request.student.name} (${request.student.email})`);
    this.logger.log(`🧠 AI Decision: ${request.aiDecision}`);
    this.logger.log(`📊 Confidence: ${(request.confidenceScore * 100).toFixed(0)}%`);
    this.logger.log(`👨‍💼 Admin ID: ${adminId}`);

    // Update request
    const updated = await this.prisma.emailRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        adminNotes,
        processedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeEmail: true,
            emailIssued: true,
            emailIssuedAt: true,
          },
        },
      },
    });

    // Log action
    await this.auditLogService.logAction(
      adminId,
      requestId,
      AuditAction.APPROVE_REQUEST,
      adminNotes || `Approved. AI: ${request.aiDecision}, Confidence: ${(request.confidenceScore * 100).toFixed(0)}%`,
    );

    this.logger.log(`✅ Request approved successfully`);
    this.logger.log(`===== END APPROVAL =====\n`);

    return this.transformToDto(updated);
  }

  /**
   * Reject request with mandatory notes
   */
  async rejectRequest(
    requestId: string,
    adminId: string,
    adminNotes: string,
  ) {
    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new BadRequestException('Admin notes are required for rejection');
    }

    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot reject request with status: ${request.status}`,
      );
    }

    this.logger.log(`\n❌ ===== REJECTING REQUEST =====`);
    this.logger.log(`📋 Request ID: ${requestId}`);
    this.logger.log(`👤 Student: ${request.student.name} (${request.student.email})`);
    this.logger.log(`📝 Reason: ${adminNotes}`);
    this.logger.log(`👨‍💼 Admin ID: ${adminId}`);

    // Update request
    const updated = await this.prisma.emailRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminNotes,
        processedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeEmail: true,
            emailIssued: true,
            emailIssuedAt: true,
          },
        },
      },
    });

    // Log action
    await this.auditLogService.logAction(
      adminId,
      requestId,
      AuditAction.REJECT_REQUEST,
      adminNotes,
    );

    this.logger.log(`❌ Request rejected`);
    this.logger.log(`===== END REJECTION =====\n`);

    return this.transformToDto(updated);
  }

  /**
   * Issue college email with REAL email delivery via Nodemailer
   */
  async issueCollegeEmailWithDelivery(
    requestId: string,
    adminId: string,
    adminNotes?: string,
  ) {
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot issue email for request with status: ${request.status}. Must be APPROVED first.`,
      );
    }

    if (request.student.emailIssued) {
      throw new BadRequestException(
        `College email already issued for ${request.student.name}`,
      );
    }

    // Validate OCR and roll number
    if (!request.ocrCompletedAt || !request.extractedRoll) {
      throw new BadRequestException(
        'Cannot issue email: Roll number not extracted from ID card',
      );
    }

    // Validate AI evaluation
    if (!request.aiDecision || request.confidenceScore === null) {
      throw new BadRequestException(
        'Cannot issue email: AI evaluation not completed',
      );
    }

    const student = request.student;

    this.logger.log(`\n📧 ===== ISSUING COLLEGE EMAIL WITH DELIVERY =====`);
    this.logger.log(`📋 Request ID: ${requestId}`);
    this.logger.log(`👤 Student: ${student.name} (${student.email})`);
    this.logger.log(`🎓 Roll Number: ${request.extractedRoll}`);
    this.logger.log(`🧠 AI Decision: ${request.aiDecision}`);
    this.logger.log(`📊 Confidence: ${(request.confidenceScore * 100).toFixed(0)}%`);

    // Generate college email and password
    const collegeEmail = await this.emailGenerator.generateCollegeEmail(
      student.name,
      request.extractedRoll,
    );
    const tempPassword = this.emailGenerator.generateSecurePassword();
    const hashedPassword = await this.emailGenerator.hashPassword(tempPassword);

    this.logger.log(`📧 College email: ${collegeEmail}`);
    this.logger.log(`🔐 Temp password: ${tempPassword}`);

    try {
      // Send email via Nodemailer
      this.logger.log(`📤 Sending email notification to ${student.email}...`);

      const deliveryResult = await this.emailService.sendCollegeEmailIssued(
        student.email,
        student.name,
        collegeEmail,
        tempPassword,
      );

      this.logger.log(`✅ Email delivered successfully!`);
      this.logger.log(`📨 Message ID: ${deliveryResult.messageId}`);
      this.logger.log(`✅ Accepted: ${deliveryResult.accepted.join(', ')}`);

      // Update student with college email credentials
      await this.prisma.user.update({
        where: { id: student.id },
        data: {
          collegeEmail,
          emailIssued: true,
          emailIssuedAt: new Date(),
          emailPassword: hashedPassword,
        },
      });

      // Update request status to ISSUED
      const updated = await this.prisma.emailRequest.update({
        where: { id: requestId },
        data: {
          status: 'ISSUED',
          adminNotes: adminNotes || `College email issued: ${collegeEmail}`,
          processedAt: new Date(),
          emailSentAt: new Date(),
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              collegeEmail: true,
              emailIssued: true,
              emailIssuedAt: true,
            },
          },
        },
      });

      // Create issuance history
      await this.prisma.issuedEmailHistory.create({
        data: {
          studentId: student.id,
          issuedEmail: collegeEmail,
        },
      });

      // Log successful email delivery
      await this.prisma.emailRetryLog.create({
        data: {
          requestId,
          attemptNumber: 1,
          status: EmailDeliveryStatus.SENT,
        },
      });

      // Create audit log
      await this.auditLogService.logAction(
        adminId,
        requestId,
        AuditAction.ISSUE_EMAIL,
        `College email ${collegeEmail} issued and delivered. Message ID: ${deliveryResult.messageId}`,
      );

      this.logger.log(`✅ College email issuance complete`);
      this.logger.log(`===== END EMAIL ISSUANCE =====\n`);

      return {
        success: true,
        request: this.transformToDto(updated),
        collegeEmail,
        tempPassword, // Return for admin to show student
        deliveryInfo: {
          messageId: deliveryResult.messageId,
          accepted: deliveryResult.accepted,
          sentAt: new Date(),
        },
        message: 'College email issued and delivered successfully',
      };

    } catch (error) {
      // Email delivery failed - log and update status
      this.logger.error(`❌ Email delivery failed: ${error.message}`);

      await this.prisma.emailRequest.update({
        where: { id: requestId },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
          emailError: error.message,
          emailRetryCount: { increment: 1 },
          lastEmailAttemptAt: new Date(),
        },
      });

      await this.prisma.emailRetryLog.create({
        data: {
          requestId,
          attemptNumber: 1,
          status: EmailDeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw new BadRequestException(
        `College email generated but delivery failed: ${error.message}. Email: ${collegeEmail}, Password: ${tempPassword}`,
      );
    }
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      issuedRequests,
      totalIssuedEmails,
      todayRequests,
      pendingOcrProcessing,
      emailsSent,
      emailsPending,
      emailsFailed,
      avgProcessingTime,
    ] = await Promise.all([
      this.prisma.emailRequest.count(),
      this.prisma.emailRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.emailRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.emailRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.emailRequest.count({ where: { status: 'ISSUED' } }),
      this.prisma.user.count({ where: { emailIssued: true } }),
      this.prisma.emailRequest.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.emailRequest.count({
        where: { ocrCompletedAt: null, status: 'PENDING' },
      }),
      this.prisma.emailRequest.count({
        where: { emailDeliveryStatus: EmailDeliveryStatus.SENT },
      }),
      this.prisma.emailRequest.count({
        where: { emailDeliveryStatus: EmailDeliveryStatus.PENDING },
      }),
      this.prisma.emailRequest.count({
        where: { emailDeliveryStatus: EmailDeliveryStatus.FAILED },
      }),
      this.calculateAverageProcessingTime(),
    ]);

    return {
      totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
      issued: issuedRequests,
      totalIssuedEmails,
      averageProcessingTime: avgProcessingTime,
      todayRequests,
      pendingOcrProcessing,
      emailDeliveryStats: {
        sent: emailsSent,
        pending: emailsPending,
        failed: emailsFailed,
      },
    };
  }

  /**
   * Calculate average processing time in hours
   */
  private async calculateAverageProcessingTime(): Promise<number | null> {
    const processedRequests = await this.prisma.emailRequest.findMany({
      where: {
        processedAt: { not: null },
      },
      select: {
        createdAt: true,
        processedAt: true,
      },
    });

    if (processedRequests.length === 0) return null;

    const totalHours = processedRequests.reduce((sum, req) => {
      const diff = req.processedAt!.getTime() - req.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0);

    return Math.round((totalHours / processedRequests.length) * 10) / 10;
  }

  /**
   * Get issued emails history
   */
  async getIssuedEmailsHistory() {
    return this.prisma.issuedEmailHistory.findMany({
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
  }
}
