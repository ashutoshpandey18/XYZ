import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../lib/api";
import {
  Navbar,
  Card,
  Button,
  Timeline,
  LoadingOverlay,
  OCRPreview,
  UserInfoCard,
  ConfidenceBadge,
} from "../components/ui";
import type { EmailRequest, TimelineEvent } from "../types";

export default function EnhancedStudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // Fetch user data
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
  const { data: requests, isLoading: requestsLoading, refetch } = useQuery({
    queryKey: ["email-requests"],
    queryFn: async () => {
      const res = await api.get("/email-request/me");
      return res.data as EmailRequest[];
    },
    enabled: !isLoading,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const latestRequest = requests?.[0];

  // Generate timeline based on request status
  const getTimeline = (request?: EmailRequest): TimelineEvent[] => {
    if (!request) {
      return [
        {
          id: '1',
          title: 'Upload ID Card',
          description: 'Upload your student ID card to begin',
          status: 'current',
          icon: '📄',
        },
        {
          id: '2',
          title: 'OCR Processing',
          description: 'Extract data from your document',
          status: 'pending',
          icon: '🔍',
        },
        {
          id: '3',
          title: 'AI Verification',
          description: 'AI reviews your document',
          status: 'pending',
          icon: '🤖',
        },
        {
          id: '4',
          title: 'Admin Review',
          description: 'Admin approves your request',
          status: 'pending',
          icon: '👤',
        },
        {
          id: '5',
          title: 'Email Issued',
          description: 'Receive your college email',
          status: 'pending',
          icon: '📧',
        },
      ];
    }

    const events: TimelineEvent[] = [
      {
        id: '1',
        title: 'Document Uploaded',
        description: 'Your ID card has been received',
        status: 'completed',
        icon: '✓',
        timestamp: request.createdAt,
      },
    ];

    if (request.extractedName || request.extractedRoll) {
      events.push({
        id: '2',
        title: 'OCR Completed',
        description: `Extracted: ${request.extractedName || 'Name'}, Roll: ${request.extractedRoll || 'N/A'}`,
        status: 'completed',
        icon: '✓',
      });
    } else {
      events.push({
        id: '2',
        title: 'OCR Processing',
        description: 'Extracting data from document...',
        status: 'current',
        icon: '🔄',
      });
      return events;
    }

    if (request.aiDecision && request.confidenceScore !== undefined) {
      events.push({
        id: '3',
        title: 'AI Verification Complete',
        description: `Decision: ${request.aiDecision} (${(request.confidenceScore * 100).toFixed(0)}% confidence)`,
        status: 'completed',
        icon: '✓',
      });
    } else {
      events.push({
        id: '3',
        title: 'AI Verification',
        description: 'AI is analyzing your document...',
        status: 'current',
        icon: '🔄',
      });
      return events;
    }

    if (request.status === 'APPROVED') {
      events.push({
        id: '4',
        title: 'Request Approved',
        description: 'Admin has approved your request',
        status: 'completed',
        icon: '✓',
        timestamp: request.processedAt,
      });
      events.push({
        id: '5',
        title: 'Email Issuance Pending',
        description: 'Your college email will be issued soon',
        status: 'current',
        icon: '⏳',
      });
    } else if (request.status === 'REJECTED') {
      events.push({
        id: '4',
        title: 'Request Rejected',
        description: request.adminNotes || 'Your request was not approved',
        status: 'completed',
        icon: '✗',
        timestamp: request.processedAt,
      });
    } else if (request.status === 'ISSUED') {
      events.push({
        id: '4',
        title: 'Request Approved',
        description: 'Admin approved your request',
        status: 'completed',
        icon: '✓',
        timestamp: request.processedAt,
      });
      events.push({
        id: '5',
        title: 'College Email Issued',
        description: `Your email: ${user?.collegeEmail}`,
        status: 'completed',
        icon: '✓',
        timestamp: user?.emailIssuedAt,
      });
    } else {
      events.push({
        id: '4',
        title: 'Admin Review',
        description: 'Waiting for admin approval...',
        status: 'current',
        icon: '⏳',
      });
    }

    return events;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF, PNG, and JPG files are allowed");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await api.post("/email-request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      setTimeout(() => {
        refetch();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      const message = error.response?.data?.message || "Upload failed";
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  const getStatusBadge = () => {
    if (!latestRequest) return null;

    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Under Review' },
      APPROVED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
      ISSUED: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Email Issued' },
    };

    const config = statusConfig[latestRequest.status];

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-50">
      <Toaster position="top-right" />
      <LoadingOverlay isLoading={isUploading} message={`Uploading... ${uploadProgress}%`} />
      <Navbar userName={user?.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your college email request status
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <UserInfoCard
                name={user?.name || ''}
                email={user?.email || ''}
                collegeEmail={user?.collegeEmail}
                role="Student"
              />
            </motion.div>

            {/* Upload Section */}
            {!latestRequest && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Upload ID Card
                  </h3>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="mt-2 text-sm text-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <span className="mt-1 text-xs text-gray-500">
                          PDF, PNG, JPG (max 2MB)
                        </span>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <span className="text-sm text-blue-900 truncate">
                          {selectedFile.name}
                        </span>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? 'Uploading...' : 'Submit Request'}
                    </Button>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>✓ Ensure your roll number is visible (15 digits)</p>
                      <p>✓ Image should be clear and well-lit</p>
                      <p>✓ All corners of ID card should be visible</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Status Card */}
            {latestRequest && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Request Status
                  </h3>
                  <div className="space-y-4">
                    {getStatusBadge()}

                    {latestRequest.status === 'ISSUED' && user?.collegeEmail && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">
                          🎉 College Email Issued!
                        </h4>
                        <p className="text-sm text-green-800 break-all">
                          {user.collegeEmail}
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                          Check your personal email for credentials
                        </p>
                      </div>
                    )}

                    {latestRequest.status === 'REJECTED' && latestRequest.adminNotes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-red-900 mb-2">
                          Rejection Reason:
                        </h4>
                        <p className="text-sm text-red-800">{latestRequest.adminNotes}</p>
                      </div>
                    )}

                    {latestRequest.aiDecision && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI Confidence:</span>
                        <ConfidenceBadge score={latestRequest.confidenceScore} />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Timeline & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Request Timeline
                </h3>
                <Timeline events={getTimeline(latestRequest)} />
              </Card>
            </motion.div>

            {/* OCR Data */}
            {latestRequest && (latestRequest.extractedName || latestRequest.extractedRoll) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <OCRPreview
                    extractedName={latestRequest.extractedName}
                    extractedRoll={latestRequest.extractedRoll}
                    extractedCollegeId={latestRequest.extractedCollegeId}
                    studentName={user?.name || ''}
                    highlightMismatches={false}
                  />
                </Card>
              </motion.div>
            )}

            {/* Document Preview */}
            {latestRequest && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Uploaded Document
                  </h3>
                  <img
                    src={latestRequest.documentURL}
                    alt="Uploaded ID"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!latestRequest && !requestsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 mt-8"
          >
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  No Request Submitted Yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Upload your student ID card to get started with your college email request.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
