import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import SkeletonCard from "../components/ui/SkeletonCard";
import type { EmailRequest } from "../types";

function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/student/me")
      .then((res) => {
        setUser(res.data);
        setIsLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  // Fetch email requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["email-requests"],
    queryFn: async () => {
      const res = await api.get("/email-request/me");
      return res.data as EmailRequest[];
    },
    enabled: !isLoading,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      const res = await api.post("/email-request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["email-requests"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Upload failed";
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF, PNG, and JPG files are allowed");
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const hasPendingRequest = requests?.some((req) => req.status === "PENDING");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-50">
      <Toaster position="top-right" />
      <Navbar userName={user?.name} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Welcome Card */}
            <Card className="p-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white" hoverable>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      STUDENT
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name?.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Submit your ID card to request a college email address
                  </p>
                </div>
              </div>
            </Card>

            {/* Upload Section */}
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Upload ID Card
              </h2>

              {hasPendingRequest ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <svg
                    className="w-12 h-12 text-yellow-600 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-yellow-800 font-medium">
                    You already have a pending request
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please wait for admin approval before submitting a new request
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select your ID card (PDF, PNG, or JPG - Max 2MB)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    isLoading={uploadMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Submit Request"}
                  </Button>
                </div>
              )}
            </Card>

            {/* Requests Table */}
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                My Requests
              </h2>

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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500">No requests yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload your ID card to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Extracted Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {request.extractedName || request.extractedRoll || request.extractedCollegeId ? (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1"
                              >
                                {request.extractedName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Name:</span>
                                    <span className="text-sm font-medium text-gray-900">{request.extractedName}</span>
                                  </div>
                                )}
                                {request.extractedRoll && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Roll:</span>
                                    <span className="text-sm font-medium text-gray-900">{request.extractedRoll}</span>
                                  </div>
                                )}
                                {request.extractedCollegeId && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">ID:</span>
                                    <span className="text-sm font-medium text-gray-900">{request.extractedCollegeId}</span>
                                  </div>
                                )}
                              </motion.div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={request.documentURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Document →
                            </a>
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

export default DashboardPage;
