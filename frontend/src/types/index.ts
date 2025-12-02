export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

export type EmailRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AiDecision = 'LIKELY_APPROVE' | 'REVIEW_MANUALLY' | 'FLAG_SUSPICIOUS';

export interface EmailRequest {
  id: string;
  studentId: string;
  student: User;
  documentURL: string;
  status: EmailRequestStatus;
  extractedName?: string;
  extractedRoll?: string;
  extractedCollegeId?: string;
  createdAt: string;
  aiDecision?: {
    aiDecision: AiDecision;
    confidenceScore: number;
    nameMatch: number;
    rollMatch: number;
  };
}
