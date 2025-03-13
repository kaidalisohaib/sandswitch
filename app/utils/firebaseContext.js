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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (user) {
            const result = await FirebaseService.getUser(user.uid);
            if (result.success) {
              setCurrentUser({ 
                id: user.uid, 
                emailVerified: user.emailVerified,
                ...result.user 
              });
            }
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Error getting user data:", err);
          setError("Failed to get user data");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Auth state error:", error);
        setError("Authentication error");
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
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
          setCurrentUser({ 
            id: result.user.id, 
            emailVerified: result.user.emailVerified,
            ...userData.user 
          });
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
    try {
      if (!userId) {
        console.log("No user ID provided");
        return null;
      }
      
      const result = await FirebaseService.getUser(userId);
      return result.success ? result.user : null;
    } catch (error) {
      console.error("Error getting user:", error);
      // Create a minimal placeholder user object if there's a permission error
      if (error.code === 'permission-denied') {
        console.log("Permission denied when getting user, using placeholder");
        return {
          id: userId,
          name: "User",
          joinedDate: null,
          rating: null,
          completedServices: 0
        };
      }
      return null;
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
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }
    return await FirebaseService.createService({
      ...serviceData,
      userId: currentUser.id,
    });
  };

  const updateService = async (serviceId, data) => {
    return await FirebaseService.updateService(serviceId, data);
  };

  const deleteService = async (serviceId) => {
    return await FirebaseService.deleteService(serviceId);
  };

  const getServiceById = async (serviceId) => {
    const result = await FirebaseService.getService(serviceId);
    return result.success ? result.service : null;
  };

  const getServicesByUserId = async (userId) => {
    const result = await FirebaseService.getUserServices(userId);
    return result.success ? result.services : [];
  };

  const getAvailableServices = async () => {
    try {
      // No need to check authentication status here, as we want to allow 
      // unauthenticated users to view services
      const result = await FirebaseService.getAvailableServices();
      return result.success ? result.services : [];
    } catch (error) {
      console.error("Error getting available services:", error);
      setError("Failed to load services");
      return [];
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
    const result = await FirebaseService.getUserMatches(userId || currentUser?.id);
    // Return the matches array directly if successful, otherwise return an empty array
    return result.success ? result.matches : [];
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