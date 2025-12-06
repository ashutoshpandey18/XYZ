export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  collegeEmail?: string;
  emailIssued?: boolean;
  emailIssuedAt?: string;
}

export type EmailRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';

export type AuditAction = 'APPROVE_REQUEST' | 'REJECT_REQUEST' | 'ISSUE_EMAIL' | 'ADD_NOTES';

export type AiDecision = 'LIKELY_APPROVE' | 'REVIEW_MANUALLY' | 'FLAG_SUSPICIOUS';

export interface AuditLog {
  id: string;
  adminId: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  requestId: string;
  action: AuditAction;
  details?: string;
  createdAt: string;
}

export interface EmailRequest {
  id: string;
  studentId: string;
  student: User;
  documentURL: string;
  status: EmailRequestStatus;
  extractedName?: string;
  extractedRoll?: string;
  extractedCollegeId?: string;
  aiDecision?: string;
  confidenceScore?: number;
  adminNotes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  auditLogs?: AuditLog[];
}

export interface IssuedEmailHistory {
  id: string;
  studentId: string;
  student: User;
  issuedEmail: string;
  issuedAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  issued: number;
  totalIssuedEmails: number;
}

export interface PaginatedResponse<T> {
  requests: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending';
  icon?: string;
}
