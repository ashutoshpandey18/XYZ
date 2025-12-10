import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminRequests, getAdminStats, approveRequest, rejectRequest, issueEmail } from '../lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import ConfidenceBadge from '../components/ui/ConfidenceBadge';
import Button from '../components/ui/Button';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const { data: paginatedData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: getAdminRequests,
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });

  // Safely extract array from paginated response
  const requests = paginatedData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Request approved successfully');
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => rejectRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Request rejected');
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const issueMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => issueEmail(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`College email issued: ${data.collegeEmail}`);
      toast.success(`Temporary password: ${data.tempPassword}`, { duration: 10000 });
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to issue email');
    },
  });

  // Memoized filtered and searched requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply status filter
    if (filter !== 'ALL') {
      filtered = filtered.filter((req: any) => req.status === filter);
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((req: any) => {
        const studentName = req.user?.name?.toLowerCase() || '';
        const studentEmail = req.user?.email?.toLowerCase() || '';
        const extractedName = req.extractedName?.toLowerCase() || '';
        const extractedRoll = req.extractedRoll?.toLowerCase() || '';
        return (
          studentName.includes(search) ||
          studentEmail.includes(search) ||
          extractedName.includes(search) ||
          extractedRoll.includes(search)
        );
      });
    }

    return filtered;
  }, [requests, filter, searchTerm]);

  if (statsLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage email requests and student verifications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.pending || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats?.approved || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Issued</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.issued || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ISSUED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search by name, email, roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Requests Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requests</h2>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No requests found</h3>
                <p className="mt-2 text-sm text-gray-500">No requests match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extracted Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Decision</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.user?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{request.user?.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {request.extractedName ? (
                            <div className="space-y-1">
                              <div><span className="text-gray-500">Name:</span> {request.extractedName}</div>
                              {request.extractedRoll && (
                                <div><span className="text-gray-500">Roll:</span> {request.extractedRoll}</div>
                              )}
                              {request.extractedCollegeId && (
                                <div><span className="text-gray-500">ID:</span> {request.extractedCollegeId}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Processing...</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {request.aiDecision ? (
                            <div className="flex flex-col space-y-1">
                              <span className={request.aiDecision === 'APPROVE' ? 'text-green-600' : 'text-red-600'}>
                                {request.aiDecision}
                              </span>
                              {request.confidenceScore && (
                                <ConfidenceBadge score={request.confidenceScore} />
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => setSelectedRequest(request)}
                            variant="secondary"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Student Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                </div>

                {/* Extracted Data */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">OCR Extracted Data</h3>
                  {selectedRequest.extractedName ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.extractedName}</p>
                      </div>
                      {selectedRequest.extractedRoll && (
                        <div>
                          <p className="text-xs text-gray-500">Roll Number</p>
                          <p className="text-sm font-medium text-gray-900">{selectedRequest.extractedRoll}</p>
                        </div>
                      )}
                      {selectedRequest.extractedCollegeId && (
                        <div>
                          <p className="text-xs text-gray-500">College ID</p>
                          <p className="text-sm font-medium text-gray-900">{selectedRequest.extractedCollegeId}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">OCR processing in progress...</p>
                  )}
                </div>
              </div>

              {/* AI Decision */}
              {selectedRequest.aiDecision && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Evaluation</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-gray-500">Decision</p>
                      <p className={`text-sm font-medium ${selectedRequest.aiDecision === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedRequest.aiDecision}
                      </p>
                    </div>
                    {selectedRequest.confidenceScore && (
                      <div>
                        <p className="text-xs text-gray-500">Confidence</p>
                        <ConfidenceBadge score={selectedRequest.confidenceScore} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ID Card Preview */}
              {selectedRequest.documentURL && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">ID Card</h3>
                  <img
                    src={`http://localhost:3000${selectedRequest.documentURL}`}
                    alt="ID Card"
                    className="max-w-full h-auto rounded border border-gray-200"
                  />
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'PENDING' && (
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (optional for approval, required for rejection)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Enter any notes or reason for rejection..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => approveMutation.mutate({ id: selectedRequest.id, notes: notes.trim() || undefined })}
                        disabled={approveMutation.isPending}
                        className="flex-1"
                      >
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => {
                          if (!notes.trim()) {
                            toast.error('Please provide a reason for rejection');
                            return;
                          }
                          rejectMutation.mutate({ id: selectedRequest.id, notes });
                        }}
                        disabled={rejectMutation.isPending}
                        variant="secondary"
                        className="flex-1"
                      >
                        {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'APPROVED' && (
                <div className="border-t pt-6">
                  <Button
                    onClick={() => issueMutation.mutate({ id: selectedRequest.id, notes: notes.trim() || undefined })}
                    disabled={issueMutation.isPending}
                    className="w-full"
                  >
                    {issueMutation.isPending ? 'Issuing Email...' : 'Issue College Email'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
