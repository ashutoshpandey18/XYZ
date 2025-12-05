import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailGenerationService } from './email-generation.service';
import { AuditLogService } from './audit-log.service';
import { EmailRequestStatus, Prisma, AuditAction } from '@prisma/client';
import { GetRequestsQueryDto } from './dto/admin-requests.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailGenerator: EmailGenerationService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * DAY-7: Get all email requests with filtering, searching, sorting
   */
  async getAllRequests(query: GetRequestsQueryDto, adminId: string) {
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
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.emailRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * DAY-7: Get single request details with audit logs
   */
  async getRequestDetails(requestId: string) {
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
      },
    });

    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    // Get audit logs
    const auditLogs = await this.auditLogService.getRequestAuditLogs(requestId);

    return {
      ...request,
      auditLogs,
    };
  }

  /**
   * DAY-7: Approve request with admin notes
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
          },
        },
      },
    });

    // Log action
    await this.auditLogService.logAction(
      adminId,
      requestId,
      AuditAction.APPROVE_REQUEST,
      adminNotes || 'Request approved',
    );

    console.log(
      `✅ Request ${requestId} approved by admin ${adminId} for student ${request.student.name}`,
    );

    return updated;
  }

  /**
   * DAY-7: Reject request with admin notes
   */
  async rejectRequest(
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
        `Cannot reject request with status: ${request.status}`,
      );
    }

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
          },
        },
      },
    });

    // Log action
    await this.auditLogService.logAction(
      adminId,
      requestId,
      AuditAction.REJECT_REQUEST,
      adminNotes || 'Request rejected',
    );

    console.log(
      `❌ Request ${requestId} rejected by admin ${adminId} for student ${request.student.name}`,
    );

    return updated;
  }

  /**
   * DAY-7: Issue college email (DB ONLY - NO EMAIL SENDING)
   * This creates the college email and stores credentials in database
   * Email delivery will be handled separately in Day-8
   */
  async issueCollegeEmailDbOnly(
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

    if (!request.extractedRoll) {
      throw new BadRequestException(
        'Cannot issue email: Roll number not extracted',
      );
    }

    const student = request.student;

    // Generate college email
    const collegeEmail = await this.emailGenerator.generateCollegeEmail(
      student.name,
      request.extractedRoll,
    );

    // Generate and hash password
    const tempPassword = this.emailGenerator.generateSecurePassword();
    const hashedPassword = await this.emailGenerator.hashPassword(tempPassword);

    // Log password server-side for admin reference
    console.log(`🔐 TEMP PASSWORD for ${student.email}: ${tempPassword}`);
    console.log(`📧 College email generated: ${collegeEmail}`);

    // Update student record
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

    // Create issuance history
    await this.prisma.issuedEmailHistory.create({
      data: {
        studentId: student.id,
        issuedEmail: collegeEmail,
      },
    });

    // Log action
    await this.auditLogService.logAction(
      adminId,
      requestId,
      AuditAction.ISSUE_EMAIL,
      `College email ${collegeEmail} issued. ${adminNotes || ''}`,
    );

    console.log(
      `✅ College email ${collegeEmail} issued for ${student.name} (DB saved, no email sent)`,
    );

    return {
      success: true,
      request: updated,
      collegeEmail,
      message: 'College email created in database. Email delivery pending.',
    };
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

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      issuedRequests,
      totalIssuedEmails,
    ] = await Promise.all([
      this.prisma.emailRequest.count(),
      this.prisma.emailRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.emailRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.emailRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.emailRequest.count({ where: { status: 'ISSUED' } }),
      this.prisma.user.count({ where: { emailIssued: true } }),
    ]);

    return {
      totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
      issued: issuedRequests,
      totalIssuedEmails,
    };
  }
}
