"use client";

import { useEffect } from 'react';

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastClasses = () => {
    const baseClasses = "fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out z-50 flex items-center min-w-[300px] backdrop-blur-sm";
    switch (type) {
      case 'success':
        return `${baseClasses} bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white border border-green-400/20`;
      case 'error':
        return `${baseClasses} bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white border border-red-400/20`;
      case 'warning':
        return `${baseClasses} bg-gradient-to-r from-yellow-500/90 to-amber-600/90 text-white border border-yellow-400/20`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-700/90 to-gray-800/90 text-white border border-gray-600/20`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={getToastClasses()}>
      {getIcon()}
      <p className="font-medium flex-grow">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors duration-200 focus:outline-none"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up-fade"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}; 