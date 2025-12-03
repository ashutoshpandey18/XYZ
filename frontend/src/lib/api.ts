import axios from "axios";
import type { IssuedEmailHistory } from "../types";

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
  async issueCollegeEmail(requestId: string) {
    const { data } = await api.post(`/admin/email-issue/${requestId}`);
    return data;
  },

  async getIssuedEmails(): Promise<IssuedEmailHistory[]> {
    const { data } = await api.get('/admin/issued-emails');
    return data;
  },

  async getPendingIssuances() {
    const { data } = await api.get('/admin/pending-issuances');
    return data;
  },
};
