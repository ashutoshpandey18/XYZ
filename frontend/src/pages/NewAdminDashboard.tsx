import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import type { EmailRequest, EmailRequestStatus } from '../types';

export default function NewAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<EmailRequestStatus | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<EmailRequest | null>(null);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  // Fetch requests with filters
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-requests', status, search, sortBy, order, page],
    queryFn: () => adminApi.getAllRequests({
      status: status || undefined,
      search: search || undefined,
      sortBy,
      order,
      page,
      limit: 20,
    }),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedRequest(null);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.rejectRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedRequest(null);
    },
  });

  // Issue email mutation
  const issueEmailMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminApi.issueCollegeEmail(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedRequest(null);
    },
  });

  const getStatusColor = (status: EmailRequestStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ISSUED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 0.8) return <span className="text-green-600 font-semibold">High ({(score * 100).toFixed(0)}%)</span>;
    if (score >= 0.5) return <span className="text-yellow-600 font-semibold">Medium ({(score * 100).toFixed(0)}%)</span>;
    return <span className="text-red-600 font-semibold">Low ({(score * 100).toFixed(0)}%)</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <div className="text-sm text-yellow-800">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-sm text-green-800">Approved</div>
              <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-sm text-red-800">Rejected</div>
              <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-sm text-blue-800">Issued</div>
              <div className="text-2xl font-bold text-blue-900">{stats.issued}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <div className="text-sm text-purple-800">Total Emails</div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalIssuedEmails}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name, email, roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EmailRequestStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ISSUED">Issued</option>
            </select>

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
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : requestsData?.requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No requests found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Extracted Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requestsData?.requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.student.name}</div>
                            <div className="text-sm text-gray-500">{request.student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>{request.extractedName || '-'}</div>
                            <div className="text-gray-500">{request.extractedRoll || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getConfidenceBadge(request.confidenceScore)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
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
                                onClick={() => approveMutation.mutate({ id: request.id })}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate({ id: request.id })}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'APPROVED' && !request.student.emailIssued && (
                            <button
                              onClick={() => issueEmailMutation.mutate({ id: request.id })}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Issue Email 📧
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {requestsData && requestsData.pagination.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Page {requestsData.pagination.page} of {requestsData.pagination.totalPages} ({requestsData.pagination.total} total)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(requestsData.pagination.totalPages, p + 1))}
                      disabled={page === requestsData.pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Student Information</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div><span className="font-medium">Name:</span> {selectedRequest.student.name}</div>
                  <div><span className="font-medium">Email:</span> {selectedRequest.student.email}</div>
                  {selectedRequest.student.collegeEmail && (
                    <div><span className="font-medium">College Email:</span> {selectedRequest.student.collegeEmail}</div>
                  )}
                </div>
              </div>

              {/* Extracted Data */}
              <div>
                <h3 className="text-lg font-semibold mb-2">OCR Extracted Data</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div><span className="font-medium">Name:</span> {selectedRequest.extractedName || 'Not extracted'}</div>
                  <div><span className="font-medium">Roll Number:</span> {selectedRequest.extractedRoll || 'Not extracted'}</div>
                  <div><span className="font-medium">College ID:</span> {selectedRequest.extractedCollegeId || 'Not extracted'}</div>
                </div>
              </div>

              {/* AI Decision */}
              {selectedRequest.aiDecision && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div><span className="font-medium">Decision:</span> {selectedRequest.aiDecision}</div>
                    <div><span className="font-medium">Confidence:</span> {getConfidenceBadge(selectedRequest.confidenceScore)}</div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.adminNotes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    {selectedRequest.adminNotes}
                  </div>
                </div>
              )}

              {/* Document */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Uploaded Document</h3>
                <img src={selectedRequest.documentURL} alt="ID Document" className="w-full rounded border" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
