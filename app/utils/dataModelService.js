// Data Model Service
// This file defines data models, schemas, and validation functions

// User schema
export const UserSchema = {
  id: 'string',
  name: 'string',
  email: 'string',
  profilePic: 'string',
  joinedDate: 'string',
  rating: 'number',
  completedServices: 'number',
};

// Service schema
export const ServiceSchema = {
  id: 'string',
  type: 'string', // "offering" or "request"
  title: 'string',
  description: 'string',
  category: 'string',
  tags: 'array',
  userId: 'string',
  created: 'string',
  status: 'string', // "active", "matched", "completed", "deleted"
  location: 'string',
};

// Match schema
export const MatchSchema = {
  id: 'string',
  serviceId: 'string',
  requesterId: 'string',
  providerId: 'string',
  status: 'string', // "wanted", "in-progress", "completed", "cancelled"
  created: 'string',
  lastUpdated: 'string',
  communicationPreference: 'string',
  requesterStarted: 'boolean',
  providerStarted: 'boolean',
  requesterCompleted: 'boolean',
  providerCompleted: 'boolean',
  messages: 'array',
};

// Message schema
export const MessageSchema = {
  id: 'string',
  senderId: 'string',
  content: 'string',
  timestamp: 'string',
  read: 'boolean',
};

// Validation functions
export function validateUser(user) {
  const errors = [];
  
  if (!user.id) errors.push('User ID is required');
  if (!user.name) errors.push('User name is required');
  if (!user.email) errors.push('User email is required');
  if (!user.joinedDate) errors.push('User joined date is required');
  
  // Type validation
  if (typeof user.rating !== 'number') errors.push('User rating must be a number');
  if (typeof user.completedServices !== 'number') errors.push('Completed services must be a number');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) errors.push('Invalid email format');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateService(service) {
  const errors = [];
  
  if (!service.id) errors.push('Service ID is required');
  if (!service.title) errors.push('Service title is required');
  if (!service.description) errors.push('Service description is required');
  if (!service.userId) errors.push('Service owner ID is required');
  if (!service.category) errors.push('Service category is required');
  
  // Type validation
  if (!['offering', 'request'].includes(service.type)) {
    errors.push('Service type must be "offering" or "request"');
  }
  
  // Status validation
  if (!['active', 'matched', 'completed', 'deleted'].includes(service.status)) {
    errors.push('Invalid service status');
  }
  
  // Tags validation
  if (!Array.isArray(service.tags)) {
    errors.push('Service tags must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMatch(match) {
  const errors = [];
  
  if (!match.id) errors.push('Match ID is required');
  if (!match.serviceId) errors.push('Service ID is required');
  if (!match.requesterId) errors.push('Requester ID is required');
  if (!match.providerId) errors.push('Provider ID is required');
  
  // Status validation
  if (!['wanted', 'in-progress', 'completed', 'cancelled'].includes(match.status)) {
    errors.push('Invalid match status');
  }
  
  // Boolean validations
  if (typeof match.requesterStarted !== 'boolean') {
    errors.push('Requester started must be a boolean');
  }
  if (typeof match.providerStarted !== 'boolean') {
    errors.push('Provider started must be a boolean');
  }
  if (typeof match.requesterCompleted !== 'boolean') {
    errors.push('Requester completed must be a boolean');
  }
  if (typeof match.providerCompleted !== 'boolean') {
    errors.push('Provider completed must be a boolean');
  }
  
  // Messages validation
  if (!Array.isArray(match.messages)) {
    errors.push('Messages must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMessage(message) {
  const errors = [];
  
  if (!message.id) errors.push('Message ID is required');
  if (!message.senderId) errors.push('Sender ID is required');
  if (!message.content) errors.push('Message content is required');
  if (!message.timestamp) errors.push('Timestamp is required');
  
  // Boolean validation
  if (typeof message.read !== 'boolean') {
    errors.push('Read status must be a boolean');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Factory functions to create new entities with proper types
export function createUser(userData) {
  const newUser = {
    id: userData.id || `user${Date.now()}`,
    name: userData.name || '',
    email: userData.email || '',
    profilePic: userData.profilePic || '/avatars/default.png',
    joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
    rating: userData.rating || 0,
    completedServices: userData.completedServices || 0,
  };
  
  const validation = validateUser(newUser);
  return {
    user: newUser,
    validation,
  };
}

export function createService(serviceData) {
  const newService = {
    id: serviceData.id || `service${Date.now()}`,
    type: serviceData.type || 'offering',
    title: serviceData.title || '',
    description: serviceData.description || '',
    category: serviceData.category || '',
    tags: Array.isArray(serviceData.tags) ? serviceData.tags : [],
    userId: serviceData.userId || '',
    created: serviceData.created || new Date().toISOString(),
    status: serviceData.status || 'active',
    location: serviceData.location || '',
  };
  
  const validation = validateService(newService);
  return {
    service: newService,
    validation,
  };
}

export function createMatch(matchData) {
  const newMatch = {
    id: matchData.id || `match${Date.now()}`,
    serviceId: matchData.serviceId || '',
    requesterId: matchData.requesterId || '',
    providerId: matchData.providerId || '',
    status: matchData.status || 'wanted',
    created: matchData.created || new Date().toISOString(),
    lastUpdated: matchData.lastUpdated || new Date().toISOString(),
    communicationPreference: matchData.communicationPreference || 'in-app',
    requesterStarted: matchData.requesterStarted || false,
    providerStarted: matchData.providerStarted || false,
    requesterCompleted: matchData.requesterCompleted || false,
    providerCompleted: matchData.providerCompleted || false,
    messages: Array.isArray(matchData.messages) ? matchData.messages : [],
  };
  
  const validation = validateMatch(newMatch);
  return {
    match: newMatch,
    validation,
  };
}

export function createMessage(messageData) {
  const newMessage = {
    id: messageData.id || `msg${Date.now()}`,
    senderId: messageData.senderId || '',
    content: messageData.content || '',
    timestamp: messageData.timestamp || new Date().toISOString(),
    read: messageData.read || false,
  };
  
  const validation = validateMessage(newMessage);
  return {
    message: newMessage,
    validation,
  };
} 