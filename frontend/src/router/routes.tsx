import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import AdminDashboard from '../pages/AdminDashboard';
import AuditLogsPage from '../pages/AuditLogsPage';
import EmailSettingsPage from '../pages/EmailSettingsPage';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requiredRole="STUDENT">
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/audit-logs',
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <AuditLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/email-settings',
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <EmailSettingsPage />
      </ProtectedRoute>
    ),
  },
]);
