import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  runTransaction,
  addDoc,
  increment,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { db, auth } from './firebase';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  MATCHES: 'matches'
};

// Add this after the COLLECTIONS constant
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Error handling utility
const handleError = (error, customMessage) => {
  // Don't log authentication errors to console
  if (!error.code?.startsWith('auth/')) {
    console.error(customMessage, error);
  }
  
  return {
    success: false,
    error: error.code || error.message || customMessage
  };
};

// ===== Auth Operations =====
export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    await sendEmailVerification(user);
    
    const userId = user.uid;
    await setDoc(doc(db, COLLECTIONS.USERS, userId), {
      id: userId,
      email,
      name,
      role: 'user',
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      accountStatus: 'pending',
      authProvider: 'email'
    });
    
    return { 
      success: true, 
      user: { id: userId, email, name },
      message: "Please check your email to verify your account. Your account will be activated after verification."
    };
  } catch (error) {
    if (error.code === 'permission-denied') {
      try {
        await auth.currentUser?.delete();
      } catch (deleteError) {
        console.error('Error cleaning up auth user after permission error:', deleteError);
      }
      return {
        success: false,
        error: 'Unable to create account. Please try again later.'
      };
    }
    return handleError(error, 'Error registering user');
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    // If the user hasn't verified their email within 24 hours, delete their account
    if (userData?.accountStatus === 'pending') {
      const createdAt = userData.createdAt?.toDate() || new Date();
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 24) {
        // Delete the user
        await auth.currentUser?.delete();
        await deleteDoc(doc(db, COLLECTIONS.USERS, user.uid));
        return {
          success: false,
          error: 'Account expired. Please register again.'
        };
      }
    }

    // Update verification status if needed
    if (userData && user.emailVerified !== userData.emailVerified) {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        emailVerified: user.emailVerified,
        accountStatus: user.emailVerified ? 'active' : 'pending',
        updatedAt: serverTimestamp()
      });
    }
    
    return { 
      success: true, 
      user: { 
        id: user.uid, 
        email: user.email, 
        name: user.displayName,
        emailVerified: user.emailVerified,
        ...userData 
      },
      verificationNeeded: !user.emailVerified
    };
  } catch (error) {
    if (error.code?.startsWith('auth/')) {
      return {
        success: false,
        error: error.code
      };
    }
    return handleError(error, 'Error logging in');
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error logging out');
  }
};

// Update the verifyEmail function to update the user's status
export const verifyEmail = async (actionCode) => {
  try {
    await applyActionCode(auth, actionCode);
    
    // Get the current user and force a reload to get updated emailVerified status
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      
      // Update the user's verification status in the users collection
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        emailVerified: true,
        accountStatus: 'active',
        updatedAt: serverTimestamp()
      });
    }
    
    return { 
      success: true, 
      message: "Email verified successfully! Your account is now active." 
    };
  } catch (error) {
    return handleError(error, 'Error verifying email');
  }
};

// New function to resend verification email
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    await sendEmailVerification(user);
    return { 
      success: true, 
      message: "Verification email sent! Please check your inbox." 
    };
  } catch (error) {
    return handleError(error, 'Error sending verification email');
  }
};

// New function to confirm password reset
export const confirmPasswordReset = async (actionCode, newPassword) => {
  try {
    // First verify the password reset code
    await verifyPasswordResetCode(auth, actionCode);
    // Then confirm the password reset
    await firebaseConfirmPasswordReset(auth, actionCode, newPassword);
    
    return { 
      success: true, 
      message: "Password reset successfully!" 
    };
  } catch (error) {
    return handleError(error, 'Error resetting password');
  }
};

// New function to confirm email change
export const confirmEmailChange = async (actionCode) => {
  try {
    await applyActionCode(auth, actionCode);
    
    // Get current user
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        updatedAt: serverTimestamp()
      });
    }
    
    return { 
      success: true, 
      message: "Email changed successfully!" 
    };
  } catch (error) {
    return handleError(error, 'Error changing email');
  }
};

// New function to send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { 
      success: true, 
      message: "Password reset email sent! Please check your inbox." 
    };
  } catch (error) {
    return handleError(error, 'Error sending password reset email');
  }
};

// ===== User Operations =====
export const createUser = async (userData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userData.id);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, user: userData };
  } catch (error) {
    return handleError(error, 'Error creating user');
  }
};

export const getUser = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    
    // Always try to get the user data from Firestore, even if not authenticated
    // This is important for public profile pages
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    // If the user exists in Firestore, return their data
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Make sure we have a proper name property
      if (!userData.name) {
        // If displayName is available, use it
        if (userData.displayName) {
          userData.name = userData.displayName;
        }
        // If email is available, use the first part
        else if (userData.email) {
          userData.name = userData.email.split('@')[0];
        }
        // Last resort, use a placeholder with user ID
        else {
          userData.name = `User ${userId.substring(0, 4)}`;
        }
      }
      
      return { 
        success: true, 
        user: { 
          ...userData, 
          id: userId 
        } 
      };
    }
    
    // If user doesn't exist in Firestore but we need to return something,
    // return a minimal user object
    console.log(`User with ID ${userId} not found in Firestore, returning minimal data`);
    return { 
      success: true, 
      user: { 
        id: userId,
        name: userId === auth.currentUser?.uid ? 
          (auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || `User ${userId.substring(0, 4)}`) : 
          `User ${userId.substring(0, 4)}`,
        email: userId === auth.currentUser?.uid ? auth.currentUser?.email : null,
        joinedDate: null,
        rating: null,
        completedMatches: 0
      } 
    };
  } catch (error) {
    // If we get a permission error, still try to return a useful user object
    if (error.code === 'permission-denied') {
      console.log("Permission denied when getting user, returning minimal data");
      return { 
        success: true, 
        user: { 
          id: userId,
          name: userId === auth.currentUser?.uid ? 
            (auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || `User ${userId.substring(0, 4)}`) : 
            `User ${userId.substring(0, 4)}`,
          email: userId === auth.currentUser?.uid ? auth.currentUser?.email : null,
          joinedDate: null,
          rating: null,
          completedMatches: 0
        } 
      };
    }
    return handleError(error, 'Error getting user');
  }
};

export const updateUser = async (userId, userData) => {
  try {
    // If updating name, check for duplicates
    if (userData.name) {
      // Query for users with the same name
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('name', '==', userData.name),
        where('id', '!=', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return {
          success: false,
          error: 'This display name is already taken. Please choose a different one.'
        };
      }
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error updating user');
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const usersSnap = await getDocs(usersRef);
    return usersSnap.docs.map(doc => doc.data());
  } catch (error) {
    return handleError(error, 'Error getting all users');
  }
};

// ===== Service Operations =====
export const createService = async (serviceData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const db = getFirestore();
    const user = auth.currentUser;
    
    // Rate limiting - Check how many services this user has created in the last 24 hours
    let canProceed = true;
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 24);
      
      const userServiceQuery = query(
        collection(db, 'services'),
        where('userId', '==', user.uid),
        where('created', '>=', startTime),
        orderBy('created', 'desc')
      );
      
      const userServicesSnapshot = await getDocs(userServiceQuery);
      
      // Limit to 5 services per 24 hours
      const MAX_SERVICES_PER_DAY = 5;
      if (userServicesSnapshot.size >= MAX_SERVICES_PER_DAY) {
        return { 
          success: false, 
          error: `You can only create ${MAX_SERVICES_PER_DAY} services per day. Please try again later.` 
        };
      }

      // Also check for rapid creation (last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const recentServices = userServicesSnapshot.docs.filter(
        doc => doc.data().created && doc.data().created.toDate() >= fiveMinutesAgo
      );
      
      // Limit to 2 services per 5 minutes
      const MAX_SERVICES_PER_FIVE_MINUTES = 2;
      if (recentServices.length >= MAX_SERVICES_PER_FIVE_MINUTES) {
        return { 
          success: false, 
          error: `Creating too many services too quickly. Please wait a few minutes before creating another.` 
        };
      }
    } catch (indexError) {
      // If this fails due to a missing index, log it but let the user proceed
      console.warn('Rate limiting check failed, possibly due to missing index:', indexError);
      console.log('Please create the required index using the link in the error message');
      // We'll still allow service creation since this is a system error, not user's fault
      canProceed = true;
    }
    
    if (!canProceed) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    
    // Check for suspicious behavior (duplicate content)
    try {
      if (serviceData.title && serviceData.description) {
        // Look for services with identical titles or very similar descriptions in the last 48 hours
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
        
        const recentServicesQuery = query(
          collection(db, 'services'),
          where('created', '>=', fortyEightHoursAgo),
          orderBy('created', 'desc'),
          limit(50) // Limit the query to a reasonable number
        );
        
        const recentServicesSnapshot = await getDocs(recentServicesQuery);
        
        // Check for duplicate titles or suspicious description similarities
        const normalizedTitle = serviceData.title.toLowerCase().trim();
        const duplicateTitleServices = recentServicesSnapshot.docs.filter(doc => {
          const data = doc.data();
          const otherTitle = data.title?.toLowerCase().trim() || '';
          return otherTitle === normalizedTitle && data.userId !== user.uid;
        });
        
        if (duplicateTitleServices.length >= 2) {
          console.warn(`Suspicious activity: Multiple identical titles "${normalizedTitle}" detected`);
          // Consider logging this for admin review rather than blocking immediately
          
          // For serious cases, you might want to flag the account
          await setDoc(doc(db, 'flaggedUsers', user.uid), {
            reason: 'Suspicious duplicate content',
            timestamp: serverTimestamp(),
            contentType: 'service',
            duplicateTitle: normalizedTitle
          }, { merge: true });
        }
      }
    } catch (error) {
      // If this check fails, log but don't prevent service creation
      console.warn('Duplicate content check failed:', error);
    }
    
    // Continue with service creation
    const servicesCollection = collection(db, 'services');
    const newServiceRef = await addDoc(servicesCollection, {
      ...serviceData,
      userId: user.uid,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    });
    
    // Track service creation in user profile for analytics and security monitoring
    try {
      await setDoc(doc(db, 'users', user.uid), {
        serviceCreationCount: increment(1),
        lastServiceCreated: serverTimestamp(),
        lastActivity: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      // If tracking fails, log but don't rollback service creation
      console.warn('Failed to update user stats:', error);
    }
    
    console.log('Service created with ID: ', newServiceRef.id);
    return { success: true, serviceId: newServiceRef.id };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error: error.message };
  }
};

export const getService = async (serviceId) => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    const serviceSnap = await getDoc(serviceRef);
    if (serviceSnap.exists()) {
      return { success: true, service: { ...serviceSnap.data(), id: serviceId } };
    }
    return { success: false, error: 'Service not found' };
  } catch (error) {
    return handleError(error, 'Error getting service');
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error updating service');
  }
};

export const deleteService = async (serviceId) => {
  try {
    console.log('Starting soft delete operation for service:', serviceId);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('You must be logged in to delete a service');
    }

    // First get the service to check ownership
    const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (!serviceSnap.exists()) {
      throw new Error('Service not found');
    }
    
    const serviceData = serviceSnap.data();
    
    // Verify the current user owns this service
    if (!serviceData.userId) {
      throw new Error('Service has no owner ID');
    }
    
    if (serviceData.userId !== auth.currentUser.uid) {
      throw new Error('You do not have permission to delete this service');
    }

    // Check for active matches
    const matchesRef = collection(db, COLLECTIONS.MATCHES);
    const activeMatchesQuery = query(
      matchesRef,
      where('serviceId', '==', serviceId),
      where('status', '==', 'in-progress')
    );
    
    const activeMatchesSnap = await getDocs(activeMatchesQuery);
    
    if (!activeMatchesSnap.empty) {
      throw new Error('Cannot delete service with active matches. Please complete or cancel active matches first.');
    }

    // Instead of deleting, update the service status to 'deleted'
    await updateDoc(serviceRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Service marked as deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Delete service error:', error);
    return handleError(error, 'Error deleting service');
  }
};

export const getUserServices = async (userId) => {
  try {
    // If not authenticated, return empty array instead of attempting the query
    if (!auth.currentUser) {
      console.log("Not authenticated, returning empty services array");
      return { success: true, services: [] };
    }
    
    const q = query(collection(db, COLLECTIONS.SERVICES), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
    return { success: true, services };
  } catch (error) {
    // If permission error, return empty array
    if (error.code === 'permission-denied') {
      console.log("Permission denied when getting user services, returning empty array");
      return { success: true, services: [] };
    }
    return handleError(error, 'Error getting user services');
  }
};

export const getAllServices = async () => {
  try {
    const servicesRef = collection(db, COLLECTIONS.SERVICES);
    const servicesSnap = await getDocs(servicesRef);
    return servicesSnap.docs.map(doc => doc.data());
  } catch (error) {
    return handleError(error, 'Error getting all services');
  }
};

export const getAvailableServices = async () => {
  try {
    // No authentication check needed - we allow anyone to read services
    const q = query(
      collection(db, COLLECTIONS.SERVICES),
      where("status", "==", "active")  // This already excludes deleted services
    );
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    return { success: true, services };
  } catch (error) {
    return handleError(error, 'Error getting available services');
  }
};

export const searchServices = async (searchTerm) => {
  try {
    // Note: This is a basic implementation. For better search,
    // consider using Algolia or other search services
    const q = query(
      collection(db, COLLECTIONS.SERVICES),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return { success: true, services };
  } catch (error) {
    return handleError(error, 'Error searching services');
  }
};

// ===== Match Operations =====
export const createMatch = async (matchData) => {
  try {
    // Verify the service exists and is not deleted
    const serviceRef = doc(db, COLLECTIONS.SERVICES, matchData.serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (!serviceSnap.exists()) {
      return { success: false, error: 'Service not found' };
    }
    
    const serviceData = serviceSnap.data();
    
    // Don't allow match creation with deleted services
    if (serviceData.status === 'deleted') {
      return { success: false, error: 'This service is no longer available' };
    }
    
    const newMatch = {
      ...matchData,
      status: 'wanted',
      messages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.MATCHES), newMatch);
    return { success: true, matchId: docRef.id };
  } catch (error) {
    return handleError(error, 'Error creating match');
  }
};

export const getMatch = async (matchId) => {
  try {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      return { success: false, error: 'Match not found' };
    }
    
    return { 
      success: true, 
      match: {
        id: matchId,
        ...matchSnap.data()
      }
    };
  } catch (error) {
    return handleError(error, 'Error getting match');
  }
};

export const getUserMatches = async (userId) => {
  try {
    // More detailed logging
    console.log(`getUserMatches called for userId: ${userId}`);
    console.log(`Current auth state: ${auth.currentUser ? 'Authenticated as ' + auth.currentUser.uid : 'Not authenticated'}`);
    
    // If not authenticated, we shouldn't block the request for public profile pages
    // Only log a warning instead of returning an empty array
    if (!auth.currentUser) {
      console.warn("Note: Fetching matches while not authenticated - this may return limited results");
      // Continue with the request instead of returning early
    }
    
    // Ensure userId is valid
    if (!userId) {
      console.error("getUserMatches called with invalid userId:", userId);
      return { success: false, error: 'Invalid user ID', matches: [] };
    }
    
    console.log(`Fetching matches where user ${userId} is requester or provider...`);
    
    try {
      // Fetch all matches where the user is either the requester or the provider
      const [requestedSnap, providedSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.MATCHES), where("requesterId", "==", userId))),
        getDocs(query(collection(db, COLLECTIONS.MATCHES), where("providerId", "==", userId))),
      ]);

      console.log(`Found ${requestedSnap.size} matches as requester and ${providedSnap.size} matches as provider`);

      const matches = [
        ...requestedSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })),
        ...providedSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })),
      ];

      console.log(`Total combined matches: ${matches.length}`);
      
      // If no matches were found, this might be unexpected - log it
      if (matches.length === 0) {
        console.log("No matches found for user:", userId);
        
        // Check if the MATCHES collection exists and has documents
        const matchesCollectionRef = collection(db, COLLECTIONS.MATCHES);
        const sampleMatchesSnapshot = await getDocs(query(matchesCollectionRef, limit(1)));
        
        if (sampleMatchesSnapshot.empty) {
          console.warn("The MATCHES collection appears to be empty or doesn't exist");
        } else {
          console.log("The MATCHES collection exists and has at least one document");
        }
      }

      return { success: true, matches };
    } catch (innerError) {
      console.error("Error in database query for matches:", innerError);
      
      // Still return success with empty array to prevent UI errors
      return { success: true, matches: [] };
    }
  } catch (error) {
    // If permission error, return empty array
    if (error.code === 'permission-denied') {
      console.log("Permission denied when getting user matches, returning empty array");
      return { success: true, matches: [] };
    }
    console.error("Error in getUserMatches:", error);
    return handleError(error, 'Error getting user matches');
  }
};

export const updateMatchStart = async (matchId, userId, hasStartedOrUpdates) => {
  try {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    
    // Get current match data
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      throw new Error(`Match not found with ID: ${matchId}`);
    }
    
    const matchData = matchSnap.data();
    
    // Verify user is part of this match
    if (matchData.requesterId !== userId && matchData.providerId !== userId) {
      throw new Error(`User ${userId} is not part of match ${matchId}`);
    }
    
    // Determine if user is requester or provider
    const isRequester = userId === matchData.requesterId;
    
    // Handle updates based on parameter style
    let updates = {};
    
    if (typeof hasStartedOrUpdates === 'object') {
      // Called with updates object
      updates = { ...hasStartedOrUpdates };
      
      // Ensure we have valid values for the started fields
      if (updates.requesterStarted === undefined) {
        updates.requesterStarted = matchData.requesterStarted || false;
      }
      
      if (updates.providerStarted === undefined) {
        updates.providerStarted = matchData.providerStarted || false;
      }
    } else {
      // Called with boolean hasStarted parameter (or undefined)
      // Make sure hasStartedOrUpdates is a boolean
      const hasStarted = hasStartedOrUpdates === undefined ? false : !!hasStartedOrUpdates;
      
      updates = {
        requesterStarted: isRequester ? hasStarted : (matchData.requesterStarted || false),
        providerStarted: !isRequester ? hasStarted : (matchData.providerStarted || false)
      };
      
      // If both users have started, update status to in-progress
      const bothStarted = updates.requesterStarted && updates.providerStarted;
      
      if (bothStarted) {
        updates.status = "in-progress";
      }
    }
    
    // Update timestamp
    updates.updatedAt = serverTimestamp();
    
    console.log('Updating match with:', updates);
    
    // Update the match
    await updateDoc(matchRef, updates);
    
    return true;
  } catch (error) {
    console.error('Error in updateMatchStart:', error);
    return handleError(error, 'Error updating match start status');
  }
};

export const updateMatchCompletion = async (matchId, userId, isCompleted) => {
  try {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    
    // Get current match data
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      throw new Error(`Match not found with ID: ${matchId}`);
    }
    
    const matchData = matchSnap.data();
    
    // Verify user is part of the match
    if (matchData.requesterId !== userId && matchData.providerId !== userId) {
      throw new Error(`User ${userId} is not part of match ${matchId}`);
    }
    
    // Only allow completion updates if match is in-progress
    if (matchData.status !== 'in-progress') {
      throw new Error("Cannot complete a match that isn't in progress");
    }
    
    // Determine if user is requester or provider
    const isRequester = userId === matchData.requesterId;
    
    // Ensure isCompleted is a boolean
    const completionStatus = isCompleted === undefined ? false : !!isCompleted;
    
    const updates = isRequester
      ? { requesterCompleted: completionStatus }
      : { providerCompleted: completionStatus };
    
    // Check if both users have completed
    const bothCompleted = isRequester
      ? (completionStatus && matchData.providerCompleted)
      : (completionStatus && matchData.requesterCompleted);
    
    // Update match status if needed
    if (bothCompleted) {
      updates.status = 'completed';
      
      // Get both user IDs
      const requesterId = matchData.requesterId;
      const providerId = matchData.providerId;
      
      // Get both users' data to update their completion stats
      const requesterRef = doc(db, COLLECTIONS.USERS, requesterId);
      const providerRef = doc(db, COLLECTIONS.USERS, providerId);
      
      try {
        // Update requester's stats
        await updateDoc(requesterRef, {
          completedMatches: increment(1),
          updatedAt: serverTimestamp()
        });
        
        // Update provider's stats
        await updateDoc(providerRef, {
          completedMatches: increment(1),
          updatedAt: serverTimestamp()
        });
        
        console.log(`Updated completion stats for users ${requesterId} and ${providerId}`);
      } catch (statsError) {
        console.error('Error updating user completion stats:', statsError);
        // Continue with the match update even if the stats update fails
      }
    }
    
    // Log the updates
    console.log('Updating match completion with:', updates);
    
    // Update the match
    await updateDoc(matchRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateMatchCompletion:', error);
    return handleError(error, 'Error updating match completion');
  }
};

export const updateMatchStatus = async (matchId, status) => {
  try {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    
    // Get current match data
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      throw new Error(`Match not found with ID: ${matchId}`);
    }
    
    // Update the match status
    await updateDoc(matchRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error updating match status');
  }
};

export const cancelMatch = async (matchId, userId) => {
  try {
    // Get the match data first to verify the user is a participant
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      throw new Error('Match not found');
    }
    
    const matchData = matchDoc.data();
    
    // Check if user is a participant in the match
    const isParticipant = matchData.providerId === userId || matchData.requesterId === userId;
    if (!isParticipant) {
      throw new Error('Only match participants can cancel a match');
    }
    
    // Update match status - simpler approach without a transaction
    await updateDoc(matchRef, { 
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error cancelling match');
  }
};

export const sendMessage = async (matchId, senderId, content) => {
  try {
    // Basic validation
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    // Message size validation
    const MAX_MESSAGE_LENGTH = 1000;
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`);
    }

    // Get the match document
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      throw new Error('Match not found');
    }

    const matchData = matchSnap.data();

    // Check if match is active
    if (matchData.status === 'cancelled' || matchData.status === 'completed') {
      throw new Error('Cannot send messages in a cancelled or completed match');
    }

    // Rate limiting check
    const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
    const MAX_MESSAGES_PER_MINUTE = 20;
    const now = new Date();
    const recentMessages = matchData.messages?.filter(msg => {
      const msgTime = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp.seconds * 1000);
      return msg.senderId === senderId && (now - msgTime) <= RATE_LIMIT_WINDOW;
    }) || [];

    if (recentMessages.length >= MAX_MESSAGES_PER_MINUTE) {
      throw new Error(`Rate limit exceeded. Maximum ${MAX_MESSAGES_PER_MINUTE} messages per minute allowed.`);
    }
    
    // Create a regular JavaScript Date object for the message
    // serverTimestamp() cannot be used inside arrayUnion()
    const message = {
      id: `msg${Date.now()}`,
      senderId,
      content: content.trim(),
      timestamp: new Date(),
      read: false
    };
    
    await updateDoc(matchRef, {
      messages: arrayUnion(message),
      updatedAt: serverTimestamp() // This is fine to use outside of arrayUnion
    });
    
    return { success: true, message };
  } catch (error) {
    return handleError(error, 'Error sending message');
  }
};

export const markMessagesAsRead = async (matchId, userId) => {
  try {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    
    // Get current match data
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      throw new Error('Match not found');
    }
    
    const matchData = matchSnap.data();
    
    // Only update messages not sent by the current user and not already read
    const updatedMessages = matchData.messages.map(msg => {
      if (msg.senderId !== userId && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });
    
    // Update the match with the modified messages
    await updateDoc(matchRef, {
      messages: updatedMessages,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error marking messages as read');
  }
};

export const getUnreadMessageCount = async (userId) => {
  try {
    const matches = await getUserMatches(userId);
    if (!matches.success) return { success: true, count: 0 };

    const count = matches.matches.reduce((total, match) => {
      const unreadMessages = match.messages.filter(
        msg => !msg.read && msg.senderId !== userId
      );
      return total + unreadMessages.length;
    }, 0);

    return { success: true, count };
  } catch (error) {
    return handleError(error, 'Error getting unread message count');
  }
};

// Add a function to clean up unverified accounts
export const cleanupUnverifiedAccounts = async () => {
  try {
    const now = new Date();
    const pendingUsersRef = collection(db, 'pendingUsers');
    const expiredUsersQuery = query(
      pendingUsersRef,
      where('verificationDeadline', '<', now)
    );
    
    const expiredUsersSnap = await getDocs(expiredUsersQuery);
    
    const deletePromises = expiredUsersSnap.docs.map(async (doc) => {
      const userData = doc.data();
      try {
        // Delete the user from Firebase Auth
        const user = await getAuth().getUser(userData.id);
        if (!user.emailVerified) {
          await getAuth().deleteUser(userData.id);
        }
        // Delete from pendingUsers collection
        await deleteDoc(doc.ref);
      } catch (error) {
        console.error(`Error cleaning up user ${userData.id}:`, error);
      }
    });
    
    await Promise.all(deletePromises);
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Error cleaning up unverified accounts');
  }
};

// Add this after the handleError function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in our database
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document if it doesn't exist
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        role: 'user',
        emailVerified: true,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authProvider: 'google'
      });
    } else {
      // Update last login
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { 
      success: true, 
      user: {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        emailVerified: true,
        ...userDoc.data()
      }
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Sign in cancelled by user'
      };
    }
    return handleError(error, 'Error signing in with Google');
  }
};

// New function to subscribe to match updates
export const subscribeToMatch = (matchId, callback) => {
  try {
    // Check if user is authenticated first
    if (!auth.currentUser) {
      console.warn('Attempted to subscribe to match without authentication');
      return () => {}; // Return a no-op function
    }
    
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    
    // Create a real-time listener for this match
    const unsubscribe = onSnapshot(matchRef, 
      // onNext handler
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Transform doc into match object with ID
          const matchData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          
          // Transform timestamp objects to make them serializable
          if (matchData.createdAt) {
            try {
              const createdAt = matchData.createdAt.toDate ? matchData.createdAt.toDate() : new Date(matchData.createdAt);
              matchData.createdAt = createdAt;
            } catch (error) {
              console.warn('Error converting createdAt timestamp:', error);
              matchData.createdAt = new Date(); // Fallback
            }
          }
          
          if (matchData.updatedAt) {
            try {
              const updatedAt = matchData.updatedAt.toDate ? matchData.updatedAt.toDate() : new Date(matchData.updatedAt);
              matchData.updatedAt = updatedAt;
            } catch (error) {
              console.warn('Error converting updatedAt timestamp:', error);
              matchData.updatedAt = new Date(); // Fallback
            }
          }
          
          // Transform timestamps in messages
          if (matchData.messages && Array.isArray(matchData.messages)) {
            matchData.messages = matchData.messages.map(message => {
              try {
                // If message has a timestamp field
                if (message.timestamp) {
                  // Handle Firestore timestamps
                  if (message.timestamp.toDate) {
                    return {
                      ...message,
                      timestamp: message.timestamp.toDate()
                    };
                  } else if (typeof message.timestamp === 'string') {
                    return {
                      ...message,
                      timestamp: new Date(message.timestamp)
                    };
                  } else if (message.timestamp.seconds) {
                    return {
                      ...message,
                      timestamp: new Date(message.timestamp.seconds * 1000)
                    };
                  }
                } else {
                  // If timestamp is missing, add a fallback
                  return {
                    ...message,
                    timestamp: new Date()
                  };
                }
                return message;
              } catch (error) {
                console.warn('Error converting message timestamp:', error, message);
                // Return message with a fallback timestamp if conversion fails
                return {
                  ...message,
                  timestamp: new Date()
                };
              }
            });
          } else {
            // Ensure messages is always at least an empty array
            matchData.messages = [];
          }
          
          // Call the callback with the updated match
          callback(matchData);
        } else {
          console.error(`Match ${matchId} not found`);
          callback(null);
        }
      }, 
      // onError handler
      (error) => {
        console.error(`Error listening to match ${matchId}:`, error);
        // Check if it's a permission error (which happens on logout)
        if (error.code === 'permission-denied') {
          console.log('User no longer has permission to view this match (likely logged out)');
        }
        // Don't call the callback with error, return empty data instead
        callback(null);
      }
    );
    
    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up match subscription:', error);
    // Return a dummy unsubscribe function to prevent errors
    return () => {};
  }
}; 