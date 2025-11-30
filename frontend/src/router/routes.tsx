import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage.tsx";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
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
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
]);
