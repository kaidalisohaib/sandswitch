"use client";

import React from 'react';

const ChatListItem = ({ match, otherUser, lastMessage, onClick, isActive }) => {
  // Format timestamp to a readable time
  const getFormattedTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // If same day, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within the last week, show day name
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const lastMessageTime = lastMessage?.timestamp 
    ? getFormattedTime(lastMessage.timestamp) 
    : '';

  return (
    <div 
      onClick={() => onClick && onClick(match.id)}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
          {otherUser?.name?.charAt(0) || '?'}
        </div>
        {match.status === 'in-progress' && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
        )}
      </div>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {otherUser?.name || 'Unknown User'}
          </h3>
          {lastMessageTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {lastMessageTime}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
            {lastMessage?.content || 'No messages yet'}
          </p>
          
          {match.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-medium">
              {match.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatList = ({ matches, users, currentUserId, activeMatchId, onSelectMatch }) => {
  // Process matches to include the other user and last message
  const processedMatches = matches
    .map(match => {
      // Find the other user
      const otherUserId = match.requesterId === currentUserId 
        ? match.providerId 
        : match.requesterId;
      
      const otherUser = users.find(user => user.id === otherUserId);
      
      // Get last message
      const lastMessage = match.messages?.length > 0 
        ? match.messages[match.messages.length - 1] 
        : null;
        
      // Count unread messages
      const unreadCount = match.messages?.filter(
        msg => !msg.read && msg.senderId !== currentUserId
      )?.length || 0;
      
      return {
        ...match,
        otherUser,
        lastMessage,
        unreadCount
      };
    })
    // Sort by last message time (most recent first)
    .sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || a.created;
      const timeB = b.lastMessage?.timestamp || b.created;
      return new Date(timeB) - new Date(timeA);
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Messages</h2>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
        {processedMatches.length > 0 ? (
          processedMatches.map(match => (
            <ChatListItem
              key={match.id}
              match={match}
              otherUser={match.otherUser}
              lastMessage={match.lastMessage}
              isActive={match.id === activeMatchId}
              onClick={onSelectMatch}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 