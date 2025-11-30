import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

interface NavbarProps {
  userName?: string;
}

const Navbar = ({ userName }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-blue-600"
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
            <span className="text-lg font-semibold text-gray-900">
              College Email
            </span>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {userName}
              </span>
            )}
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="!w-auto px-4 py-2"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
