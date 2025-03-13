"use client";

import Link from "next/link";
import Image from "next/image";
import { useFirebase } from "../utils/firebaseContext";
import { useState, useEffect } from "react";
import { Toast, ToastContainer } from "./Toast";
import { formatTimeAgo } from "../utils/dateUtils";

export default function ServiceCard({ service, currentUserId, onTagClick, onDelete }) {
  const { getUserById, deleteService, getUserMatches } = useFirebase();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const [serviceMatches, setServiceMatches] = useState([]);
  const [toast, setToast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      if (service.userId) {
        const userData = await getUserById(service.userId);
        setUser(userData);
      }
    }
    fetchUser();
  }, [service.userId, getUserById]);
  
  // Fetch matches data
  useEffect(() => {
    async function fetchMatches() {
      if (currentUserId && service.id) {
        const allMatches = await getUserMatches(currentUserId);
        const filtered = allMatches.filter(m => m.serviceId === service.id);
        setServiceMatches(filtered);
      }
    }
    fetchMatches();
  }, [currentUserId, service.id, getUserMatches]);

  const isOffering = service.type === "offering";
  const isOwnService = service.userId === currentUserId;
  const timeAgo = formatTimeAgo(service.created);

  // Get match summary info
  const matchSummary = {
    total: serviceMatches.length,
    offering: serviceMatches.filter(m => m.providerId === currentUserId).length,
    requesting: serviceMatches.filter(m => m.requesterId === currentUserId).length,
    active: serviceMatches.filter(m => m.status === 'in-progress').length,
    pending: serviceMatches.filter(m => m.status === 'wanted').length,
    completed: serviceMatches.filter(m => m.status === 'completed').length
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'wanted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Handle tag click
  const handleTagClick = (e, tag) => {
    e.preventDefault();
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  // Handle service deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteService(service.id);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete service');
      setToast({
        type: 'error',
        message: result.error || 'Failed to delete service'
      });
      setTimeout(() => setDeleteError(''), 3000);
    } else {
      setToast({
        type: 'success',
        message: 'Service deleted successfully'
      });
      // Notify parent component about the deletion after a short delay
      setTimeout(() => {
        onDelete?.(service.id);
      }, 1000);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className={`group relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl transition-all duration-300 overflow-hidden ${
          isHovered ? 'scale-[1.02]' : 'scale-100'
        } ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
        style={{
          boxShadow: isHovered 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top gradient bar */}
        <div 
          className={`h-2 w-full ${
            isOffering 
              ? 'bg-gradient-to-r from-[#1a78ff] via-[#4291ff] to-[#6ba9ff]'
              : 'bg-gradient-to-r from-[#db2777] via-[#ec4899] to-[#f472b6]'
          }`}
        />
        
        <div className="p-5 sm:p-6">
          {/* Service header */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex items-center space-x-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                isOffering
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                  : 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200'
              }`}>
                {isOffering ? 'Offering' : 'Request'}
              </span>
              
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
            </div>
            
            {service.status !== 'active' && (
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(service.status)}`}>
                {service.status === 'completed' ? 'Completed' : service.status === 'in-progress' ? 'In Progress' : service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </span>
            )}
          </div>
          
          {/* Title and description */}
          <Link href={`/services/${service.id}`}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-primary transition-colors duration-200">
              {service.title}
            </h3>
          </Link>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {service.description}
          </p>
          
          {/* User info */}
          <div className="mt-4 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold text-xs">
                {user?.name?.charAt(0) || '?'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isOwnService ? 'You created this' : matchSummary.total > 0 ? `${matchSummary.active} active matches` : 'No active matches'}
              </p>
            </div>
          </div>
          
          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => handleTagClick(e, tag)}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition duration-150"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            {matchSummary.active > 0 || matchSummary.pending > 0 ? (
              /* For users with active or pending matches */
              <>
                <Link
                  href={`/matches/${serviceMatches.find(m => ['wanted', 'in-progress'].includes(m.status)).id}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  View Active Match
                </Link>
                {/* Show completed/cancelled counts if they exist */}
                {(matchSummary.completed > 0 || serviceMatches.some(m => m.status === 'cancelled')) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {matchSummary.completed > 0 && (
                      <span>{matchSummary.completed} completed</span>
                    )}
                    {matchSummary.completed > 0 && serviceMatches.some(m => m.status === 'cancelled') && ", "}
                    {serviceMatches.some(m => m.status === 'cancelled') && (
                      <span>{serviceMatches.filter(m => m.status === 'cancelled').length} cancelled</span>
                    )}
                  </div>
                )}
              </>
            ) : currentUserId && !isOwnService ? (
              /* For authenticated users without active matches */
              <>
                {matchSummary.completed > 0 || serviceMatches.some(m => m.status === 'cancelled') ? (
                  <div className="mr-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {matchSummary.completed > 0 && (
                      <span>{matchSummary.completed} completed</span>
                    )}
                    {matchSummary.completed > 0 && serviceMatches.some(m => m.status === 'cancelled') && ", "}
                    {serviceMatches.some(m => m.status === 'cancelled') && (
                      <span>{serviceMatches.filter(m => m.status === 'cancelled').length} cancelled</span>
                    )}
                  </div>
                ) : null}
                <Link
                  href={`/services/${service.id}`}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors duration-200 ${
                    isOffering
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-pink-600 hover:bg-pink-700'
                  }`}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isOffering ? "Request This Service" : "Offer Help"}
                </Link>
              </>
            ) : !currentUserId && (
              /* For unauthenticated users, show login button */
              <Link
                href={`/login?redirect=/services/${service.id}`}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login to {isOffering ? "Request" : "Help"}
              </Link>
            )}
            
            {isOwnService && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 max-w-md w-full animate-slide-up shadow-xl m-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
