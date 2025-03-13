'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '../../utils/firebaseContext';
import { verifyEmail, confirmPasswordReset } from '../../utils/firebaseService';
import { Spinner } from '../../components/Spinner';
import Link from 'next/link';

export default function ActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, firebaseLoading } = useFirebase();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const actionMode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');
    setMode(actionMode);

    if (!actionCode) {
      setStatus('error');
      setMessage('Invalid action code. The link may be malformed or has already been used.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (actionMode) {
          case 'verifyEmail':
            const verifyResult = await verifyEmail(actionCode);
            if (verifyResult.success) {
              setStatus('success');
              setMessage('Your email has been verified! You can now use all features of the application.');
              
              // Use BroadcastChannel for cross-tab communication
              const bc = new BroadcastChannel('email_verification');
              bc.postMessage({ type: 'EMAIL_VERIFIED', verified: true });
              bc.close();
              
              // Also set localStorage as fallback
              localStorage.setItem('emailVerified', 'true');
              
              // Redirect after a short delay
              setTimeout(() => router.push('/dashboard'), 3000);
            } else {
              setStatus('error');
              setMessage(verifyResult.error || 'Failed to verify email. Please try again.');
            }
            break;

          case 'resetPassword':
            // We'll show the password reset form
            setStatus('form');
            setMessage('Please enter your new password');
            break;

          case 'recoverEmail':
            // Show email recovery information
            setStatus('info');
            const email = searchParams.get('newEmail');
            setNewEmail(email);
            setMessage(`Your email is being changed to ${email}. Please confirm this change.`);
            break;

          default:
            setStatus('error');
            setMessage('Invalid action. Please check your link and try again.');
        }
      } catch (error) {
        console.error('Action handling error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your request. Please try again.');
      }
    };

    handleAction();
  }, [searchParams, router]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setStatus('loading');
    try {
      const actionCode = searchParams.get('oobCode');
      if (!actionCode) {
        throw new Error('Invalid password reset code');
      }

      const result = await confirmPasswordReset(actionCode, password);
      
      if (result.success) {
        setStatus('success');
        setMessage('Your password has been reset successfully! You can now login with your new password.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus('error');
      setMessage('An error occurred while resetting your password. Please try again.');
    }
  };

  const handleEmailChange = async () => {
    try {
      const actionCode = searchParams.get('oobCode');
      const result = await confirmEmailChange(actionCode);
      
      if (result.success) {
        setStatus('success');
        setMessage('Your email has been changed successfully!');
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to change email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while changing your email. Please try again.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12">
              <Spinner />
            </div>
            <p className="text-gray-600 dark:text-gray-300">Processing your request...</p>
          </div>
        );

      case 'form':
        return (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            {message && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        );

      case 'info':
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <button
              onClick={handleEmailChange}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Confirm Email Change
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-600 dark:text-green-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you shortly...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400">{message}</p>
            <Link
              href="/login"
              className="inline-block text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Return to login
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {mode === 'verifyEmail' && 'Email Verification'}
          {mode === 'resetPassword' && 'Reset Password'}
          {mode === 'recoverEmail' && 'Email Change'}
          {!mode && 'Account Action'}
        </h2>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 