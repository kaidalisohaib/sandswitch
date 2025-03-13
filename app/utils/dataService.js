// Data Service
// This file centralizes all data operations in preparation for Firebase migration

import {
  users as initialUsers,
  services as initialServices,
  matches as initialMatches,
} from "../mockData";

// Import data model utilities for validation
import * as dataModel from "./dataModelService";

// Validate the dataModel import was successful
if (!dataModel || !dataModel.createService || !dataModel.validateService) {
  console.error('Data model utilities not properly imported', dataModel);
}

// Storage keys
const STORAGE_KEYS = {
  USERS: "sandswitch_users",
  SERVICES: "sandswitch_services",
  MATCHES: "sandswitch_matches",
};

// Helper functions for localStorage
const loadFromStorage = (key, fallback) => {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return fallback;
};

// Helper function to save data to localStorage
const saveToStorage = (key, data) => {
  if (typeof window === 'undefined') return; // Server-side check
  
  try {
    console.log(`Saving data to localStorage: ${key} with ${Array.isArray(data) ? data.length : 0} items`);
    
    // Add a small microtask delay to ensure the operation completes
    setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Successfully saved ${key} to localStorage`);
      } catch (innerError) {
        console.error(`Failed to save data to localStorage in delayed execution: ${key}`, innerError);
      }
    }, 0);
    
    // Also do immediate save
    localStorage.setItem(key, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error(`Error saving data to localStorage: ${key}`, error);
    return false;
  }
};

// Initialize data service
export const initializeDataService = () => {
  // Load data from localStorage or use initial data
  const users = loadFromStorage(STORAGE_KEYS.USERS, initialUsers);
  const services = loadFromStorage(STORAGE_KEYS.SERVICES, initialServices);
  const matches = loadFromStorage(STORAGE_KEYS.MATCHES, initialMatches);
  
  // Check for duplicate match IDs during initialization
  const matchIds = {};
  matches.forEach((match) => {
    if (matchIds[match.id]) {
      console.error(`Duplicate match ID detected: ${match.id}`);
    }
    matchIds[match.id] = true;
  });
  
  // For debugging
  console.log(
    "Available match IDs:",
    matches.map((m) => m.id).join(", ")
  );
  
  return {
    users,
    services,
    matches,
  };
};

// Function to persist all data
export const persistData = (users, services, matches) => {
  console.log("Persisting all data to localStorage");
  
  try {
    // Add a debugging log for matches
    if (Array.isArray(matches)) {
      console.log(`Persisting ${matches.length} matches:`, 
        matches.map(m => ({ id: m.id, service: m.serviceId })));
    }
    
    // Save each data type
    const usersResult = saveToStorage(STORAGE_KEYS.USERS, users);
    const servicesResult = saveToStorage(STORAGE_KEYS.SERVICES, services);
    const matchesResult = saveToStorage(STORAGE_KEYS.MATCHES, matches);
    
    // Double-check that matches were saved correctly by reading them back
    if (typeof window !== 'undefined') {
      try {
        const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
        if (savedMatches) {
          const parsedMatches = JSON.parse(savedMatches);
          console.log(`Verification: ${parsedMatches.length} matches retrieved from localStorage`);
        }
      } catch (verifyError) {
        console.error("Error verifying matches storage:", verifyError);
      }
    }
    
    return {
      success: usersResult && servicesResult && matchesResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in persistData:", error);
    return { success: false, error: error.message };
  }
};

// ===== User Operations =====

export const getUserById = (users, userId) => {
  if (!users || !userId) {
    console.warn(
      `Cannot find user: users array is ${
        !users ? "undefined" : "defined"
      }, userId is ${!userId ? "undefined" : userId}`
    );
    return null;
  }
  return users.find((user) => user.id === userId);
};

export const updateUser = (users, userId, updates) => {
  const updatedUsers = users.map((user) => {
    if (user.id === userId) {
      const updatedUser = { ...user, ...updates };
      const { valid, errors } = dataModel.validateUser(updatedUser);
      if (!valid) {
        console.error('Invalid user data:', errors);
        return user; // Return original if validation fails
      }
      return updatedUser;
    }
    return user;
  });
  return updatedUsers;
};

export const addUser = (users, userData) => {
  const { user: newUser, validation } = dataModel.createUser(userData);
  
  if (!validation.valid) {
    console.error('Invalid user data:', validation.errors);
    return {
      success: false,
      message: validation.errors.join(', '),
      users
    };
  }
  
  return {
    success: true,
    user: newUser,
    users: [...users, newUser]
  };
};

// ===== Service Operations =====

export const getServiceById = (services, serviceId) => {
  if (!services || !serviceId) {
    console.warn(
      `Cannot find service: services array is ${
        !services ? "undefined" : "defined"
      }, serviceId is ${!serviceId ? "undefined" : serviceId}`
    );
    return null;
  }
  return services.find((service) => service.id === serviceId);
};

export const addService = (services, serviceData) => {
  try {
    // Validate and create the service
    const { service: newService, validation } = dataModel.createService({
      ...serviceData,
      id: `service${Date.now()}`,
      created: new Date().toISOString(),
      status: "active"
    });
    
    // Check validation results
    if (!validation.valid) {
      console.error('Invalid service data:', validation.errors);
      return services; // Return original services array if validation fails
    }
    
    // Add the new service to the array
    return [...services, newService];
  } catch (error) {
    console.error('Error adding service:', error);
    return services; // Return original services if there's an error
  }
};

export const updateService = (services, serviceId, updates) => {
  return services.map((service) => {
    if (service.id === serviceId) {
      const updatedService = { ...service, ...updates };
      const { valid, errors } = dataModel.validateService(updatedService);
      if (!valid) {
        console.error('Invalid service data:', errors);
        return service; // Return original if validation fails
      }
      return updatedService;
    }
    return service;
  });
};

export const deleteService = (services, matches, serviceId) => {
  // Only check for active matches that have been started
  const activeMatches = matches.filter(
    (m) => m.serviceId === serviceId && m.status === "in-progress"
  );

  if (activeMatches.length > 0) {
    return {
      success: false,
      message: "Cannot delete service with active matches",
      services,
      matches,
    };
  }

  // Remove all matches associated with this service that aren't completed
  const updatedMatches = matches.filter(
    (match) => match.serviceId !== serviceId || match.status === "completed"
  );

  // Remove the service
  const updatedServices = services.filter(
    (service) => service.id !== serviceId
  );
  
  return {
    success: true,
    services: updatedServices,
    matches: updatedMatches,
  };
};

export const getAvailableServices = (services) => {
  return services.filter((service) => service.status !== "deleted");
};

export const getServicesByUserId = (services, userId) => {
  return services.filter(service => service.userId === userId);
};

export const getServicesByCategory = (services, category) => {
  return services.filter(service => service.category === category);
};

export const searchServices = (services, searchTerm) => {
  if (!searchTerm) return services;
  
  const term = searchTerm.toLowerCase();
  return services.filter(service => 
    service.title.toLowerCase().includes(term) ||
    service.description.toLowerCase().includes(term) ||
    service.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

// ===== Match Operations =====

export const getMatchById = (matches, matchId) => {
  if (!matches || !matchId) {
    console.warn(
      `Cannot find match: matches array is ${
        !matches ? "undefined" : "defined"
      }, matchId is ${!matchId ? "undefined" : matchId}`
    );
    return null;
  }
  
  const match = matches.find((match) => match.id === matchId);

  if (!match) {
    console.warn(
      `Match with ID "${matchId}" not found. Available match IDs: ${matches
        .map((m) => m.id)
        .join(", ")}`
    );

    // Check for similar IDs (in case of case sensitivity issues)
    const similarMatches = matches.filter(
      (m) => m.id.toLowerCase() === matchId.toLowerCase()
    );
    if (similarMatches.length > 0) {
      console.warn(
        `Found similar matches with case differences: ${similarMatches
          .map((m) => m.id)
          .join(", ")}`
      );
    }
  }

  return match;
};

export const getUserMatches = (matches, services, userId) => {
  return matches.filter((match) => {
    const service = services.find((s) => s.id === match.serviceId);
    return (
      service && (match.requesterId === userId || match.providerId === userId)
    );
  });
};

export const getMatchesByStatus = (matches, status) => {
  return matches.filter(match => match.status === status);
};

export const createMatch = (services, matches, serviceId, requesterId, providerId) => {
  try {
    // Verify all required IDs exist
    if (!serviceId || !requesterId || !providerId) {
      console.error("Missing required IDs for match creation");
      return {
        success: false,
        message: "Cannot create match - missing required information",
        matches,
        services
      };
    }
    
    // Verify service exists
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      console.error(`Service with ID ${serviceId} not found`);
      return {
        success: false,
        message: "Service not found",
        matches,
        services
      };
    }
    
    const { match: newMatch, validation } = dataModel.createMatch({
      id: `match${Date.now()}`,
      serviceId,
      requesterId,
      providerId,
      status: "wanted",
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      communicationPreference: "in-app",
      requesterStarted: false,
      providerStarted: false,
      requesterCompleted: false,
      providerCompleted: false,
      messages: [] // Ensure we initialize with an empty messages array
    });
    
    if (!validation.valid) {
      console.error('Invalid match data:', validation.errors);
      return {
        success: false,
        message: validation.errors.join(', '),
        matches,
        services
      };
    }
    
    // Update service status to matched
    const updatedServices = updateService(services, serviceId, { status: "matched" });
    
    return {
      success: true,
      match: newMatch,
      matches: [...matches, newMatch],
      services: updatedServices
    };
  } catch (error) {
    console.error("Error creating match:", error);
    return {
      success: false,
      message: "Internal error creating match",
      matches,
      services
    };
  }
};

export const updateMatchStart = (matches, matchId, userId, hasStarted) => {
  return matches.map((match) => {
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

    const updatedMatch = {
      ...match,
      ...updates,
      status,
      lastUpdated: new Date().toISOString(),
    };
    
    const { valid, errors } = dataModel.validateMatch(updatedMatch);
    if (!valid) {
      console.error('Invalid match data:', errors);
      return match; // Return original if validation fails
    }
    
    return updatedMatch;
  });
};

export const updateMatchCompletion = (matches, matchId, userId, isCompleted) => {
  // Safety check for undefined matches
  if (!matches || !Array.isArray(matches)) {
    console.error("Matches array is invalid:", matches);
    return [];
  }

  return matches.map((match) => {
    if (match.id !== matchId) return match;

    // Only allow completion updates if match is in-progress AND both users have started
    if (
      match.status !== "in-progress" ||
      !match.requesterStarted ||
      !match.providerStarted
    ) {
      return match;
    }

    // Determine if user is requester or provider
    const isRequester = userId === match.requesterId;

    // Create a new match object with updated completion status
    const updatedMatch = {
      ...match,
      requesterCompleted: isRequester
        ? isCompleted
        : match.requesterCompleted,
      providerCompleted: isRequester
        ? match.providerCompleted
        : isCompleted,
      lastUpdated: new Date().toISOString(),
    };

    // Check if both users have marked as complete
    const bothCompleted =
      updatedMatch.requesterCompleted && updatedMatch.providerCompleted;
    
    // Update status to completed if both users have completed
    if (bothCompleted) {
      updatedMatch.status = "completed";
    }
    
    const { valid, errors } = dataModel.validateMatch(updatedMatch);
    if (!valid) {
      console.error('Invalid match data:', errors);
      return match; // Return original if validation fails
    }
    
    return updatedMatch;
  });
};

export const updateMatchStatus = (matches, matchId, status) => {
  // Validate status
  if (!["wanted", "in-progress", "completed", "cancelled"].includes(status)) {
    console.error(`Invalid match status: ${status}`);
    return matches;
  }
  
  return matches.map((match) => {
    if (match.id === matchId) {
      // Important: Preserve all existing fields including completion status
      const updatedMatch = {
        ...match,
        status,
        lastUpdated: new Date().toISOString(),
      };
      
      const { valid, errors } = dataModel.validateMatch(updatedMatch);
      if (!valid) {
        console.error('Invalid match data:', errors);
        return match; // Return original if validation fails
      }
      
      return updatedMatch;
    }
    return match;
  });
};

export const cancelMatch = (services, matches, matchId, userId) => {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return { services, matches };

  // Only allow cancellation if match hasn't started or if user is the owner of the service
  const service = services.find((s) => s.id === match.serviceId);
  const isServiceOwner = service && service.userId === userId;

  if (match.status === "in-progress" && !isServiceOwner) {
    return { services, matches };
  }

  // Delete the match instead of marking it as cancelled
  const updatedMatches = matches.filter((m) => m.id !== matchId);

  // If this was the only match for the service, update service status back to active
  const remainingMatches = matches.filter(
    (m) => m.serviceId === match.serviceId && m.id !== matchId
  );

  let updatedServices = services;
  if (remainingMatches.length === 0 && service) {
    updatedServices = updateService(services, service.id, { status: "active" });
  }

  return {
    services: updatedServices,
    matches: updatedMatches
  };
};

export const getMatchCompletionForUser = (matches, matchId, userId) => {
  const match = getMatchById(matches, matchId);
  if (!match) return false;

  return userId === match.requesterId
    ? match.requesterCompleted
    : match.providerCompleted;
};

export const getMatchStatusCounts = (matches, userId) => {
  const userMatches = matches.filter(match => 
    match.requesterId === userId || match.providerId === userId
  );
  
  return {
    wanted: userMatches.filter(m => m.status === 'wanted').length,
    inProgress: userMatches.filter(m => m.status === 'in-progress').length,
    completed: userMatches.filter(m => m.status === 'completed').length,
    total: userMatches.length
  };
};

// ===== Message Operations =====

export const sendMessage = (matches, matchId, senderId, content) => {
  if (!content.trim()) {
    return {
      success: false,
      message: "Message content cannot be empty",
      matches
    };
  }
  
  const { message: newMessage, validation } = dataModel.createMessage({
    senderId,
    content,
    timestamp: new Date().toISOString()
  });
  
  if (!validation.valid) {
    console.error('Invalid message data:', validation.errors);
    return {
      success: false,
      message: validation.errors.join(', '),
      matches
    };
  }

  const updatedMatches = matches.map((match) => {
    if (match.id !== matchId) return match;

    // Don't change status through messages anymore - must use explicit start
    const updatedMatch = {
      ...match,
      messages: [...match.messages, newMessage],
      lastUpdated: new Date().toISOString(),
    };
    
    return updatedMatch;
  });

  return {
    success: true,
    message: newMessage,
    matches: updatedMatches
  };
};

export const markMessagesAsRead = (matches, matchId, userId) => {
  return matches.map((match) => {
    if (match.id !== matchId) return match;

    // Only mark messages as read if they are from the other user
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
  });
};

export const getUnreadMessageCount = (matches, userId) => {
  return matches.reduce((count, match) => {
    // Only count messages where the current user is a participant
    if (match.requesterId !== userId && match.providerId !== userId) {
      return count;
    }
    
    // Count unread messages sent by the other user
    const unreadCount = match.messages.filter(
      msg => msg.senderId !== userId && !msg.read
    ).length;
    
    return count + unreadCount;
  }, 0);
};

// ===== Match Validation =====

export const validateMatch = (match) => {
  if (!match) {
    return { valid: false, errors: ['Match object is required'] };
  }

  const errors = [];

  // Required fields
  if (!match.id) errors.push('Match ID is required');
  if (!match.serviceId) errors.push('Service ID is required');
  if (!match.requesterId) errors.push('Requester ID is required');
  if (!match.providerId) errors.push('Provider ID is required');
  if (!match.status) errors.push('Status is required');

  // Status validation
  const validStatuses = ['wanted', 'in-progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(match.status)) {
    errors.push(`Invalid status: ${match.status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Boolean fields validation
  if (typeof match.requesterStarted !== 'boolean') errors.push('requesterStarted must be a boolean');
  if (typeof match.providerStarted !== 'boolean') errors.push('providerStarted must be a boolean');
  if (typeof match.requesterCompleted !== 'boolean') errors.push('requesterCompleted must be a boolean');
  if (typeof match.providerCompleted !== 'boolean') errors.push('providerCompleted must be a boolean');

  // Messages array validation
  if (!Array.isArray(match.messages)) {
    errors.push('messages must be an array');
  } else {
    match.messages.forEach((msg, index) => {
      if (!msg.id) errors.push(`Message ${index} is missing an ID`);
      if (!msg.senderId) errors.push(`Message ${index} is missing a sender ID`);
      if (!msg.content) errors.push(`Message ${index} is missing content`);
      if (!msg.timestamp) errors.push(`Message ${index} is missing a timestamp`);
    });
  }

  // Status consistency validation
  if (match.status === 'in-progress' && (!match.requesterStarted || !match.providerStarted)) {
    errors.push('Match cannot be in-progress if both users have not started');
  }

  if (match.status === 'completed' && (!match.requesterCompleted || !match.providerCompleted)) {
    errors.push('Match cannot be completed if both users have not marked it as complete');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}; 