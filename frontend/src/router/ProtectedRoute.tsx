import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getUserRole } from "../lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "STUDENT" | "ADMIN";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const token = localStorage.getItem("accessToken");
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard
    if (userRole === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
