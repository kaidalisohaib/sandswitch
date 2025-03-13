"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import ChatMessage from './ChatMessage';
import { useFirebase } from '../utils/firebaseContext';
import { isToday, isYesterday } from 'date-fns';
import { formatDate } from '../utils/dateUtils';
import Link from 'next/link';

const Chat = ({ 
  matchId, 
  messages: passedMessages,
  currentUserId, 
  otherUser, 
  onSendMessage,
  messageText,
  setMessageText,
  disabled = false 
}) => {
  const [localMessages, setLocalMessages] = useState(Array.isArray(passedMessages) ? passedMessages : []);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [matchData, setMatchData] = useState({ match: null, service: null });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(() => {
    try {
      const stored = localStorage.getItem(`chat_${matchId}_lastMessageTime`);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  });
  const [messageCount, setMessageCount] = useState(() => {
    try {
      const stored = localStorage.getItem(`chat_${matchId}_messageCount`);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return 0;
    }
  });
  const [timeUntilReset, setTimeUntilReset] = useState(0);
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  
  const { 
    sendMessage, 
    markMessagesAsRead,
    getMatchById,
    getServiceById,
    getUserById,
    subscribeToMatch,
    currentUser
  } = useFirebase();

  // Constants for rate limiting
  const MAX_MESSAGE_LENGTH = 1000; // 1000 characters
  const MAX_MESSAGES_PER_MINUTE = 10;
  const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

  // Use a unique ID for each chat instance to help React distinguish them
  const chatInstanceId = useMemo(() => `chat-${matchId || Date.now()}`, [matchId]);
  
  // Mark messages as read when viewing them
  useEffect(() => {
    if (!matchId || !currentUserId || !localMessages?.length || !matchData.match) return;
    
    // Don't try to mark messages as read for cancelled or completed matches
    if (matchData.match.status === 'cancelled' || matchData.match.status === 'completed') return;
    
    // Check if there are any unread messages from the other user
    const hasUnreadMessages = localMessages.some(
      msg => msg.senderId !== currentUserId && !msg.read
    );
    
    if (hasUnreadMessages) {
      markMessagesAsRead(matchId, currentUserId).catch(error => {
        console.error('Error marking messages as read:', error);
      });
    }
  }, [matchId, currentUserId, localMessages, markMessagesAsRead, matchData.match]);

  // Use layout effect to scroll to bottom initially and after messages update
  useLayoutEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [localMessages, isScrolledToBottom]);
  
  // Prevent unnecessary full reloads for minor updates
  useEffect(() => {
    // Clean up function
    return () => {
      console.log('Chat component unmounting:', chatInstanceId);
    };
  }, [chatInstanceId]);

  // Scroll to bottom handler with improved performance
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
      });
    }
  }, []);

  // Update local messages when passed messages change - make this more efficient
  useEffect(() => {
    if (passedMessages && Array.isArray(passedMessages)) {
      // Always update local messages when matchId changes
      if (matchId !== chatInstanceId.split('-')[1]) {
        setLocalMessages(passedMessages);
        scrollToBottom();
        return;
      }
      
      setLocalMessages(prevMessages => {
        const newMessages = [...passedMessages];
        scrollToBottom();
        return newMessages;
      });
    }
  }, [passedMessages, matchId, chatInstanceId, scrollToBottom]);

  // Subscribe to match updates - use a ref to avoid dependency issues
  const matchDataRef = useRef({ match: null, service: null });
  const unsubscribeRef = useRef(null);
  
  useEffect(() => {
    if (matchId) {
      // Cleanup previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Setup new subscription
      unsubscribeRef.current = subscribeToMatch(matchId, (updatedMatch) => {
        if (updatedMatch?.messages) {
          setLocalMessages(updatedMatch.messages);
        }
      });

      // Cleanup on unmount or matchId change
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [matchId, subscribeToMatch]);

  // Load match and service data only once initially
  useEffect(() => {
    const loadMatchData = async () => {
      if (!matchId) {
        console.warn('Chat: Match ID is undefined');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to get the match from Firebase
        const match = await getMatchById(matchId);
        if (!match) {
          console.warn(`Chat: Match not found for id: ${matchId}`);
          setMatchData({ match: null, service: null });
          return;
        }
        
        const service = match.serviceId ? await getServiceById(match.serviceId) : null;
        
        // Store in ref and state
        matchDataRef.current = { match, service };
        setMatchData({ match, service });
      } catch (error) {
        console.error('Chat: Error loading match data:', error);
        setError(error.message);
        setMatchData({ match: null, service: null });
      } finally {
        setLoading(false);
      }
    };
    
    loadMatchData();
  }, [matchId, getMatchById, getServiceById]);

  // Handle scroll events with improved detection
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 100; // More generous threshold
      setIsScrolledToBottom(isAtBottom);
      setShowScrollButton(!isAtBottom);
    }
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Improved scroll to bottom on new messages
  useEffect(() => {
    if (localMessages?.length) {
      const container = chatContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // Auto-scroll if we're already near the bottom or if it's a new message from the current user
        const lastMessage = localMessages[localMessages.length - 1];
        const isOwnMessage = lastMessage?.senderId === currentUserId;
        
        if (distanceFromBottom < 300 || isOwnMessage) {
          scrollToBottom('smooth');
        }
      }
    }
  }, [localMessages, currentUserId, scrollToBottom]);

  // Handle sending a message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // Check message length
    if (messageText.length > MAX_MESSAGE_LENGTH) {
      setShowLengthWarning(true);
      setTimeout(() => setShowLengthWarning(false), 3000);
      return;
    }

    // Check rate limit
    const now = Date.now();
    if (messageCount >= MAX_MESSAGES_PER_MINUTE && 
        (now - lastMessageTimestamp) < RATE_LIMIT_WINDOW) {
      return;
    }

    try {
      // Prevent double-submits
      if (sending) return;
      setSending(true);
      
      // Get the trimmed content before clearing the input
      const content = messageText.trim();
      
      // Clear input field immediately for better UX
      setMessageText('');
      
      // Generate a unique ID for optimistic updates
      const messageId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
      // Optimistically add message to UI to prevent flickering
      const optimisticMessage = {
        id: messageId,
        senderId: currentUserId,
        content: content,
        timestamp: new Date(),
        read: false
      };
      
      // Add to local state first for immediate feedback
      setLocalMessages(prevMessages => {
        // Make sure we have a valid array
        const validMessages = Array.isArray(prevMessages) ? prevMessages : [];
        return [...validMessages, optimisticMessage];
      });
      
      // Ensure we'll see our own message
      setIsScrolledToBottom(true);
      scrollToBottom('smooth');
      
      // Send to server
      if (typeof onSendMessage === 'function') {
        await onSendMessage(content);
      } else {
        await sendMessage(matchId, currentUserId, content);
      }

      // Update rate limiting state
      setMessageCount(prev => prev + 1);
      setLastMessageTimestamp(Date.now());
      
      // Ensure we scroll again after the message is sent
      setTimeout(() => scrollToBottom('smooth'), 100);
      
      // Let real-time updates handle the rest
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove optimistic message on error
      setLocalMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
      
      setError(`Failed to send: ${error.message}`);
      
      // Put the message back in the input field so user doesn't lose it
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  // Handle key press events
  const handleKeyDown = (e) => {
    // Submit form on Enter without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Message grouping and formatting
  const formatMessageDate = (timestamp) => {
    let date;
    
    // Handle different timestamp formats
    if (!timestamp) {
      date = new Date(); // Fallback to current date
    } else if (typeof timestamp === 'string') {
      // ISO string format
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      // Firestore Timestamp format
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      // Firestore Timestamp object with toDate method
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      // Try to convert from timestamp number
      date = new Date(timestamp);
    }
    
    // Check if valid date before using date-fns functions
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Unknown date';
    }
    
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return formatDate(date, 'MMMM d, yyyy');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      console.warn('Empty timestamp received');
      return '';
    }
    
    let date;
    try {
      // Handle different timestamp formats
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp format:', timestamp);
        return '';
      }
      
      return formatDate(date, 'p');
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return '';
    }
  };

  // Message grouping function (memoized)
  const getMessageGroups = useCallback(() => {
    const groups = [];
    let currentGroup = null;

    if (!localMessages || !Array.isArray(localMessages) || localMessages.length === 0) {
      return groups;
    }

    localMessages.forEach((message, index) => {
      if (!message || !message.timestamp) {
        console.warn('Message missing timestamp:', message);
        return; // Skip this message
      }
      
      const messageDate = formatMessageDate(message.timestamp);
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { date: messageDate, messages: [] };
      }
      
      currentGroup.messages.push(message);
      
      if (index === localMessages.length - 1) {
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [localMessages, formatMessageDate]);

  // Message classes
  const getMessageClasses = useCallback((message) => {
    const isSender = message.senderId === currentUserId;
    return {
      container: `flex w-full ${isSender ? 'justify-end' : 'justify-start'} mb-4`,
      wrapper: `${isSender ? 'items-end' : 'items-start'} flex flex-col max-w-[80%]`,
      bubble: `px-4 py-3 rounded-lg break-words whitespace-pre-wrap overflow-hidden max-w-full overflow-wrap-break-word ${
        isSender
          ? 'bg-indigo-600 text-white rounded-tr-none'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
      }`,
      time: `text-xs ${
        isSender ? 'text-gray-400 text-right' : 'text-gray-500'
      } mt-1`
    };
  }, [currentUserId]);

  // Get message class based on sender
  const getMessageClass = useCallback((senderId) => {
    const isCurrentUser = senderId === currentUserId;
    return isCurrentUser
      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
  }, [currentUserId]);

  // Get status badge color
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case "wanted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  }, []);
  
  // Add a check for authentication status
  const isAuthenticated = useCallback(() => {
    return !!currentUser;
  }, [currentUser]);

  // Handle authentication state for the subscription
  useEffect(() => {
    // If user is not authenticated but we're trying to show a real chat, display a message
    if (!isAuthenticated() && matchId) {
      setError("You need to be logged in to view this conversation");
    }
  }, [isAuthenticated, matchId]);
  
  // Render message groups with improved styling
  const renderMessageGroups = useMemo(() => {
    const messageGroups = getMessageGroups();
    
    if (messageGroups.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          {!isAuthenticated() ? (
            <p className="text-gray-500 dark:text-gray-400">
              You need to be logged in to view messages. <a href="/login" className="text-indigo-600 hover:underline">Log in</a>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          )}
        </div>
      );
    }
    
    return messageGroups.map((group, groupIndex) => (
      <div key={`group-${group.date}-${groupIndex}`} className="space-y-4 mb-6">
        <div className="flex justify-center">
          <span className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
            {group.date}
          </span>
        </div>
        {group.messages.map((message, messageIndex) => {
          // Use a stable key that won't change on re-renders
          const messageKey = message.id || 
            `msg-${message.senderId}-${message.timestamp instanceof Date ? 
              message.timestamp.getTime() : 
              messageIndex}-${messageIndex}`;
          
          return (
            <div key={messageKey} className={getMessageClasses(message).container}>
              <div className={getMessageClasses(message).wrapper}>
                <div className={getMessageClasses(message).bubble}>
                  {message.content}
                </div>
                <div className={getMessageClasses(message).time}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  }, [getMessageGroups, getMessageClasses]);

  // Update localStorage when rate limit values change
  useEffect(() => {
    try {
      if (lastMessageTimestamp) {
        localStorage.setItem(`chat_${matchId}_lastMessageTime`, lastMessageTimestamp.toString());
      }
      localStorage.setItem(`chat_${matchId}_messageCount`, messageCount.toString());
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [lastMessageTimestamp, messageCount, matchId]);

  // Timer for rate limit countdown
  useEffect(() => {
    if (!lastMessageTimestamp || messageCount < MAX_MESSAGES_PER_MINUTE) {
      setTimeUntilReset(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const resetTime = lastMessageTimestamp + RATE_LIMIT_WINDOW;
      const remaining = Math.max(0, resetTime - now);
      
      if (remaining === 0) {
        // Reset rate limiting when time is up
        setMessageCount(0);
        setLastMessageTimestamp(null);
        try {
          localStorage.removeItem(`chat_${matchId}_lastMessageTime`);
          localStorage.removeItem(`chat_${matchId}_messageCount`);
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }
      }
      
      setTimeUntilReset(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastMessageTimestamp, messageCount, matchId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center p-4">
          <p className="text-red-500 dark:text-red-400 mb-3">{error}</p>
          {error.includes("logged in") && (
            <a 
              href="/login" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Log in again
            </a>
          )}
        </div>
      </div>
    );
  }

  // Get the current match data for rendering, preferring state but falling back to ref if needed
  const currentMatchData = matchData.match ? matchData : matchDataRef.current;
  
  if (!currentMatchData.match || !currentMatchData.service) {
    if (!currentUser) {
      return (
        <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">You need to be logged in to view this conversation.</p>
            <a 
              href="/login" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Log in
            </a>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Conversation not found or no longer available.</p>
        </div>
      </div>
    );
  }

  // Check if current user is part of the match
  const isUserInMatch = currentUserId === currentMatchData.match.requesterId || 
                     currentUserId === currentMatchData.match.providerId;
  if (!isUserInMatch) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">You don't have permission to view this conversation.</p>
        </div>
      </div>
    ); 
  }

  // Check if we have issues with match data
  if (!matchId) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Invalid match data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Header with match info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-4 min-h-[72px]">
        <div className="flex items-center flex-grow flex-wrap gap-2">
          {otherUser ? (
            <Link href={`/profile/${otherUser.id}`} className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
                  {otherUser.name?.charAt(0) || "?"}
                </div>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {otherUser.name || "Unknown User"}
                </h2>
              </div>
            </Link>
          ) : (
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-3"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-1 sm:mt-0 sm:ml-auto">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentMatchData.match.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                : currentMatchData.match.status === 'in-progress'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                : currentMatchData.match.status === 'wanted'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
            }`}>
              {currentMatchData.match.status === 'wanted'
                ? 'Pending'
                : currentMatchData.match.status === 'in-progress'
                ? 'Active'
                : currentMatchData.match.status === 'completed'
                ? 'Completed'
                : 'Cancelled'}
            </span>

            {currentMatchData.service && (
              <Link 
                href={`/services/${currentMatchData.service.id}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
              >
                View Service
              </Link>
            )}

            {currentMatchData.match.status !== 'cancelled' && currentMatchData.match.status !== 'completed' && (
              <Link 
                href={`/matches/${matchId}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:hover:bg-indigo-800/30 transition-colors duration-150"
              >
                Match Details
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Message Area with added scroll anchor */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-xs">
              Send a message to start the conversation with {otherUser?.name || 'this user'}.
            </p>
          </div>
        ) : (
          localMessages.map((message) => (
            <ChatMessage
              key={message.id || message.timestamp}
              message={message}
              isOwn={message.senderId === currentUserId}
              senderName={
                message.senderId === currentUserId
                  ? currentUser?.name
                  : otherUser?.name
              }
            />
          ))
        )}
        {showScrollButton && (
          <div 
            className="sticky bottom-0 flex justify-center" 
            style={{pointerEvents: 'none'}}
          >
            <button
              onClick={() => {
                setIsScrolledToBottom(true);
                scrollToBottom();
              }}
              className="animate-bounce bg-indigo-600 text-white rounded-full p-2 shadow-lg"
              style={{pointerEvents: 'auto'}}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
        {/* Add an invisible scroll anchor */}
        <div ref={messagesEndRef} className="h-0 w-0" aria-hidden="true" />
      </div>

      {/* Message Input Area */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Warning Messages */}
        <div className="space-y-2 mb-3">
          {/* Rate Limit Warning */}
          {messageCount >= MAX_MESSAGES_PER_MINUTE && 
           (Date.now() - lastMessageTimestamp) < RATE_LIMIT_WINDOW && (
            <div className="flex items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
              <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Message limit reached. You can send again in {Math.ceil(timeUntilReset / 1000)}s
              </span>
            </div>
          )}

          {/* Message Length Warning */}
          {showLengthWarning && (
            <div className="flex items-center p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/30">
              <svg className="w-5 h-5 text-rose-500 dark:text-rose-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-rose-800 dark:text-rose-200">
                Message is too long. Maximum {MAX_MESSAGE_LENGTH} characters allowed.
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={false}
                placeholder={
                  messageCount >= MAX_MESSAGES_PER_MINUTE && 
                  (Date.now() - lastMessageTimestamp) < RATE_LIMIT_WINDOW
                    ? `You can send again in ${Math.ceil(timeUntilReset / 1000)} seconds...`
                    : "Type your message..."
                }
                disabled={disabled || (messageCount >= MAX_MESSAGES_PER_MINUTE && 
                        (Date.now() - lastMessageTimestamp) < RATE_LIMIT_WINDOW)}
                className={`w-full p-3 rounded-lg border ${
                  messageText.length > MAX_MESSAGE_LENGTH
                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 dark:focus:ring-rose-400'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400'
                } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                rows="1"
              />
              
              {/* Character Counter */}
              <div className={`absolute bottom-2 right-2 text-xs ${
                messageText.length > MAX_MESSAGE_LENGTH
                  ? 'text-rose-600 dark:text-rose-400'
                  : messageText.length > MAX_MESSAGE_LENGTH * 0.9
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {MAX_MESSAGE_LENGTH - messageText.length} characters remaining
              </div>
            </div>

            <button
              type="submit"
              disabled={
                disabled || 
                !messageText.trim() || 
                messageText.length > MAX_MESSAGE_LENGTH ||
                (messageCount >= MAX_MESSAGES_PER_MINUTE && 
                 (Date.now() - lastMessageTimestamp) < RATE_LIMIT_WINDOW)
              }
              className="px-4 py-2 h-[42px] rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 