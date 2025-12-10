import axios from 'axios';
import { getToken, clearToken } from '../lib/auth';

const BASE_URL = 'http://localhost:3000';

// TypeScript Interfaces
export interface Student {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  collegeEmail?: string;
  emailIssued?: boolean;
  emailIssuedAt?: string;
  profilePhotoUrl?: string;
}

export interface EmailRequest {
  id: string;
  studentId: string;
  student: Student;
  documentURL: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  extractedName?: string;
  extractedRoll?: string;
  extractedCollegeId?: string;
  aiDecision?: string;
  confidenceScore?: number;
  adminNotes?: string;
  processedAt?: string;
  emailSentAt?: string;
  emailDeliveryStatus?: string;
  emailRetryCount?: number;
  emailError?: string;
  lastEmailAttemptAt?: string;
  createdAt: string;
  updatedAt: string;
  auditLogs?: AuditLog[];
  emailRetryLogs?: EmailRetryLog[];
}

export interface DashboardStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  issued: number;
  totalIssuedEmails: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  requestId: string;
  action: 'APPROVE_REQUEST' | 'REJECT_REQUEST' | 'ISSUE_EMAIL' | 'ADD_NOTES';
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface EmailSettings {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
}

export interface EmailSettingsInput {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailEvent {
  id: string;
  requestId: string;
  attemptNumber: number;
  status: string;
  errorMessage?: string;
  attemptedAt: string;
}

export interface EmailRetryLog {
  id: string;
  requestId: string;
  attemptNumber: number;
  status: string;
  errorMessage?: string;
  attemptedAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const login = async (payload: { email: string; password: string }): Promise<{ accessToken: string }> => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const signup = async (payload: { name: string; email: string; password: string }): Promise<{ accessToken: string }> => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/auth/verify-email', { token });
};

export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/request-password-reset', { email });
};

export const resetPassword = async (payload: { token: string; password: string }): Promise<void> => {
  await api.post('/auth/reset-password', { token: payload.token, newPassword: payload.password });
};

// ==================== STUDENT APIs ====================
export const getMe = async (): Promise<Student> => {
  const { data } = await api.get('/student/me');
  return data;
};

export const getStudentRequests = async (): Promise<EmailRequest[]> => {
  const { data } = await api.get('/email-request/me');
  return data;
};

export const uploadIdCard = async (file: File): Promise<EmailRequest> => {
  const formData = new FormData();
  formData.append('document', file);
  const { data } = await api.post('/email-request', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const uploadProfilePhoto = async (file: File): Promise<{ profilePhotoUrl: string }> => {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await api.post('/student/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteProfilePhoto = async (): Promise<void> => {
  await api.delete('/student/profile-photo');
};

// ==================== ADMIN APIs ====================
export const getAdminRequests = async (params?: {
  page?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<EmailRequest[]> => {
  const { data } = await api.get('/admin/requests', { params });
  return data;
};

export const getAdminStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getAuditLogs = async (params?: {
  page?: number;
  action?: string;
  admin?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Paginated<AuditLog>> => {
  const { data } = await api.get('/admin/audit-logs', { params });
  return { data: data.logs || [], pagination: data.pagination };
};

export const approveRequest = async (id: string): Promise<void> => {
  await api.post(`/admin/requests/${id}/approve`);
};

export const rejectRequest = async (id: string, reason?: string): Promise<void> => {
  await api.post(`/admin/requests/${id}/reject`, { reason });
};

export const issueEmail = async (id: string): Promise<void> => {
  await api.post(`/admin/requests/${id}/issue`);
};

export const getEmailTimeline = async (id: string): Promise<EmailEvent[]> => {
  const { data } = await api.get(`/admin/requests/${id}`);
  return data.emailRetryLogs || [];
};

// ==================== EMAIL SETTINGS APIs ====================
export const getEmailSettings = async (): Promise<EmailSettings> => {
  const { data } = await api.get('/admin/email-settings');
  return data;
};

export const updateEmailSettings = async (payload: EmailSettingsInput): Promise<void> => {
  await api.put('/admin/email-settings', payload);
};

export const sendTestEmail = async (): Promise<void> => {
  await api.post('/admin/email-settings/test');
};
