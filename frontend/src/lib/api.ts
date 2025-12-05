import axios from "axios";
import type { EmailRequest, IssuedEmailHistory, DashboardStats, PaginatedResponse } from "../types";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin API functions
export const adminApi = {
  // DAY-7: Get all requests with filtering, searching, sorting
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

  // DAY-7: Get single request details with audit logs
  async getRequestDetails(requestId: string): Promise<EmailRequest> {
    const { data } = await api.get(`/admin/requests/${requestId}`);
    return data;
  },

  // DAY-7: Approve request
  async approveRequest(requestId: string, adminNotes?: string): Promise<EmailRequest> {
    const { data } = await api.patch(`/admin/requests/${requestId}/approve`, { adminNotes });
    return data;
  },

  // DAY-7: Reject request
  async rejectRequest(requestId: string, adminNotes?: string): Promise<EmailRequest> {
    const { data } = await api.patch(`/admin/requests/${requestId}/reject`, { adminNotes });
    return data;
  },

  // DAY-7: Issue college email (DB only, no actual sending)
  async issueCollegeEmail(requestId: string, adminNotes?: string) {
    const { data } = await api.post(`/admin/requests/${requestId}/issue-email`, { adminNotes });
    return data;
  },

  // Get issued emails history
  async getIssuedEmails(): Promise<IssuedEmailHistory[]> {
    const { data} = await api.get('/admin/issued-emails');
    return data;
  },

  // DAY-7: Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/stats');
    return data;
  },
};
