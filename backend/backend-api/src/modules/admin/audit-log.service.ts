import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log admin action to audit trail
   * Throws error if adminId is missing to prevent invalid logs
   */
  async logAction(
    adminId: string,
    requestId: string,
    action: AuditAction,
    details?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Validate adminId is not undefined or empty
    if (!adminId || adminId.trim() === '') {
      throw new BadRequestException('adminId is required for audit logging');
    }

    // Validate requestId
    if (!requestId || requestId.trim() === '') {
      throw new BadRequestException('requestId is required for audit logging');
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          requestId,
          action,
          details: details || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });

      console.log(
        `📋 AUDIT: ${action} by admin ${adminId} on request ${requestId}${details ? ` - ${details}` : ''}`,
      );
    } catch (error) {
      console.error('❌ Failed to create audit log:', error.message);
      // Don't throw - audit log failure shouldn't break the main operation
      // But log it clearly for monitoring
    }
  }

  /**
   * Get audit logs for a specific request
   */
  async getRequestAuditLogs(requestId: string) {
    return this.prisma.auditLog.findMany({
      where: { requestId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all audit logs by admin
   */
  async getAdminAuditLogs(adminId: string) {
    return this.prisma.auditLog.findMany({
      where: { adminId },
      include: {
        request: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 actions
    });
  }
}
