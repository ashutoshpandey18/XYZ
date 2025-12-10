import axios from 'axios';
import type { EmailRequest, IssuedEmailHistory, DashboardStats, AuditLog, User } from '../types';
import { getToken } from './auth';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authApi = {
  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async register(name: string, email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/request-password-reset', { email });
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },
};

// ==================== STUDENT APIs ====================
export const studentApi = {
  async getMe(): Promise<User> {
    const { data } = await api.get('/student/me');
    return data;
  },

  async getMyRequests(): Promise<EmailRequest[]> {
    const { data } = await api.get('/email-request/me');
    return data;
  },

  async uploadProfilePhoto(file: File): Promise<{ photoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post('/student/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getProfilePhoto(): Promise<Blob> {
    const { data } = await api.get('/student/profile-photo', {
      responseType: 'blob',
    });
    return data;
  },

  async deleteProfilePhoto(): Promise<{ message: string }> {
    const { data } = await api.delete('/student/profile-photo');
    return data;
  },

  async submitRequest(file: File): Promise<EmailRequest> {
    const formData = new FormData();
    formData.append('document', file);
    const { data } = await api.post('/email-request', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// ==================== ADMIN APIs ====================
export const adminApi = {
  async getAllRequests(params?: {
    status?: string;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<EmailRequest>> {
    const { data } = await api.get('/admin/requests', { params });
    return data;
  },

  async getRequestById(requestId: string): Promise<EmailRequest> {
    const { data } = await api.get(`/admin/requests/${requestId}`);
    return data;
  },

  async approveRequest(requestId: string, adminNotes?: string): Promise<EmailRequest> {
    const { data } = await api.patch(`/admin/requests/${requestId}/approve`, { adminNotes });
    return data;
  },

  async rejectRequest(requestId: string, adminNotes: string): Promise<EmailRequest> {
    const { data } = await api.patch(`/admin/requests/${requestId}/reject`, { adminNotes });
    return data;
  },

  async issueEmail(requestId: string, adminNotes?: string): Promise<{
    success: boolean;
    collegeEmail: string;
    tempPassword: string;
    message: string;
  }> {
    const { data } = await api.post(`/admin/requests/${requestId}/issue-email`, { adminNotes });
    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  async issueCollegeEmail(requestId: string, adminNotes?: string): Promise<{
    success: boolean;
    collegeEmail: string;
    tempPassword: string;
    message: string;
  }> {
    const { data } = await api.post(`/admin/requests/${requestId}/issue-email`, { adminNotes });
    return data;
  },

  async getIssuedEmails(): Promise<IssuedEmailHistory[]> {
    const { data } = await api.get('/admin/issued-emails');
    return data;
  },

  async getAuditLogs(page: number = 1, limit: number = 50): Promise<{
    logs: AuditLog[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { data } = await api.get('/admin/audit-logs', { params: { page, limit } });
    return data;
  },
};

// ==================== EMAIL SETTINGS APIs ====================
export const emailSettingsApi = {
  async getSettings(): Promise<{
    id: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    fromEmail: string;
    fromName: string;
    isActive: boolean;
  }> {
    const { data } = await api.get('/admin/email-settings');
    return data;
  },

  async updateSettings(settings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    fromEmail: string;
    fromName: string;
  }): Promise<{ message: string }> {
    const { data } = await api.put('/admin/email-settings', settings);
    return data;
  },

  async sendTestEmail(toEmail: string): Promise<{ message: string }> {
    const { data } = await api.post('/admin/email-settings/test', { toEmail });
    return data;
  },
};

// ==================== CONVENIENCE EXPORTS ====================
// Simple named exports for easy importing
export const login = authApi.login;
export const signup = authApi.register;
export const verifyEmail = authApi.verifyEmail;
export const forgotPassword = authApi.requestPasswordReset;
export const resetPassword = authApi.resetPassword;

export const getMe = studentApi.getMe;
export const getStudentRequests = studentApi.getMyRequests;
export const uploadProfilePhoto = studentApi.uploadProfilePhoto;
export const deleteProfilePhoto = studentApi.deleteProfilePhoto;
export const uploadIdCard = studentApi.submitRequest;

export const getAdminRequests = () => adminApi.getAllRequests();
export const getAdminStats = adminApi.getStats;
export const approveRequest = (id: number, notes?: string) => adminApi.approveRequest(String(id), notes);
export const rejectRequest = (id: number, notes: string) => adminApi.rejectRequest(String(id), notes);
export const issueEmail = (id: number, notes?: string) => adminApi.issueEmail(String(id), notes);
export const getAuditLogs = adminApi.getAuditLogs;
export const getEmailSettings = emailSettingsApi.getSettings;
export const updateEmailSettings = emailSettingsApi.updateSettings;
export const sendTestEmail = emailSettingsApi.sendTestEmail;

