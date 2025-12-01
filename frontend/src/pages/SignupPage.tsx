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

function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Submitting registration:", data);
      const res = await api.post("/auth/register", data);
      console.log("Registration successful:", res.data);
      localStorage.setItem("accessToken", res.data.accessToken);

      // Redirect based on role
      const role = getUserRole();
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(", ")
          : "Registration failed. Please try again.");
      setErrorMessage(message);
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
            Create your account
          </h1>
          <p className="text-gray-600">
            Get started with your college email platform
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
              {...register("name", { required: "Name is required" })}
              type="text"
              label="Full name"
              placeholder="John Doe"
              autoComplete="name"
              error={errors.name?.message as string}
            />

            <Input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              type="email"
              label="Email address"
              placeholder="you@college.edu"
              autoComplete="email"
              error={errors.email?.message as string}
            />

            <div>
              <Input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
                type="password"
                label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                error={errors.password?.message as string}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <Button type="submit" isLoading={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}

export default SignupPage;
