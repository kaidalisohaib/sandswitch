"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../utils/firebaseContext';
import { auth } from '../utils/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, sendEmailVerification } from 'firebase/auth';
import { ToastContainer } from '../components/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { 
    currentUser, 
    updateUserProfile, 
    sendPasswordResetEmail,
    isLoading: authLoading,
    setError, 
    clearError 
  } = useFirebase();
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalError, setModalError] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      setDisplayName(currentUser.name || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser, authLoading, router]);

  // If still loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-xl">Loading...</div>
      </div>
    );
  }

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleReauthentication = async () => {
    try {
      setIsLoading(true);
      setModalError(''); // Clear any previous errors
      
      if (!currentPassword) {
        setModalError('Please enter your password');
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Execute pending action after successful reauth
      if (pendingAction) {
        await pendingAction();
      }
      
      setShowReauthModal(false);
      setPendingAction(null);
      setCurrentPassword('');
      
    } catch (error) {
      console.error('Reauth error:', error);
      setModalError('Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    // Validate display name
    if (!displayName || displayName.trim() === '') {
      showToast('error', 'Display name cannot be empty');
      return;
    }

    if (displayName.trim().length < 3) {
      showToast('error', 'Display name must be at least 3 characters long');
      return;
    }

    if (displayName.trim() === currentUser.name) {
      showToast('error', 'New display name must be different from current name');
      return;
    }

    try {
      setIsLoading(true);
      const result = await updateUserProfile(currentUser.id, {
        name: displayName.trim()
      });
      
      if (result.success) {
        showToast('success', 'Profile updated successfully');
      } else {
        showToast('error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      showToast('error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async () => {
    if (!email) {
      showToast('error', 'Please enter an email address');
      return;
    }

    if (email === currentUser.email) {
      showToast('error', 'New email must be different from current email');
      return;
    }

    try {
      setIsLoading(true);
      setPendingAction(() => async () => {
        try {
          // First update the email
          await updateEmail(auth.currentUser, email);
          showToast('success', 'Email updated successfully. Please verify your new email address.');
          
          // Then send verification to the new email
          try {
            await sendEmailVerification(auth.currentUser);
          } catch (verificationError) {
            console.error('Verification email error:', verificationError);
            showToast('warning', 'Email updated but failed to send verification email. Please try logging out and back in to resend verification.');
          }
        } catch (error) {
          console.error('Email update error:', error);
          if (error.code === 'auth/email-already-in-use') {
            showToast('error', 'This email is already in use by another account');
          } else if (error.code === 'auth/invalid-email') {
            showToast('error', 'Please enter a valid email address');
          } else if (error.code === 'auth/requires-recent-login') {
            showToast('error', 'For security reasons, please re-enter your password');
          } else {
            showToast('error', 'Failed to update email. Please try again.');
          }
        }
      });
      setShowReauthModal(true);
    } catch (error) {
      console.error('Email update error:', error);
      showToast('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePasswordReset = async () => {
    try {
      setIsLoading(true);
      const result = await sendPasswordResetEmail(currentUser.email);
      if (result.success) {
        showToast('success', 'Password reset email sent. Please check your inbox for instructions.');
      } else {
        showToast('error', result.error);
      }
    } catch (error) {
      showToast('error', 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      setPendingAction(() => async () => {
        try {
          await auth.currentUser.delete();
          router.push('/');
        } catch (error) {
          showToast('error', 'Failed to delete account');
        }
      });
      setShowReauthModal(true);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your profile, email preferences, and account security.
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {currentUser?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your display name and profile details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value === '') {
                      showToast('error', 'Display name cannot be empty');
                    } else if (value.length < 3) {
                      showToast('error', 'Display name must be at least 3 characters long');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter your display name (minimum 3 characters)"
                  minLength={3}
                  required
                />
              </div>

              <button
                onClick={updateProfile}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your email address and preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Email update functionality is currently under maintenance. Your current email address will remain unchanged.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Email Address
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder="Your email address"
                />
              </div>

              <button
                disabled
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3 px-6 rounded-xl font-medium cursor-not-allowed"
              >
                Email Updates Temporarily Unavailable
              </button>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reset your password via email</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">
                Click below to receive a password reset email with instructions to create a new password.
              </p>

              <button
                onClick={initiatePasswordReset}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Sending...' : 'Send Password Reset Email'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Account</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Account deletion is temporarily unavailable while we ensure all your data is properly handled. Please check back later.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3 px-6 rounded-xl font-medium cursor-not-allowed"
              >
                Account Deletion Temporarily Unavailable
              </button>
            </div>
          </div>
        </div>

        {/* Re-authentication Modal */}
        {showReauthModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full animate-slide-up shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Your Password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Please enter your current password to continue</p>
                </div>
              </div>

              {modalError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {modalError}
                  </p>
                </div>
              )}

              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setModalError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleReauthentication();
                  }
                }}
                placeholder="Enter your current password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 mb-6"
              />

              <div className="flex space-x-3">
                <button
                  onClick={handleReauthentication}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? 'Confirming...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowReauthModal(false);
                    setPendingAction(null);
                    setCurrentPassword('');
                    setModalError('');
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
} 