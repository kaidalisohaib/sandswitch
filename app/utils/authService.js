// Authentication Service
// This file will handle authentication operations, currently with mock data but prepared for Firebase

import { getUserById } from "./dataService";

// Current user is stored in localStorage for persistence between refreshes in mock mode
const CURRENT_USER_KEY = "sandswitch_current_user";

// Mock login function (will be replaced with Firebase Auth)
export const login = async (users, email, password) => {
  // Simple mock authentication - just find a user with matching email
  // In a real app, you would validate credentials with Firebase
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { success: false, message: "User not found" };
  }
  
  // In a mock environment, we'll just accept any password
  // Store the current user ID in localStorage
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
    }
  } catch (error) {
    console.error("Error saving current user to localStorage:", error);
  }
  
  return { success: true, user };
};

// Mock logout function (will be replaced with Firebase Auth)
export const logout = async () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error("Error removing current user from localStorage:", error);
  }
  
  return { success: true };
};

// Get current user from localStorage
export const getCurrentUser = (users) => {
  try {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem(CURRENT_USER_KEY);
      if (userId) {
        const user = getUserById(users, userId);
        if (user) return user;
      }
    }
  } catch (error) {
    console.error("Error getting current user from localStorage:", error);
  }
  
  // Return null if no user is logged in
  return null;
};

// Check if a user is authenticated
export const isAuthenticated = () => {
  try {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error("Error checking authentication status:", error);
  }
  
  return false;
};

// Register a new user (mock implementation, will be replaced with Firebase Auth)
export const register = async (users, userData) => {
  // Check if email already exists
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === userData.email.toLowerCase()
  );
  
  if (existingUser) {
    return { 
      success: false, 
      message: "Email already in use" 
    };
  }
  
  // Create a new user
  const newUser = {
    id: `user${Date.now()}`,
    name: userData.name,
    email: userData.email,
    profilePic: userData.profilePic || "/avatars/default.png",
    joinedDate: new Date().toISOString().split("T")[0],
    rating: 0,
    completedServices: 0,
  };
  
  // In a real implementation, this would be handled by Firebase Auth
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_USER_KEY, newUser.id);
    }
  } catch (error) {
    console.error("Error saving new user to localStorage:", error);
  }
  
  return { 
    success: true, 
    user: newUser,
    updatedUsers: [...users, newUser]
  };
};

// Update a user profile (will integrate with Firebase later)
export const updateUserProfile = (users, userId, profileData) => {
  const updatedUsers = users.map((user) => {
    if (user.id === userId) {
      return {
        ...user,
        ...profileData,
      };
    }
    return user;
  });
  
  return {
    success: true,
    updatedUsers
  };
}; 