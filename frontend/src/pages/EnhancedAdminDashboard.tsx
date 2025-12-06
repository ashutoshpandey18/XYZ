import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { adminApi } from '../lib/api';
import {
  LoadingOverlay,
  Timeline,
  OCRPreview,
  ConfidenceBadge,
} from '../components/ui';
import type { EmailRequest, EmailRequestStatus, TimelineEvent } from '../types';

export default function EnhancedAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<EmailRequestStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<EmailRequest | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  // Fetch requests with filters
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-requests', selectedStatus, search, sortBy, order, page],
    queryFn: () =>
      adminApi.getAllRequests({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search || undefined,
        sortBy,
        order,
        page,
        limit: 20,
      }),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Request approved successfully!');
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.rejectRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Request rejected');
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });

  const issueEmailMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.issueCollegeEmail(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('College email issued successfully!');
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error('Failed to issue email');
    },
  });

  const getStatusColor = (status: EmailRequestStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      ISSUED: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[status];
  };

  const getRequestTimeline = (request: EmailRequest): TimelineEvent[] => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        title: 'Request Submitted',
        description: `By ${request.student.name}`,
        status: 'completed',
        timestamp: request.createdAt,
        icon: '📝',
      },
    ];

    if (request.extractedName) {
      events.push({
        id: '2',
        title: 'OCR Processing Complete',
        description: `Extracted: ${request.extractedName}, ${request.extractedRoll}`,
        status: 'completed',
        icon: '🔍',
      });
    }

    if (request.aiDecision) {
      events.push({
        id: '3',
        title: 'AI Analysis Complete',
        description: `Decision: ${request.aiDecision}`,
        status: 'completed',
        icon: '🤖',
      });
    }

    if (request.status === 'APPROVED') {
      events.push({
        id: '4',
        title: 'Request Approved',
        description: request.adminNotes || 'Approved by admin',
        status: 'completed',
        timestamp: request.processedAt,
        icon: '✅',
      });
    } else if (request.status === 'REJECTED') {
      events.push({
        id: '4',
        title: 'Request Rejected',
        description: request.adminNotes || 'Rejected by admin',
        status: 'completed',
        timestamp: request.processedAt,
        icon: '❌',
      });
    } else if (request.status === 'ISSUED') {
      events.push({
        id: '4',
        title: 'Request Approved',
        status: 'completed',
        timestamp: request.processedAt,
        icon: '✅',
      });
      events.push({
        id: '5',
        title: 'College Email Issued',
        description: request.student.collegeEmail,
        status: 'completed',
        timestamp: request.student.emailIssuedAt,
        icon: '📧',
      });
    }

    return events;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      <LoadingOverlay
        isLoading={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          issueEmailMutation.isPending
        }
        message="Processing..."
      />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>

            <Link
              to="/admin/audit-logs"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {sidebarOpen && <span>Audit Logs</span>}
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {sidebarOpen && <span>Settings</span>}
            </Link>
          </nav>

          {/* Status Filters */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Filter by Status
              </h3>
              <div className="space-y-1">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ISSUED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedStatus === status
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {status}
                    {stats && status !== 'ALL' && (
                      <span className="float-right text-xs text-gray-500">
                        {stats[status.toLowerCase() as keyof typeof stats]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login');
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage student email requests</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="text-sm font-medium text-gray-600">Total Requests</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalRequests}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-6"
              >
                <div className="text-sm font-medium text-yellow-900">Pending</div>
                <div className="mt-2 text-3xl font-bold text-yellow-900">{stats.pending}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6"
              >
                <div className="text-sm font-medium text-green-900">Approved</div>
                <div className="mt-2 text-3xl font-bold text-green-900">{stats.approved}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-6"
              >
                <div className="text-sm font-medium text-red-900">Rejected</div>
                <div className="mt-2 text-3xl font-bold text-red-900">{stats.rejected}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6"
              >
                <div className="text-sm font-medium text-blue-900">Issued</div>
                <div className="mt-2 text-3xl font-bold text-blue-900">{stats.issued}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6"
              >
                <div className="text-sm font-medium text-purple-900">Total Emails</div>
                <div className="mt-2 text-3xl font-bold text-purple-900">
                  {stats.totalIssuedEmails}
                </div>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by name, email, roll..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="confidenceScore">Confidence Score</option>
                <option value="status">Status</option>
              </select>

              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>

              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('ALL');
                  setSortBy('createdAt');
                  setOrder('desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4">Loading requests...</p>
              </div>
            ) : requestsData?.requests.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No requests found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          OCR Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          AI Analysis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requestsData?.requests.map((request) => (
                        <motion.tr
                          key={request.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.student.name}
                              </div>
                              <div className="text-sm text-gray-500">{request.student.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {request.extractedName || '-'}
                              </div>
                              <div className="text-gray-500">
                                {request.extractedRoll || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.confidenceScore !== undefined && (
                              <ConfidenceBadge score={request.confidenceScore} />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            {request.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() =>
                                    approveMutation.mutate({ id: request.id })
                                  }
                                  className="text-green-600 hover:text-green-900 font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    rejectMutation.mutate({
                                      id: request.id,
                                      notes: 'Needs review',
                                    })
                                  }
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {request.status === 'APPROVED' && !request.student.emailIssued && (
                              <button
                                onClick={() =>
                                  issueEmailMutation.mutate({ id: request.id })
                                }
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Issue Email 📧
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {requestsData && requestsData.pagination.totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                    <div className="text-sm text-gray-700">
                      Page {requestsData.pagination.page} of{' '}
                      {requestsData.pagination.totalPages} ({requestsData.pagination.total}{' '}
                      total)
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPage((p) =>
                            Math.min(requestsData.pagination.totalPages, p + 1)
                          )
                        }
                        disabled={page === requestsData.pagination.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Student Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.student.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.student.email}</span>
                    </div>
                    {selectedRequest.student.collegeEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">College Email:</span>
                        <span className="text-sm text-blue-600">
                          {selectedRequest.student.collegeEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* OCR Data */}
                {(selectedRequest.extractedName || selectedRequest.extractedRoll) && (
                  <OCRPreview
                    extractedName={selectedRequest.extractedName}
                    extractedRoll={selectedRequest.extractedRoll}
                    extractedCollegeId={selectedRequest.extractedCollegeId}
                    studentName={selectedRequest.student.name}
                    highlightMismatches={true}
                  />
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h3>
                  <Timeline events={getRequestTimeline(selectedRequest)} />
                </div>

                {/* Document */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Document</h3>
                  <img
                    src={selectedRequest.documentURL}
                    alt="ID Document"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  {selectedRequest.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate({ id: selectedRequest.id })}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() =>
                          rejectMutation.mutate({
                            id: selectedRequest.id,
                            notes: 'Needs review',
                          })
                        }
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        Reject Request
                      </button>
                    </>
                  )}
                  {selectedRequest.status === 'APPROVED' && !selectedRequest.student.emailIssued && (
                    <button
                      onClick={() => issueEmailMutation.mutate({ id: selectedRequest.id })}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Issue College Email 📧
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
