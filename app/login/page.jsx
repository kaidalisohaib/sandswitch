"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "../utils/firebaseContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const {
    login,
    signUp,
    signInWithGoogle,
    error,
    setError,
    clearError,
    resendVerificationEmail,
    sendPasswordResetEmail,
  } = useFirebase();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Clear context error when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Handle email verification from other tabs
  useEffect(() => {
    // Set up BroadcastChannel
    const bc = new BroadcastChannel("email_verification");

    const handleVerification = async () => {
      // Clear any verification errors
      setFormErrors({});
      setVerificationSent(false);
      // If we have the email/password in formData, attempt to log in automatically
      if (formData.email && formData.password) {
        setIsSubmitting(true);
        try {
          const result = await login(formData.email, formData.password);
          if (result.success) {
            router.push(redirectTo);
          }
        } catch (err) {
          console.error("Auto-login error:", err);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    // Listen for BroadcastChannel messages
    const handleBroadcast = (event) => {
      if (event.data.type === "EMAIL_VERIFIED" && event.data.verified) {
        handleVerification();
      }
    };
    bc.addEventListener("message", handleBroadcast);

    // Also check localStorage as fallback
    if (localStorage.getItem("emailVerified") === "true") {
      handleVerification();
      localStorage.removeItem("emailVerified"); // Clean up after handling
    }

    // Cleanup
    return () => {
      bc.close();
    };
  }, [formData, login, router, redirectTo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Name validation (only for signup)
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login with Firebase
        const result = await login(formData.email, formData.password);

        if (result.success) {
          if (result.verificationNeeded) {
            setFormErrors({
              verification:
                "Please verify your email address before logging in.",
            });
            setVerificationSent(false);
            return;
          }
          // Redirect to the specified redirect URL or dashboard
          router.push(redirectTo);
        } else {
          // Improved error messages
          let errorMessage = "Login failed. Please check your credentials.";
          if (result.error) {
            if (result.error.includes("auth/invalid-credential")) {
              errorMessage = "Invalid email or password. Please try again.";
            } else if (result.error.includes("auth/user-not-found")) {
              errorMessage =
                "No account found with this email. Please check your email or sign up.";
            } else if (result.error.includes("auth/wrong-password")) {
              errorMessage = "Incorrect password. Please try again.";
            } else if (result.error.includes("auth/too-many-requests")) {
              errorMessage =
                "Too many failed attempts. Please try again later or reset your password.";
            }
          }
          setFormErrors({ login: errorMessage });
        }
      } else {
        // Register with Firebase
        const result = await signUp(
          formData.email,
          formData.password,
          formData.name
        );

        if (result.success) {
          setFormErrors({
            verification: "Please check your email to verify your account.",
          });
          setVerificationSent(true);
        } else {
          // Improved signup error messages
          let errorMessage = "Registration failed. Please try again.";
          if (result.error) {
            if (result.error.includes("auth/email-already-in-use")) {
              errorMessage =
                "An account with this email already exists. Please sign in or reset your password.";
            } else if (result.error.includes("auth/invalid-email")) {
              errorMessage = "Please enter a valid email address.";
            } else if (result.error.includes("auth/weak-password")) {
              errorMessage =
                "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
            }
          }
          setFormErrors({ register: errorMessage });
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setFormErrors({
        submit: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        setVerificationSent(true);
        setFormErrors({
          verification:
            "A new verification email has been sent. Please check your inbox.",
        });
      } else {
        setFormErrors({
          verification: "Failed to send verification email. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error sending verification email:", err);
      setFormErrors({
        verification: "Failed to send verification email. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    // Clear any existing errors
    setFormErrors({});

    // Validate email
    if (!formData.email || !formData.email.trim()) {
      setFormErrors({
        email: "Please enter your email address to reset your password",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormErrors({
        email: "Please enter a valid email address",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendPasswordResetEmail(formData.email);
      if (result.success) {
        setResetEmailSent(true);
        setFormErrors({
          reset:
            "Password reset email sent! Please check your inbox and spam folder for instructions.",
        });
        setShowResetModal(false);
      } else {
        setFormErrors({
          reset:
            result.error || "Failed to send reset email. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error sending reset email:", err);
      setFormErrors({
        reset:
          "An error occurred while sending the reset email. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear any errors when switching modes
    setFormErrors({});
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.push(redirectTo);
      } else {
        setFormErrors({
          google:
            result.error || "Failed to sign in with Google. Please try again.",
        });
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setFormErrors({
        google: "An error occurred during Google sign in. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display general error message if there is one
  const generalError =
    formErrors.login || formErrors.register || formErrors.submit || error;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleAuthMode}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Show verification message if needed */}
          {formErrors.verification && (
            <div
              className={`mb-4 p-4 rounded-md ${
                verificationSent
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${
                      verificationSent ? "text-green-400" : "text-yellow-400"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm ${
                      verificationSent
                        ? "text-green-700 dark:text-green-200"
                        : "text-yellow-700 dark:text-yellow-200"
                    }`}
                  >
                    {formErrors.verification}
                  </p>
                  {!verificationSent && isLogin && (
                    <button
                      onClick={handleResendVerification}
                      disabled={isSubmitting}
                      className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600 dark:text-yellow-200 dark:hover:text-yellow-100 focus:outline-none"
                    >
                      {isSubmitting
                        ? "Sending..."
                        : "Resend verification email"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show reset email success message */}
          {formErrors.reset && (
            <div
              className={`mb-4 p-4 rounded-md ${
                resetEmailSent
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${
                      resetEmailSent ? "text-green-400" : "text-yellow-400"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm ${
                      resetEmailSent
                        ? "text-green-700 dark:text-green-200"
                        : "text-yellow-700 dark:text-yellow-200"
                    }`}
                  >
                    {formErrors.reset}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show general error message if there is one */}
          {generalError && !formErrors.verification && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
              <p className="text-sm text-red-700 dark:text-red-300">
                {generalError}
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name field (signup only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      formErrors.name
                        ? "border-red-300 dark:border-red-700"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.email
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.password
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {formErrors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Remember me & forgot password (login only) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    onClick={() => setShowResetModal(true)}
                    type="button"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-6 mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {formErrors.google && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center">
                {formErrors.google}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Password Reset Modal - Updated positioning */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay with improved opacity */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setShowResetModal(false)}
            ></div>

            {/* Modal positioning helper */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel with improved positioning */}
            <div className="relative inline-block align-middle bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
              {/* Close button */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setShowResetModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <svg
                    className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                    id="modal-title"
                  >
                    Reset Your Password
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter your email address below and we'll send you
                      instructions to reset your password. The reset link will
                      be valid for 1 hour.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <div className="mb-4">
                  <label htmlFor="reset-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email address"
                  />
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
