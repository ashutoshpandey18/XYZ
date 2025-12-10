import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getToken, isTokenExpired, getUserRole, clearToken } from '../lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const token = getToken();

  // No token - redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token expired - clear and redirect
  if (isTokenExpired()) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();

  // Role-based access control
  if (requiredRole && userRole !== requiredRole) {
    // STUDENT trying to access ADMIN route
    if (userRole === 'STUDENT') {
      return <Navigate to="/dashboard" replace />;
    }
    // ADMIN trying to access STUDENT route
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
