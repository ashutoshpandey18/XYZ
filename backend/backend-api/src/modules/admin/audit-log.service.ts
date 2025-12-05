import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log admin action to audit trail
   */
  async logAction(
    adminId: string,
    requestId: string,
    action: AuditAction,
    details?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        adminId,
        requestId,
        action,
        details,
      },
    });

    console.log(
      `📋 AUDIT: ${action} by admin ${adminId} on request ${requestId}`,
    );
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
