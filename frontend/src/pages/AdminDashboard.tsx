import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";

interface EmailRequest {
  id: string;
  documentURL: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

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
      return res.data as EmailRequest[];
    },
    enabled: !isLoading,
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
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={request.status} />
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
                      ))}
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
