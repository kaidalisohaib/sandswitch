"use client";

import React, { useState, useMemo, useEffect } from 'react';
import ChatListItem from '../components/ChatListItem';
import Chat from '../components/Chat';
import { useFirebase } from '../utils/firebaseContext';

const StatusFilter = ({ currentStatus, onStatusChange }) => {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'wanted', label: 'Pending' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="flex flex-wrap space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onStatusChange(filter.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 mb-2
            ${currentStatus === filter.id
              ? filter.id === 'cancelled'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

const MessagesTab = () => {
  const { 
    currentUser, 
    getUserMatches, 
    getUserById, 
    getMatchById, 
    sendMessage,
    markMessagesAsRead 
  } = useFirebase();
  const currentUserId = currentUser?.id;
  
  // State
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeMatchData, setActiveMatchData] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState(null);
  // Add state for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    active: false,
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
  
  // Load matches
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

  // Get filtered matches for the current user
  const filteredMatches = useMemo(() => {
    if (!currentUserId || !matches) return { active: [], completed: [], cancelled: [] };

    // Improved timestamp handling for sorting
    const sortByLastMessage = (a, b) => {
      const aLastMessage = a.messages?.[a.messages.length - 1];
      const bLastMessage = b.messages?.[b.messages.length - 1];
      
      // Get timestamps, handling both Firebase timestamp objects and regular dates
      const getTime = (msg) => {
        if (!msg) return 0;
        if (msg.timestamp) {
          // Handle Firebase Timestamp format
          if (typeof msg.timestamp.seconds === 'number') {
            return msg.timestamp.seconds * 1000;
          }
          // Handle Date object or ISO string
          if (msg.timestamp instanceof Date || typeof msg.timestamp === 'string') {
            return new Date(msg.timestamp).getTime();
          }
        }
        return 0;
      };
      
      // Get creation timestamps as fallbacks
      const getCreationTime = (match) => {
        if (match.createdAt) {
          // Handle Firebase Timestamp format
          if (typeof match.createdAt.seconds === 'number') {
            return match.createdAt.seconds * 1000;
          }
          // Handle Date object or ISO string
          if (match.createdAt instanceof Date || typeof match.createdAt === 'string') {
            return new Date(match.createdAt).getTime();
          }
        }
        return 0;
      };
      
      const aTime = aLastMessage ? getTime(aLastMessage) : getCreationTime(a);
      const bTime = bLastMessage ? getTime(bLastMessage) : getCreationTime(b);
      
      return bTime - aTime; // Most recent first
    };

    // Divide matches into active, completed, and cancelled
    const activeMatches = [];
    const completedMatches = [];
    const cancelledMatches = [];

    // Filter by status if needed
    if (statusFilter !== 'all') {
      const filtered = matches.filter(match => match.status === statusFilter);
      
      // Apply sorting regardless of filter type
      const sortedFiltered = [...filtered].sort(sortByLastMessage);
      
      // Return properly sorted matches in the correct category
      if (statusFilter === 'cancelled') {
        return { active: [], completed: [], cancelled: sortedFiltered };
      } else if (statusFilter === 'completed') {
        return { active: [], completed: sortedFiltered, cancelled: [] };
      } else {
        return { active: sortedFiltered, completed: [], cancelled: [] };
      }
    } else {
      // When showing all, separate into three categories
      matches.forEach(match => {
        if (match.status === 'cancelled') {
          cancelledMatches.push(match);
        } else if (match.status === 'completed') {
          completedMatches.push(match);
        } else {
          activeMatches.push(match);
        }
      });
    }

    return {
      active: activeMatches.sort(sortByLastMessage),
      completed: completedMatches.sort(sortByLastMessage),
      cancelled: cancelledMatches.sort(sortByLastMessage)
    };
  }, [matches, currentUserId, statusFilter]);

  // Load active match data when activeMatchId changes
  useEffect(() => {
    const loadActiveMatchData = async () => {
      if (!activeMatchId || !currentUserId) {
        setActiveMatchData(null);
        return;
      }

      try {
        const match = await getMatchById(activeMatchId);
        if (!match) {
          setActiveMatchData(null);
          return;
        }

        // Check if current user is part of the match
        if (match.requesterId !== currentUserId && match.providerId !== currentUserId) {
          setActiveMatchData(null);
          return;
        }

        // Get the other user
        const otherUserId = match.requesterId === currentUserId 
          ? match.providerId 
          : match.requesterId;
          
        const otherUser = await getUserById(otherUserId);
        
        if (!otherUser) {
          console.error('Failed to load other user data');
          setError('Failed to load chat data');
          setActiveMatchData(null);
          return;
        }
        
        // Mark messages as read when opening the chat
        try {
          // Only mark messages as read for active matches
          if (match.status !== 'cancelled' && match.status !== 'completed') {
            await markMessagesAsRead(activeMatchId, currentUserId);
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
        
        // Set active match data with fresh data
        setActiveMatchData({
          match,
          currentUser,
          otherUser,
          messages: match.messages || [],
          isChatDisabled: match.status === 'cancelled' || match.status === 'completed'
        });
      } catch (error) {
        console.error('Error loading chat data:', error);
        setError('Failed to load chat data');
        setActiveMatchData(null);
      }
    };

    loadActiveMatchData();
  }, [activeMatchId, currentUserId, getUserById, getMatchById, markMessagesAsRead, currentUser]);

  const handleChatClick = async (matchId) => {
    try {
    setActiveMatchId(matchId);
      
      // Mark messages as read when clicking on chat
      try {
        // Get the match to check status
        const match = await getMatchById(matchId);
        
        // Only mark messages as read for active matches
        if (match && match.status !== 'cancelled' && match.status !== 'completed') {
          await markMessagesAsRead(matchId, currentUserId);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
      setError('Failed to load chat data');
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content) => {
    if (!activeMatchId || !currentUserId || !content.trim()) return;
    
    try {
      await sendMessage(activeMatchId, currentUserId, content);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view your messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-8rem)] flex flex-col">
        <StatusFilter currentStatus={statusFilter} onStatusChange={setStatusFilter} />
        <div className="overflow-y-auto flex-grow p-4 space-y-4">
          {(filteredMatches.active.length > 0 || filteredMatches.completed.length > 0 || filteredMatches.cancelled.length > 0) ? (
            <>
              {/* Active Matches */}
              {filteredMatches.active.length > 0 && (
                <div className="space-y-4">
                  {statusFilter === 'all' && (
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
                      onClick={() => toggleSection('active')}
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active Conversations ({filteredMatches.active.length})
                      </h3>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsedSections.active ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                  {(!collapsedSections.active || statusFilter !== 'all') && (
                    <div className="space-y-2">
                      {filteredMatches.active.map(match => (
                        <ChatListItem
                          key={match.id}
                          match={match}
                          isActive={activeMatchId === match.id}
                          onClick={() => handleChatClick(match.id)}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Completed Matches */}
              {filteredMatches.completed.length > 0 && (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
                    onClick={() => toggleSection('completed')}
                  >
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Completed Conversations ({filteredMatches.completed.length})
                    </h3>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsedSections.completed ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {!collapsedSections.completed && (
                    <div className="space-y-2">
                      {filteredMatches.completed.map(match => (
                        <ChatListItem
                          key={match.id}
                          match={match}
                          isActive={activeMatchId === match.id}
                          onClick={() => handleChatClick(match.id)}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Cancelled Matches */}
              {filteredMatches.cancelled.length > 0 && (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
                    onClick={() => toggleSection('cancelled')}
                  >
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cancelled Conversations ({filteredMatches.cancelled.length})
                    </h3>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsedSections.cancelled ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {!collapsedSections.cancelled && (
                    <div className="space-y-2">
                      {filteredMatches.cancelled.map(match => (
              <ChatListItem
                key={match.id}
                match={match}
                isActive={activeMatchId === match.id}
                onClick={() => handleChatClick(match.id)}
                currentUserId={currentUserId}
              />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No messages found</p>
            </div>
          )}
        </div>
      </div>
      <div id="chat-area" className="w-2/3">
        {activeMatchData ? (
          <div className="h-[calc(100vh-8rem)] flex flex-col">
          <Chat
            matchId={activeMatchId}
            currentUserId={currentUserId}
              messages={activeMatchData.messages}
            otherUser={activeMatchData.otherUser}
              messageText={messageText}
              setMessageText={setMessageText}
              onSendMessage={handleSendMessage}
              disabled={activeMatchData.isChatDisabled}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <p className="text-gray-500 dark:text-gray-400">Select a chat to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab; 