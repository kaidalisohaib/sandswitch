"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { users as initialUsers, services as initialServices, matches as initialMatches } from '../mockData';

// Create context
const MockDataContext = createContext();

// Hook to use the context
export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}

export function MockDataProvider({ children }) {
  // Initialize state with mock data
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data (use useEffect to avoid SSR conflicts)
  useEffect(() => {
    if (!isInitialized) {
      // Add completion and start tracking fields to matches if they don't exist
      const enhancedMatches = initialMatches.map(match => ({
        ...match,
        requesterCompleted: match.requesterCompleted || false,
        providerCompleted: match.providerCompleted || false,
        requesterStarted: match.requesterStarted || false,
        providerStarted: match.providerStarted || false
      }));
      
      setUsers(initialUsers);
      setServices(initialServices);
      setMatches(enhancedMatches);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Function to add a new service
  const addService = (service) => {
    const newService = {
      ...service,
      id: `service${Date.now()}`,
      created: new Date().toISOString(),
      status: "active",
    };
    setServices((prev) => [...prev, newService]);
    return newService;
  };

  // Function to update a service
  const updateService = (serviceId, updates) => {
    setServices((prev) =>
      prev.map((service) => 
        service.id === serviceId ? { ...service, ...updates } : service
      )
    );
  };

  // Function to create a new match
  const createMatch = (serviceId, requesterId, providerId) => {
    const newMatch = {
      id: `match${Date.now()}`,
      serviceId,
      requesterId,
      providerId,
      status: "wanted",
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      communicationPreference: "in-app",
      messages: [],
      requesterCompleted: false,
      providerCompleted: false,
      requesterStarted: false,
      providerStarted: false
    };
    setMatches((prev) => [...prev, newMatch]);
    
    // Update service status to matched
    updateService(serviceId, { status: "matched" });
    
    return newMatch;
  };

  // Function to update match start status
  const updateMatchStart = (matchId, userId, hasStarted) => {
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        
        // Determine if user is requester or provider
        const isRequester = userId === match.requesterId;
        
        // Set start status for the appropriate role
        const updates = isRequester 
          ? { requesterStarted: hasStarted }
          : { providerStarted: hasStarted };
        
        // Check if both users have started
        const bothStarted = isRequester
          ? hasStarted && match.providerStarted
          : hasStarted && match.requesterStarted;
          
        // Update status to in-progress if both users have started
        const status = bothStarted ? "in-progress" : match.status;
        
        return {
          ...match,
          ...updates,
          status,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  };

  // Function to update match completion status for a specific user
  const updateMatchCompletion = (matchId, userId, isCompleted) => {
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        
        // Only allow completion updates if match is in-progress AND both users have started
        if (match.status !== "in-progress" || 
            !match.requesterStarted || 
            !match.providerStarted) {
          return match;
        }
        
        // Determine if user is requester or provider
        const isRequester = userId === match.requesterId;
        
        // Set completion status for the appropriate role
        const updates = isRequester 
          ? { requesterCompleted: isCompleted }
          : { providerCompleted: isCompleted };
        
        // Check if both users have marked as complete
        const bothCompleted = isRequester
          ? isCompleted && match.providerCompleted
          : isCompleted && match.requesterCompleted;
        
        // Update status to completed only if both users have completed
        const status = bothCompleted ? "completed" : match.status;
        
        return {
          ...match,
          ...updates,
          status,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  };

  // Function to update match status (for non-completion statuses like cancelled)
  const updateMatchStatus = (matchId, status) => {
    // For statuses other than "completed" - like "cancelled"
    if (status !== "completed") {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                status,
                lastUpdated: new Date().toISOString(),
              }
            : match
        )
      );
    }
  };

  // Function to send a message in a match
  const sendMessage = (matchId, senderId, content) => {
    const newMessage = {
      id: `msg${Date.now()}`,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        
        // Don't change status through messages anymore - must use explicit start
        return {
          ...match,
          messages: [...match.messages, newMessage],
          lastUpdated: new Date().toISOString()
        };
      })
    );

    return newMessage;
  };

  // Function to mark messages as read
  const markMessagesAsRead = (matchId, userId) => {
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        
        const updatedMessages = match.messages.map((msg) => {
          if (msg.senderId !== userId && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        });
        
        return {
          ...match,
          messages: updatedMessages,
        };
      })
    );
  };

  // Function to get user matches
  const getUserMatches = (userId) => {
    return matches.filter(
      (match) => match.requesterId === userId || match.providerId === userId
    );
  };

  // Function to get match by ID
  const getMatchById = (matchId) => {
    return matches.find((match) => match.id === matchId);
  };

  // Function to get service by ID
  const getServiceById = (serviceId) => {
    return services.find((service) => service.id === serviceId);
  };

  // Function to get user by ID
  const getUserById = (userId) => {
    return users.find((user) => user.id === userId);
  };

  // Function to get completion status for user in a match
  const getMatchCompletionForUser = (matchId, userId) => {
    const match = getMatchById(matchId);
    if (!match) return false;
    
    return userId === match.requesterId 
      ? match.requesterCompleted 
      : match.providerCompleted;
  };

  // Value object with state and functions
  const value = {
    users,
    services,
    matches,
    addService,
    updateService,
    createMatch,
    updateMatchStatus,
    updateMatchCompletion,
    updateMatchStart,
    sendMessage,
    markMessagesAsRead,
    getUserMatches,
    getMatchById,
    getServiceById,
    getUserById,
    getMatchCompletionForUser
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

export default MockDataContext; 