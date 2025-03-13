"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '../utils/dateUtils';
import { useFirebase } from '../utils/firebaseContext';

export default function ChatListItem({ match, isActive, onClick, currentUserId }) {
  const { getServiceById, getUserById } = useFirebase();
  const [service, setService] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get service and user info
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const isRequester = currentUserId === match.requesterId;
        const otherUserId = isRequester ? match.providerId : match.requesterId;
        
        const [serviceData, userData] = await Promise.all([
          getServiceById(match.serviceId),
          getUserById(otherUserId)
        ]);
        setService(serviceData);
        setOtherUser(userData);
      } catch (error) {
        console.error('Error loading chat item data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [match.serviceId, match.providerId, match.requesterId, getServiceById, getUserById, currentUserId, match.requesterId]);

  const isRequester = currentUserId === match.requesterId;
  
  // Get last message
  const lastMessage = match.messages?.length > 0 
    ? match.messages[match.messages.length - 1] 
    : null;

  // Ensure lastMessage has a valid timestamp
  const lastMessageTime = lastMessage?.timestamp 
    ? (typeof lastMessage.timestamp.seconds === 'number' 
       ? new Date(lastMessage.timestamp.seconds * 1000) 
       : new Date(lastMessage.timestamp))
    : match.createdAt 
      ? (typeof match.createdAt.seconds === 'number'
         ? new Date(match.createdAt.seconds * 1000)
         : new Date(match.createdAt))
      : new Date();

  // Get unread count
  const unreadCount = match.messages?.filter(
    msg => msg.senderId !== currentUserId && !msg.read
  ).length || 0;

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'wanted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    switch (status) {
      case 'wanted':
        return 'Pending';
      case 'in-progress':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getRoleColor = (isRequester) => {
    return isRequester
      ? 'bg-[#fce7f3] text-[#db2777] dark:bg-[#db2777]/20 dark:text-[#f472b6]'
      : 'bg-[#e6f1ff] text-[#1a78ff] dark:bg-[#1a78ff]/20 dark:text-[#6ba9ff]';
  };

  if (loading) {
    return (
      <div className="w-full text-left p-3 rounded-lg animate-pulse">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-2 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left p-3 rounded-lg transition-all duration-200 ${
        isActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      } ${match.status === 'cancelled' || match.status === 'completed' ? 'opacity-75' : ''}`}
    >
      {match.status === 'cancelled' && (
        <div className="absolute inset-0 border border-red-200 dark:border-red-800/30 rounded-lg pointer-events-none"></div>
      )}
      <div className="flex items-start space-x-2">
        {/* User initial/avatar */}
        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {otherUser?.name?.charAt(0) || "?"}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{otherUser?.name || 'Unknown User'}</p>
            <div className="flex flex-col items-end ml-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lastMessageTime ? formatTimeAgo(lastMessageTime) : ''}
              </span>
            </div>
          </div>
          
          <div className="mt-1 flex items-center">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getStatusColor(match.status)}`}>
              {formatStatus(match.status)}
            </span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              {service?.title || 'Unknown Service'}
            </span>
          </div>

          {lastMessage && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 max-w-full">
              {lastMessage.senderId === currentUserId ? 'You: ' : ''}{lastMessage.content}
            </p>
          )}
        </div>
      </div>
      
      {/* Unread indicator */}
      {unreadCount > 0 && match.status !== 'cancelled' && match.status !== 'completed' && (
        <div className="absolute top-1 right-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
            {unreadCount}
          </span>
        </div>
      )}
    </button>
  );
} 