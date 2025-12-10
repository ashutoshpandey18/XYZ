import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, getStudentRequests, uploadIdCard } from '../lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import UploadCard from '../components/UploadCard';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import ConfidenceBadge from '../components/ui/ConfidenceBadge';

function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['student-requests'],
    queryFn: getStudentRequests,
    refetchInterval: 2000, // Auto-refresh every 2 seconds for OCR/AI updates
  });

  const uploadMutation = useMutation({
    mutationFn: uploadIdCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('ID card uploaded successfully! Processing...');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload ID card');
    },
  });

  const latestRequest = requests[0];

  const getTimelineEvents = () => {
    if (!latestRequest) return [];

    const events = [
      {
        title: 'Request Created',
        timestamp: latestRequest.createdAt,
        completed: true,
      },
      {
        title: 'OCR Processing',
        timestamp: latestRequest.extractedName ? latestRequest.updatedAt : undefined,
        completed: !!latestRequest.extractedName,
      },
      {
        title: 'AI Evaluation',
        timestamp: latestRequest.aiDecision ? latestRequest.updatedAt : undefined,
        completed: !!latestRequest.aiDecision,
      },
      {
        title: 'Admin Review',
        timestamp: latestRequest.processedAt,
        completed: latestRequest.status !== 'PENDING',
      },
      {
        title: 'Email Issued',
        timestamp: latestRequest.emailSentAt,
        completed: latestRequest.status === 'ISSUED',
      },
    ];

    return events;
  };

  if (userLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your college email request</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile & Upload */}
            <div className="space-y-6">
              {/* Profile Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
                <ProfilePhotoUploader
                  profilePhotoUrl={user.profilePhotoUrl}
                  userName={user.name}
                />
                <div className="mt-6 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  {user.collegeEmail && (
                    <div>
                      <p className="text-xs text-gray-500">College Email</p>
                      <p className="text-sm font-medium text-green-600">{user.collegeEmail}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Upload Card */}
              {(!latestRequest || latestRequest.status === 'REJECTED') && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Upload ID Card</h2>
                  <UploadCard
                    onFileSelected={(file) => uploadMutation.mutate(file)}
                    isLoading={uploadMutation.isPending}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Request Status */}
            <div className="lg:col-span-2">
              {latestRequest ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Request Status</h2>
                    <StatusBadge status={latestRequest.status} />
                  </div>

                  {/* OCR Results */}
                  {latestRequest.extractedName && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">OCR Extracted Data</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-medium text-gray-900">{latestRequest.extractedName}</p>
                        </div>
                        {latestRequest.extractedRoll && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Roll Number</p>
                            <p className="text-sm font-medium text-gray-900">{latestRequest.extractedRoll}</p>
                          </div>
                        )}
                        {latestRequest.extractedCollegeId && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500">College ID</p>
                            <p className="text-sm font-medium text-gray-900">{latestRequest.extractedCollegeId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Decision */}
                  {latestRequest.aiDecision && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Evaluation</h3>
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-xs text-gray-500">Decision</p>
                          <p className="text-sm font-medium text-gray-900">{latestRequest.aiDecision}</p>
                        </div>
                        {latestRequest.confidenceScore && (
                          <div>
                            <p className="text-xs text-gray-500">Confidence</p>
                            <ConfidenceBadge score={latestRequest.confidenceScore} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* College Email (if issued) */}
                  {latestRequest.status === 'ISSUED' && user.collegeEmail && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-green-900">Email Issued!</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Your college email: <strong>{user.collegeEmail}</strong>
                          </p>
                          <p className="text-xs text-green-600 mt-1">Check your personal email for credentials.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {latestRequest.status === 'REJECTED' && latestRequest.adminNotes && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-900">Rejection Reason</h3>
                      <p className="text-sm text-red-700 mt-1">{latestRequest.adminNotes}</p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress Timeline</h3>
                    <div className="space-y-4">
                      {getTimelineEvents().map((event, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            event.completed ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {event.completed ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className={`text-sm font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                              {event.title}
                            </p>
                            {event.timestamp && (
                              <p className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ID Card Preview */}
                  {latestRequest.documentURL && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded ID Card</h3>
                      <img
                        src={`http://localhost:3000${latestRequest.documentURL}`}
                        alt="ID Card"
                        className="max-w-full h-auto rounded border border-gray-200"
                      />
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Request Yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload your college ID card to request a college email address.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardPage;
