import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import SkeletonCard from "../components/ui/SkeletonCard";

function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar userName={user?.name} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Welcome Card */}
            <Card className="p-8" hoverable>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.name?.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Your college email dashboard is ready
                  </p>
                </div>
              </div>
            </Card>

            {/* Profile Info Card */}
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">{user?.name}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Account Role</p>
                    <p className="text-gray-900 font-medium">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {user?.role || "Student"}
                      </span>
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center" hoverable>
                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </Card>
              <Card className="p-6 text-center" hoverable>
                <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                <p className="text-sm text-gray-600">Emails Received</p>
              </Card>
              <Card className="p-6 text-center" hoverable>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  Active
                </div>
                <p className="text-sm text-gray-600">Account Status</p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
