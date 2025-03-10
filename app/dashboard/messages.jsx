"use client";

import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import { useMockData } from '../utils/mockDataContext';

const MessagesTab = () => {
  // Mock current user ID (in a real app, this would come from authentication)
  const currentUserId = "user1";
  
  // Context and state
  const { users, matches } = useMockData();
  const [activeMatchId, setActiveMatchId] = useState(null);
  
  // Filter matches directly (no need for additional hooks/effects)
  const userMatches = matches.filter(match => 
    match.requesterId === currentUserId || match.providerId === currentUserId
  );
  
  // Find active match
  const activeMatch = userMatches.find(match => match.id === activeMatchId);
  
  // Find other user
  let currentUser = null;
  let otherUser = null;
  let messages = [];
  
  if (activeMatch) {
    const isRequester = currentUserId === activeMatch.requesterId;
    currentUser = users.find(u => u.id === currentUserId);
    const otherUserId = isRequester ? activeMatch.providerId : activeMatch.requesterId;
    otherUser = users.find(u => u.id === otherUserId);
    messages = activeMatch.messages || [];
  }
  
  // Handle selecting a match
  const handleSelectMatch = (matchId) => {
    setActiveMatchId(matchId);
  };
  
  // Handle sending a message
  const handleSendMessage = (newMessage) => {
    // Do nothing in this dummy version - we'll avoid state changes to prevent the loop
    console.log("Message sent:", newMessage);
  };
  
  // Determine if the chat is disabled
  const isChatDisabled = activeMatch ? 
    activeMatch.status === "completed" || activeMatch.status === "cancelled" : 
    true;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Messages</h2>
      
      {userMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ChatList
              matches={userMatches}
              users={users}
              currentUserId={currentUserId}
              activeMatchId={activeMatchId}
              onSelectMatch={handleSelectMatch}
            />
          </div>
          
          <div className="md:col-span-2">
            {activeMatch ? (
              <div className="h-[600px]">
                <Chat
                  matchId={activeMatchId}
                  currentUserId={currentUserId}
                  currentUser={currentUser}
                  otherUser={otherUser}
                  initialMessages={messages}
                  onSendMessage={handleSendMessage}
                  isDisabled={isChatDisabled}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No conversation selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a conversation from the list
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No messages
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have any active matches yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesTab; 