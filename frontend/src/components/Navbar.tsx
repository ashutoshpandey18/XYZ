import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getUserRole } from '../lib/auth';

interface NavbarProps {
  userName?: string;
}

const Navbar = ({ userName }: NavbarProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = getUserRole();

  const handleLogout = () => {
    // Clean logout - no dialogs
    localStorage.removeItem('accessToken');
    queryClient.clear(); // Clear all React Query cache

    // Role-based redirect
    if (userRole === 'ADMIN') {
      navigate('/login'); // Admin uses same login page
    } else {
      navigate('/login'); // Student redirect
    }
  };

  const panelName = userRole === 'ADMIN' ? 'Admin Panel' : 'Student Panel';
  const roleColor = userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <svg
                className="w-6 h-6 text-white"
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
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                College Email SaaS
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {panelName}
              </span>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColor} hidden sm:inline-block`}>
              {userRole}
            </span>

            {/* User Name */}
            {userName && (
              <span className="text-sm text-gray-700 font-medium hidden md:block">
                {userName}
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
