import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { EmailRequest } from "../types";

function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/student/me")
      .then((res) => {
        setUser(res.data);
        // Check if user is admin
        if (res.data.role !== "ADMIN") {
          toast.error("Access denied. Admin only.");
          navigate("/dashboard");
          return;
        }
        setIsLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  // Fetch pending requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const res = await api.get("/email-request");
      const requests = res.data as EmailRequest[];

      // Trigger OCR extraction for requests without extracted data
      for (const request of requests) {
        if (!request.extractedName && !request.extractedRoll && !request.extractedCollegeId) {
          // Trigger extraction asynchronously (don't wait)
          api.post(`/email-request/${request.id}/extract`).catch(err => {
            console.error('OCR extraction failed:', err);
          });
        }
      }

      return requests;
    },
    enabled: !isLoading,
    refetchInterval: 5000, // Refetch every 5 seconds to get OCR updates
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/email-request/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Approval failed";
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/email-request/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Rejection failed";
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-gray-50">
      <Toaster position="top-right" />
      <Navbar userName={user?.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <Card className="p-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      ADMIN
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-purple-100">
                    Manage pending email requests
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl border-2 border-white/30">
                    👑
                  </div>
                </div>
              </div>
            </Card>

            {/* Pending Requests */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pending Requests
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {requests?.length || 0} pending
                </span>
              </div>

              {requestsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading requests...
                </div>
              ) : !requests || requests.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">
                    No pending requests at the moment
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Extracted Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AI Recommendation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => {
                        const aiDecision = request.aiDecision?.aiDecision;
                        const confidenceScore = request.aiDecision?.confidenceScore || 0;

                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">
                                  {request.student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {request.student.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {request.student.email}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {request.extractedName || request.extractedRoll || request.extractedCollegeId ? (
                                <div className="space-y-1 min-w-[200px]">
                                  {request.extractedName && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-gray-500 font-medium min-w-[45px]">Name:</span>
                                      <span className="text-sm text-gray-900">{request.extractedName}</span>
                                    </div>
                                  )}
                                  {request.extractedRoll && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-gray-500 font-medium min-w-[45px]">Roll:</span>
                                      <span className="text-sm text-gray-900">{request.extractedRoll}</span>
                                    </div>
                                  )}
                                  {request.extractedCollegeId && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-gray-500 font-medium min-w-[45px]">ID:</span>
                                      <span className="text-sm text-gray-900">{request.extractedCollegeId}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Processing...
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {aiDecision ? (
                                <div className="space-y-1">
                                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                    aiDecision === 'LIKELY_APPROVE'
                                      ? 'bg-green-100 text-green-800'
                                      : aiDecision === 'REVIEW_MANUALLY'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {aiDecision === 'LIKELY_APPROVE' && '✓ '}
                                    {aiDecision === 'REVIEW_MANUALLY' && '⚠ '}
                                    {aiDecision === 'FLAG_SUSPICIOUS' && '⚡ '}
                                    {aiDecision === 'LIKELY_APPROVE' ? 'Likely Valid' : aiDecision === 'REVIEW_MANUALLY' ? 'Review' : 'Suspicious'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(confidenceScore * 100).toFixed(0)}% match
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <a
                                href={request.documentURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View →
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  onClick={() => approveMutation.mutate(request.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                  variant="primary"
                                  className="!w-auto px-3 py-1.5 text-xs"
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => rejectMutation.mutate(request.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                  variant="danger"
                                  className="!w-auto px-3 py-1.5 text-xs"
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
