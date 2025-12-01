import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import { getUserRole } from "../lib/auth";

function LoginPage() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await api.post("/auth/login", data);
      localStorage.setItem("accessToken", res.data.accessToken);

      // Redirect based on role
      const role = getUserRole();
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMessage("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to access your college email dashboard
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            <Input
              {...register("email", { required: true })}
              type="email"
              label="Email address"
              placeholder="you@college.edu"
              autoComplete="email"
            />

            <Input
              {...register("password", { required: true })}
              type="password"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Secure access to your college email platform
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
