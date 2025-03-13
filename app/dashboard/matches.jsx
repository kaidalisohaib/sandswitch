"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirebase } from '../utils/firebaseContext';
import { formatDistanceToNow } from 'date-fns';
import { normalizeTimestamp } from '../utils/dateUtils';

const MatchCard = ({ match, currentUserId }) => {
  const { getServiceById, getUserById, cancelMatch } = useFirebase();
  const [service, setService] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const isRequester = currentUserId === match.requesterId;
  const otherUserId = isRequester ? match.providerId : match.requesterId;

  useEffect(() => {
    const loadData = async () => {
      const [serviceData, userData] = await Promise.all([
        getServiceById(match.serviceId),
        getUserById(otherUserId)
      ]);
      setService(serviceData);
      setOtherUser(userData);
    };
    loadData();
  }, [match.serviceId, otherUserId, getServiceById, getUserById]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'wanted':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800/50';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50';
      case 'completed':
        return 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-600/50';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'wanted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleColor = (isRequester) => {
    return isRequester
      ? 'bg-[#fce7f3] text-[#db2777] dark:bg-[#db2777]/20 dark:text-[#f472b6]'
      : 'bg-[#e6f1ff] text-[#1a78ff] dark:bg-[#1a78ff]/20 dark:text-[#6ba9ff]';
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await cancelMatch(match.id, currentUserId);
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'wanted':
        return 'Awaiting Start';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (timestamp) => {
    try {
      const normalizedDate = normalizeTimestamp(timestamp);
      if (!normalizedDate) return 'Recently';
      return formatDistanceToNow(normalizedDate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <Link href={`/matches/${match.id}`}>
      <div
        className={`relative rounded-lg border ${getStatusColor(match.status)} p-3 hover:shadow-md transition-shadow duration-200 cursor-pointer group`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-start justify-between space-x-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {service?.title || 'Loading...'}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(match.status)}`}>
                {formatStatus(match.status)}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                <span className={`truncate ${getRoleColor(isRequester)}`}>
                  {isRequester ? 'Requested by you' : 'You are providing'}
                </span>
                <span>•</span>
                <span>{formatDate(match.createdAt)}</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="text-gray-600 dark:text-gray-300">with </span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {otherUser?.name || 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          {isHovering && match.status !== 'completed' && match.status !== 'cancelled' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCancel(e);
              }}
              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

const MatchesTab = () => {
  const { currentUser, getUserMatches } = useFirebase();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = currentUser?.id;
  // Add state for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    pending: false,
    inProgress: false,
    completed: false,
    cancelled: false
  });

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const loadMatches = async () => {
      if (currentUserId) {
        setLoading(true);
        try {
          const matchesData = await getUserMatches(currentUserId);
          setMatches(matchesData || []);
        } catch (error) {
          console.error('Error loading matches:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadMatches();
  }, [currentUserId, getUserMatches]);

  // Group matches by status
  const pendingMatches = matches.filter(m => m.status === 'wanted');
  const inProgressMatches = matches.filter(m => m.status === 'in-progress');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const cancelledMatches = matches.filter(m => m.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Matches</h2>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100vh-12rem)]">
        {/* Active Matches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
          {/* Pending Matches */}
          <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div 
              className="mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={() => toggleSection('pending')}
            >
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pending</h3>
                <span className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 text-xs px-2 py-0.5 rounded-full">
                  {pendingMatches.length}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsedSections.pending ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!collapsedSections.pending && (
              <div className={`space-y-3 ${pendingMatches.length > 3 ? 'max-h-[30vh] overflow-y-auto pr-2' : ''}`}>
                {pendingMatches.map((match, index) => (
                  <div key={match.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <MatchCard match={match} currentUserId={currentUserId} />
                  </div>
                ))}
                {pendingMatches.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">No pending matches</p>
                )}
              </div>
            )}
          </div>

          {/* In Progress Matches */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div 
              className="mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={() => toggleSection('inProgress')}
            >
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">In Progress</h3>
                <span className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                  {inProgressMatches.length}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsedSections.inProgress ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!collapsedSections.inProgress && (
              <div className={`space-y-3 ${inProgressMatches.length > 3 ? 'max-h-[30vh] overflow-y-auto pr-2' : ''}`}>
                {inProgressMatches.map((match, index) => (
                  <div key={match.id} className="animate-slide-up" style={{ animationDelay: `${100 + index * 50}ms` }}>
                    <MatchCard match={match} currentUserId={currentUserId} />
                  </div>
                ))}
                {inProgressMatches.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">No matches in progress</p>
                )}
              </div>
            )}
          </div>

          {/* Completed Matches */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div 
              className="mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={() => toggleSection('completed')}
            >
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Completed</h3>
                <span className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 text-xs px-2 py-0.5 rounded-full">
                  {completedMatches.length}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsedSections.completed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!collapsedSections.completed && (
              <div className={`space-y-3 ${completedMatches.length > 3 ? 'max-h-[30vh] overflow-y-auto pr-2' : ''}`}>
                {completedMatches.map((match, index) => (
                  <div key={match.id} className="animate-slide-up" style={{ animationDelay: `${200 + index * 50}ms` }}>
                    <MatchCard match={match} currentUserId={currentUserId} />
                  </div>
                ))}
                {completedMatches.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">No completed matches</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cancelled Matches Section */}
        {cancelledMatches.length > 0 && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div 
              className="mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={() => toggleSection('cancelled')}
            >
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cancelled Matches</h3>
                <span className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                  {cancelledMatches.length}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsedSections.cancelled ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!collapsedSections.cancelled && (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${cancelledMatches.length > 6 ? 'max-h-[30vh] overflow-y-auto pr-2' : ''}`}>
                {cancelledMatches.map((match, index) => (
                  <div key={match.id} className="animate-slide-up" style={{ animationDelay: `${300 + index * 50}ms` }}>
                    <MatchCard match={match} currentUserId={currentUserId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesTab; 