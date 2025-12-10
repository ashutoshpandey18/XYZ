/**
 * Professional DTOs for Admin Dashboard
 * Clean, structured, production-ready data format
 */

export interface StudentInfoDto {
  id: string;
  name: string;
  email: string;
  collegeEmail: string | null;
  emailIssued: boolean;
  emailIssuedAt: Date | null;
}

export interface OcrDataDto {
  extractedName: string | null;
  extractedRoll: string | null;
  extractedCollegeId: string | null;
  ocrCompletedAt: Date | null;
  rawText?: string;
}

export interface AiEvaluationDto {
  aiDecision: string | null;
  confidenceScore: number | null;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' | 'PENDING';
}

export interface EmailDeliveryDto {
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt: Date | null;
  retryCount: number;
  lastAttemptAt: Date | null;
  errorMessage: string | null;
  messageId?: string;
}

export interface AuditLogDto {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  details: string | null;
  timestamp: Date;
}

export interface EmailRequestDto {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';

  // Student Information
  student: StudentInfoDto;

  // Document
  documentURL: string;

  // OCR Data
  ocrData: OcrDataDto;

  // AI Evaluation
  aiEvaluation: AiEvaluationDto;

  // Admin Review
  adminNotes: string | null;
  processedAt: Date | null;

  // Email Delivery
  emailDelivery: EmailDeliveryDto;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestDetailsDto extends EmailRequestDto {
  // Additional details for single request view
  auditLogs: AuditLogDto[];
  emailRetryHistory: Array<{
    attemptNumber: number;
    status: string;
    errorMessage: string | null;
    attemptedAt: Date;
  }>;
}

export interface DashboardStatsDto {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  issued: number;

  // Additional metrics
  totalIssuedEmails: number;
  averageProcessingTime: number | null; // in hours
  todayRequests: number;
  pendingOcrProcessing: number;

  // Email delivery stats
  emailDeliveryStats: {
    sent: number;
    pending: number;
    failed: number;
  };
}

export interface PaginatedRequestsDto {
  data: EmailRequestDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
