"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import * as FirebaseService from "./firebaseService";

// Create context
const FirebaseContext = createContext();

// Service categories
const serviceCategories = [
  "Food",
  "Academic",
  "Creative",
  "Social",
  "Technology",
  "Music",
  "Sports",
  "Transportation",
  "Miscellaneous",
];

// Add these right after your imports

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry
const cache = {
  services: { data: null, timestamp: 0 },
  users: { data: {}, timestamp: {} },
  servicesByUser: { data: {}, timestamp: {} }
};

// Hook to use the context
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}

export function FirebaseProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check for user in session storage as fallback
  useEffect(() => {
    // This runs once on initial load to check if we have stored user data
    try {
      if (typeof window !== "undefined" && !currentUser && isLoading) {
        const sessionUser = sessionStorage.getItem('firebase_user');
        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          console.log("Restored user from session storage:", userData.id);
          setCurrentUser(userData);
        }
      }
    } catch (err) {
      console.error("Error checking session storage:", err);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    let authCheckTimeout;
    
    // Set a flag to track the component mount state
    let isMounted = true;
    
    console.log("Setting up Firebase auth listener");
    
    // Create a promise that resolves when auth state is determined
    const authCheckPromise = new Promise((resolve) => {
      // Set a timeout for auth initialization as fallback
      authCheckTimeout = setTimeout(() => {
        if (isMounted) {
          console.log("Auth state check timed out after 5s");
          setAuthInitialized(true);
          setIsLoading(false);
          resolve();
        }
      }, 5000);
      
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (!isMounted) return;
          
          console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");
          clearTimeout(authCheckTimeout);
          
          try {
            if (user) {
              const result = await FirebaseService.getUser(user.uid);
              if (result.success) {
                const userData = { 
                  id: user.uid, 
                  emailVerified: user.emailVerified,
                  email: user.email,
                  // Ensure we capture displayName from Firebase Auth
                  displayName: user.displayName,
                  // Use displayName as name if available and no name in Firestore
                  name: result.user.name || user.displayName || (user.email ? user.email.split('@')[0] : null),
                  ...result.user 
                };
                
                console.log("Setting current user with data:", userData);
                setCurrentUser(userData);
                
                // Store user in session storage as fallback
                try {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem('firebase_user', JSON.stringify(userData));
                  }
                } catch (err) {
                  console.error("Error saving to session storage:", err);
                }
              }
            } else {
              setCurrentUser(null);
              // Clear session storage when logged out
              try {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem('firebase_user');
                }
              } catch (err) {
                console.error("Error removing from session storage:", err);
              }
            }
          } catch (err) {
            console.error("Error getting user data:", err);
            setError("Failed to get user data");
          } finally {
            setAuthInitialized(true);
            setIsLoading(false);
            resolve();
          }
        },
        (error) => {
          if (!isMounted) return;
          
          console.error("Auth state error:", error);
          clearTimeout(authCheckTimeout);
          setError("Authentication error");
          setAuthInitialized(true);
          setIsLoading(false);
          resolve();
        }
      );
      
      // Return cleanup function
      return () => {
        isMounted = false;
        clearTimeout(authCheckTimeout);
        unsubscribe();
      };
    });
    
    // Execute the auth check
    authCheckPromise.catch(err => {
      console.error("Auth check promise error:", err);
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(authCheckTimeout);
    };
  }, []);

  // Auth functions
  const signUp = async (email, password, name) => {
    try {
      const result = await FirebaseService.registerUser(email, password, name);
      if (result.success) {
        setCurrentUser(result.user);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const result = await FirebaseService.loginUser(email, password);
      if (result.success) {
        const userData = await FirebaseService.getUser(result.user.id);
        if (userData.success) {
          const userInfo = { 
            id: result.user.id, 
            emailVerified: result.user.emailVerified,
            email: result.user.email,
            // Ensure we capture name from Firebase Auth if not in Firestore
            displayName: result.user.displayName,
            name: userData.user.name || result.user.displayName || result.user.name || (result.user.email ? result.user.email.split('@')[0] : null),
            ...userData.user 
          };
          
          console.log("Login successful, setting current user:", userInfo);
          setCurrentUser(userInfo);
          
          // Store in session storage for persistence
          try {
            if (typeof window !== "undefined") {
              sessionStorage.setItem('firebase_user', JSON.stringify(userInfo));
            }
          } catch (err) {
            console.error("Error saving user to session storage during login:", err);
          }
        }
      }
      // Don't set error state for auth errors, just return the result
      return result;
    } catch (error) {
      // Only set error state for non-auth errors
      if (!error.code?.startsWith('auth/')) {
        setError(error.message);
      }
      return { success: false, error: error.code || error.message };
    }
  };

  const logout = async () => {
    try {
      const result = await FirebaseService.logoutUser();
      if (result.success) {
        setCurrentUser(null);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const result = await FirebaseService.resendVerificationEmail();
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const result = await FirebaseService.sendPasswordResetEmail(email);
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const verifyEmail = async (actionCode) => {
    try {
      const result = await FirebaseService.verifyEmail(actionCode);
      if (result.success) {
        // Force a refresh of the Firebase user to get updated emailVerified status
        const user = auth.currentUser;
        if (user) {
          await user.reload();
          // Update the current user's verification status
          setCurrentUser(prevUser => ({
            ...prevUser,
            emailVerified: user.emailVerified
          }));
        }
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const getCurrentUser = () => currentUser;

  // User Data
  const getUserById = async (userId) => {
    if (!userId) return null;
    
    // Check cache first
    const now = Date.now();
    if (cache.users.data[userId] && (now - cache.users.timestamp[userId] < CACHE_EXPIRY)) {
      console.log("Returning cached user data for:", userId);
      return cache.users.data[userId];
    }
    
    try {
      const result = await FirebaseService.getUser(userId);
      console.log("Result from getUser:", result);
      
      if (result.success) {
        // Ensure the user data has all required fields with defaults as needed
        const userData = {
          id: userId,
          name: result.user.name || result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : `User ${userId.substring(0,4)}`),
          email: result.user.email || "",
          createdAt: result.user.createdAt || new Date(),
          completedMatches: result.user.completedMatches || 0,
          rating: result.user.rating || null,
          ...result.user
        };
        
        // Update cache
        cache.users.data[userId] = userData;
        cache.users.timestamp[userId] = now;
        return userData;
      }
      
      // If we got a success: false result but still need to return something
      if (userId === currentUser?.id) {
        // For current user, return their Firebase auth data
        console.log("Using current user data as fallback");
        return currentUser;
      }
      
      // Last resort, return minimal user object
      console.log("Creating minimal user object for:", userId);
      return {
        id: userId,
        name: `User ${userId.substring(0, 4)}`,
        createdAt: new Date(),
        completedMatches: 0
      };
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      setError(`Error fetching user: ${error.message}`);
      return {
        id: userId,
        name: `User ${userId.substring(0, 4)}`,
        createdAt: new Date(),
        completedMatches: 0
      };
    }
  };

  const updateUserProfile = async (userId, data) => {
    const result = await FirebaseService.updateUser(userId, data);
    if (result.success && userId === currentUser?.id) {
      // Update current user data if it's the logged-in user
      const updatedUserData = await FirebaseService.getUser(userId);
      if (updatedUserData.success) {
        setCurrentUser({ id: userId, ...updatedUserData.user });
      }
    }
    return result;
  };

  // Service functions
  const createService = async (serviceData) => {
    try {
      const result = await FirebaseService.createService(serviceData);
      if (result.success) {
        // Invalidate services cache
        invalidateCache('services');
        if (serviceData.userId) {
          invalidateCache('servicesByUser', serviceData.userId);
        }
      }
      return result;
    } catch (error) {
      setError(`Error creating service: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const updateService = async (serviceId, data) => {
    return await FirebaseService.updateService(serviceId, data);
  };

  const deleteService = async (serviceId) => {
    return await FirebaseService.deleteService(serviceId);
  };

  const getServiceById = async (serviceId) => {
    if (!serviceId) return null;
    
    // Check cache first
    const now = Date.now();
    if (cache.services.data && cache.services.data[serviceId] && (now - cache.services.timestamp < CACHE_EXPIRY)) {
      return cache.services.data[serviceId];
    }
    
    try {
      const result = await FirebaseService.getService(serviceId);
      if (result.success) {
        // Initialize cache if needed
        if (!cache.services.data) cache.services.data = {};
        
        // Update cache
        cache.services.data[serviceId] = result.service;
        cache.services.timestamp = now;
        return result.service;
      }
      return null;
    } catch (error) {
      setError(`Error fetching service: ${error.message}`);
      return null;
    }
  };

  const getServicesByUserId = async (userId) => {
    if (!userId) return [];
    
    // Check cache first
    const now = Date.now();
    if (cache.servicesByUser.data[userId] && (now - cache.servicesByUser.timestamp[userId] < CACHE_EXPIRY)) {
      return cache.servicesByUser.data[userId];
    }
    
    try {
      const result = await FirebaseService.getUserServices(userId);
      if (result.success) {
        // Update cache
        cache.servicesByUser.data[userId] = result.services;
        cache.servicesByUser.timestamp[userId] = now;
        return result.services;
      }
      return [];
    } catch (error) {
      setError(`Error fetching user services: ${error.message}`);
      return [];
    }
  };

  const getAvailableServices = async () => {
    // Check cache first
    const now = Date.now();
    if (cache.services.data && (now - cache.services.timestamp < CACHE_EXPIRY)) {
      // This is for the full services list
      const servicesList = Object.values(cache.services.data);
      if (servicesList.length > 0) {
        return servicesList;
      }
    }
    
    try {
      const result = await FirebaseService.getAvailableServices();
      if (result.success) {
        // Create a map of services by ID
        const servicesMap = {};
        result.services.forEach(service => {
          servicesMap[service.id] = service;
        });
        
        // Update cache
        cache.services.data = servicesMap;
        cache.services.timestamp = now;
        return result.services;
      }
      return [];
    } catch (error) {
      setError(`Error fetching available services: ${error.message}`);
      return [];
    }
  };

  // Add a method to invalidate cache when data changes
  const invalidateCache = (type, id = null) => {
    if (type === 'services') {
      if (id) {
        if (cache.services.data) {
          delete cache.services.data[id];
        }
      } else {
        cache.services.data = null;
      }
    } else if (type === 'users' && id) {
      delete cache.users.data[id];
      delete cache.users.timestamp[id];
    } else if (type === 'servicesByUser' && id) {
      delete cache.servicesByUser.data[id];
      delete cache.servicesByUser.timestamp[id];
    }
  };

  // Match functions
  const createMatch = async (serviceId, requesterId, providerId) => {
    return await FirebaseService.createMatch({
      serviceId,
      requesterId,
      providerId,
    });
  };

  const updateMatchStatus = async (matchId, status) => {
    return await FirebaseService.updateMatchStatus(matchId, status);
  };

  const updateMatchStart = async (matchId, userIdOrUpdates, hasStarted) => {
    // Handle both parameter styles
    if (typeof userIdOrUpdates === 'object') {
      // Called with updates object (matchId, updates)
      const updates = userIdOrUpdates;
      return await FirebaseService.updateMatchStart(matchId, currentUser?.id, updates);
    } else {
      // Called with individual parameters (matchId, userId, hasStarted)
      return await FirebaseService.updateMatchStart(matchId, userIdOrUpdates, hasStarted);
    }
  };

  const updateMatchCompletion = async (matchId, userIdOrUpdates, isCompleted) => {
    // Handle both parameter styles
    if (typeof userIdOrUpdates === 'object') {
      // Called with updates object (matchId, updates)
      const updates = userIdOrUpdates;
      return await FirebaseService.updateMatchCompletion(matchId, currentUser?.id, updates);
    } else {
      // Called with individual parameters (matchId, userId, isCompleted)
      return await FirebaseService.updateMatchCompletion(matchId, userIdOrUpdates, isCompleted);
    }
  };

  const cancelMatch = async (matchId, userId) => {
    return await FirebaseService.cancelMatch(matchId, userId);
  };

  const getMatchById = async (matchId) => {
    try {
      const result = await FirebaseService.getMatch(matchId);
      if (!result.success) {
        console.error('Error getting match:', result.error);
        return null;
      }
      return result.match;
    } catch (error) {
      console.error('Error in getMatchById:', error);
      return null;
    }
  };

  const getUserMatches = async (userId) => {
    try {
      console.log("firebaseContext.getUserMatches called for:", userId || currentUser?.id);
      const result = await FirebaseService.getUserMatches(userId || currentUser?.id);
      console.log("firebaseContext.getUserMatches result:", { 
        success: result.success, 
        matchCount: result.matches?.length || 0
      });
      
      // Return the matches array directly if successful, otherwise return an empty array
      if (result.success && Array.isArray(result.matches)) {
        return result.matches;
      }
      console.warn("getUserMatches did not return a valid array:", result);
      return [];
    } catch (error) {
      console.error("Error in firebaseContext.getUserMatches:", error);
      return [];
    }
  };

  // Message functions
  const sendMessage = async (matchId, senderId, content) => {
    return await FirebaseService.sendMessage(matchId, senderId, content);
  };

  const markMessagesAsRead = async (matchId, userId) => {
    return await FirebaseService.markMessagesAsRead(matchId, userId || currentUser?.id);
  };

  const getUnreadMessageCount = async (userId) => {
    const result = await FirebaseService.getUnreadMessageCount(userId || currentUser?.id);
    return result.success ? result.count : 0;
  };

  // Real-time subscription
  const subscribeToMatch = (matchId, callback) => {
    return FirebaseService.subscribeToMatch(matchId, callback);
  };

  // Search functions
  const searchServices = async (searchTerm) => {
    const result = await FirebaseService.searchServices(searchTerm);
    return result.success ? result.services : [];
  };

  // Add Google Sign In function
  const signInWithGoogle = async () => {
    try {
      const result = await FirebaseService.signInWithGoogle();
      if (result.success) {
        setCurrentUser(result.user);
      }
      return result;
    } catch (error) {
      // Don't set error state for auth errors or user cancellation
      if (!error.code?.startsWith('auth/') && error.code !== 'auth/popup-closed-by-user') {
        setError(error.message);
      }
      return { success: false, error: error.code || error.message };
    }
  };

  // Value object with state and functions
  const value = {
    currentUser,
    isLoading,
    firebaseLoading: isLoading,
    authInitialized,
    error,
    setError,
    categories: serviceCategories,
    clearError: () => setError(null),
    
    // Auth functions
    signUp,
    login,
    logout,
    getCurrentUser,
    resendVerificationEmail,
    verifyEmail,
    sendPasswordResetEmail,
    
    // User operations
    getUserById,
    updateUserProfile,
    
    // Service operations
    createService,
    updateService,
    deleteService,
    getServiceById,
    getServicesByUserId,
    getAvailableServices,
    searchServices,
    
    // Match operations
    createMatch,
    updateMatchStatus,
    updateMatchStart,
    updateMatchCompletion,
    cancelMatch,
    getMatchById,
    getUserMatches,
    
    // Message operations
    sendMessage,
    markMessagesAsRead,
    getUnreadMessageCount,
    subscribeToMatch,
    
    // Google Sign In
    signInWithGoogle,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export default FirebaseContext; 