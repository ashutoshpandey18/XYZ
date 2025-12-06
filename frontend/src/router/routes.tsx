import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage.tsx";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import EnhancedStudentDashboard from "../pages/EnhancedStudentDashboard";
import NewAdminDashboard from "../pages/NewAdminDashboard";
import EnhancedAdminDashboard from "../pages/EnhancedAdminDashboard";
import AuditLogsPage from "../pages/AuditLogsPage";
import EmailSettingsPage from "../pages/EmailSettingsPage";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <SignupPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiredRole="STUDENT">
        <EnhancedStudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <EnhancedAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/audit-logs",
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <AuditLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <EmailSettingsPage />
      </ProtectedRoute>
    ),
  },
]);
