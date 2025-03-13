"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatDate } from "../../utils/dateUtils";
import { useFirebase } from "../../utils/firebaseContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("services");
  const [statusFilter, setStatusFilter] = useState('all');
  const [services, setServices] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const { 
    getUserById, 
    getServicesByUserId, 
    getUserMatches, 
    currentUser, 
    isLoading, // Get the standard loading state as fallback
    firebaseLoading, 
    authInitialized 
  } = useFirebase();
  
  const router = useRouter();

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
      
      // If we have a user but we're stuck loading, let's try to move forward
      if (currentUser && loading) {
        setAuthChecked(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [currentUser, loading]);

  // Get current user ID from context
  const currentUserId = currentUser?.id;

  // Check for user data in sessionStorage as fallback
  useEffect(() => {
    let mounted = true;
    
    const checkSessionStorage = () => {
      try {
        // If we already have a user, skip this check
        if (currentUser) {
          if (mounted) setAuthChecked(true);
          return;
        }
        
        console.log("Checking session storage for user data");
        const sessionUser = sessionStorage.getItem('firebase_user');
        if (sessionUser && mounted) {
          console.log("Found user in session storage");
          // We found a user in session storage, no need to redirect
          setAuthChecked(true);
        }
      } catch (err) {
        console.error("Error checking session storage:", err);
      }
    };
    
    checkSessionStorage();
    
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // Separate authentication check with progressive retries
  useEffect(() => {
    let mounted = true;
    let authTimer;

    const checkAuth = () => {
      // Only proceed if component is still mounted
      if (!mounted) return;
      
      // Safely log auth state (handle undefined values)
      console.log("Check auth - Loading:", firebaseLoading !== undefined ? firebaseLoading : isLoading, 
                 "User:", currentUser?.id || "none", 
                 "Initialized:", authInitialized !== undefined ? authInitialized : false);

      // If we have a user, we're authenticated regardless of other states
      if (currentUser) {
        console.log("User found - setting auth checked");
        setAuthChecked(true);
        return;
      }

      // If auth is fully initialized or loading is definitely complete
      const isAuthReady = authInitialized !== undefined ? authInitialized : !isLoading;
      const isLoaded = firebaseLoading !== undefined ? !firebaseLoading : !isLoading;
      
      if (isAuthReady || isLoaded || loadingTimeout) {
        if (!currentUser) {
          console.log("No user found - redirecting to login");
          // No user after Firebase has initialized, redirect to login
          router.push(`/login?redirect=/profile/${id}`);
        } else {
          console.log("Auth check complete - user authenticated");
          // User is authenticated, mark as checked
          setAuthChecked(true);
        }
      } else if (authRetryCount < 5) {
        // Exponential backoff for retries (0.5s, 1s, 2s, 4s, 8s)
        const delay = Math.pow(2, authRetryCount) * 500;
        console.log(`Auth not ready, retry in ${delay}ms (attempt ${authRetryCount + 1}/5)`);
        
        // Increment retry count and try again after delay
        setAuthRetryCount(prev => prev + 1);
        authTimer = setTimeout(checkAuth, delay);
      } else {
        // Max retries reached, redirect to login as fallback
        console.log("Max auth retries reached, redirecting to login");
        router.push(`/login?redirect=/profile/${id}`);
      }
    };

    // Start the auth check process
    checkAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (authTimer) clearTimeout(authTimer);
    };
  }, [currentUser, firebaseLoading, isLoading, authInitialized, router, id, authRetryCount, loadingTimeout]);

  // Load user data only after authentication is confirmed
  const loadUserData = useCallback(async () => {
    if (!authChecked && !loadingTimeout) {
      console.log("Auth not checked yet, skipping data load");
      return;
    }
    
    // If we're in a timeout situation but have currentUser, proceed
    if (!currentUser && !sessionStorage.getItem('firebase_user') && !loadingTimeout) {
      console.log("No authenticated user, skipping data load");
      return;
    }

    console.log("Loading profile data for user:", id);
    setLoading(true);
    setError(null);
    try {
      // Check if we're viewing the current user's profile and use that data if available
      let userData;
      if (currentUser && id === currentUser.id) {
        console.log("Using currentUser data for profile:", currentUser);
        userData = currentUser;
      } else {
        // Load user data from database
        userData = await getUserById(id);
      }
      
      console.log("User data loaded:", userData);
      
      if (!userData) {
        setError('User not found');
        return;
      }
      
      // Make sure the user has a name property
      if (!userData.name && userData.displayName) {
        userData.name = userData.displayName;
      }
      
      // Add fallback for name if it's still missing
      if (!userData.name) {
        console.warn("User name is missing, using email or fallback");
        userData.name = userData.email ? userData.email.split('@')[0] : "User " + userData.id.substring(0, 4);
      }
      
      setUser(userData);
      console.log("User set to:", userData);

      // Important: Load data in sequence and capture it in local variables first
      console.log("======= LOADING USER SERVICES AND MATCHES =======");
      console.log("Current auth state:", { 
        currentUser: currentUser?.id, 
        isAuthenticated: !!currentUser,
        authInitialized
      });
      
      try {
        // Load services - these are public and can be loaded for anyone
        const userServices = await getServicesByUserId(id);
        console.log("Loaded services count:", userServices?.length || 0);
        setServices(userServices || []);
        
        // For matches, only load them if this is the current user's profile
        let userMatches = [];
        if (currentUser && id === currentUser.id) {
          // Only load matches for the current user's own profile
          console.log("Loading matches for current user's profile");
          userMatches = await getUserMatches(id);
          console.log("MATCH LOADING COMPLETE - Received matches:", userMatches?.length || 0);
          
          // Calculate stats here, with the userMatches that we just loaded
          const matchesCompleted = userMatches.filter(m => m.status === "completed").length;
          const hasRequesterProviderCompleted = userMatches.filter(m => 
            m.requesterCompleted && m.providerCompleted
          ).length;
          
          console.log("Stats from loaded matches:", {
            matchesCompleted,
            hasRequesterProviderCompleted,
            userCompletedMatches: userData.completedMatches || 0
          });
        } else {
          // For other users' profiles, don't load matches (security rules would deny it anyway)
          console.log("Viewing another user's profile - not loading their matches");
          userMatches = [];
        }
        
        // Set matches state
        setMatches(userMatches);
      } catch (loadError) {
        console.error("Error loading data:", loadError);
        setServices([]);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [authChecked, currentUser, getUserById, getServicesByUserId, getUserMatches, id, loadingTimeout]);

  // Load user data once authentication is confirmed
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Show loading state while authentication or data is loading
  // Add a timeout escape hatch
  if ((!authInitialized && !loadingTimeout) || (firebaseLoading && !loadingTimeout) || (authChecked && loading && !loadingTimeout)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
        <div className="text-gray-500 dark:text-gray-400">
          {!authInitialized ? "Verifying authentication..." : "Loading profile..."}
        </div>
        {loadingTimeout && (
          <div className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
            Taking longer than expected...
          </div>
        )}
      </div>
    );
  }

  // If we're in a timeout state, try to render content if we have user data
  if (loadingTimeout && !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 dark:text-red-400 mb-3">
          Loading took too long.
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Don't show error or 404 until auth is checked (prevents flashing errors during login)
  if (authChecked || loadingTimeout) {
    if (error) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-red-500 dark:text-red-400">Error: {error}</div>
        </div>
      );
    }

    if (!user) {
      return notFound();
    }
  }

  // Calculate stats
  const stats = {
    servicesOffered: services.filter(s => s.type === "offering" && s.status !== "deleted").length,
    servicesRequested: services.filter(s => s.type === "request" && s.status !== "deleted").length,
    matchesCompleted: matches.filter(m => m.status === "completed").length,
    rating: user?.rating || "⭐ Coming Soon",
    memberSince: user?.createdAt 
      ? formatDate(user.createdAt, 'MMMM yyyy')
      : formatDate(new Date(), 'MMMM yyyy')
  };

  // Filter matches based on status
  const filteredMatches = matches.filter(m => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'wanted' && m.status === 'wanted') return true;
    if (statusFilter === 'in-progress' && m.status === 'in-progress') return true;
    if (statusFilter === 'completed' && m.status === 'completed') return true;
    return false;
  });

  // Only render the profile if authentication is confirmed and user data is loaded
  if (!authChecked || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-4xl text-indigo-500 dark:text-indigo-300 uppercase font-semibold border-4 border-white dark:border-gray-700 shadow-lg">
                {user.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Member since {stats.memberSince}
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-gray-900 dark:text-white font-medium">
                    {typeof stats.rating === 'number' ? stats.rating : '⭐ Coming Soon'}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400">{stats.matchesCompleted} services completed</span>
                </div>
              </div>
            </div>
            {id === currentUserId && (
              <div className="flex-shrink-0">
                <Link
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.servicesOffered}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Services Offered</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.servicesRequested}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Services Requested</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.matchesCompleted}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Matches Completed</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-sm md:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {typeof stats.rating === 'number' ? stats.rating : 'Coming Soon'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <nav className="flex divide-x divide-gray-200 dark:divide-gray-700">
            <button
              onClick={() => setActiveTab("services")}
              className={`flex-1 px-4 py-4 text-sm font-medium text-center ${
                activeTab === "services"
                  ? "text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-700/50"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Services
            </button>
            
            {/* Only show matches tab on current user's profile */}
            {currentUser && id === currentUser.id && (
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 px-4 py-4 text-sm font-medium text-center ${
                  activeTab === "matches"
                    ? "text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-700/50"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Matches
              </button>
            )}
            
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 px-4 py-4 text-sm font-medium text-center ${
                activeTab === "reviews"
                  ? "text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-700/50"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services
              .filter(service => service.status !== 'deleted')
              .map(service => (
                <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.type === "offering"
                          ? "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                      }`}>
                        {service.type === "offering" ? "Offering" : "Request"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {service.createdAt 
                          ? formatDate(service.createdAt, 'MMM d, yyyy')
                          : service.created
                            ? formatDate(service.created, 'MMM d, yyyy')
                            : 'Unknown date'}
                      </span>
                    </div>
                    <Link href={`/services/${service.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150">
                        {service.title}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "matches" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Status filter tabs */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('wanted')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    statusFilter === 'wanted'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('in-progress')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    statusFilter === 'in-progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Matches list */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMatches.map(match => (
                <div key={match.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      match.status === 'wanted'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                        : match.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                    }`}>
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {match.createdAt 
                        ? formatDate(match.createdAt, 'MMM d, yyyy')
                        : 'Unknown date'}
                    </span>
                  </div>
                  <Link href={`/matches/${match.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150">
                      {match.title || 'Match Details'}
                    </h3>
                  </Link>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {match.description || 'No description available'}
                  </p>
                </div>
              ))}
              {filteredMatches.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No matches found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Reviews coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 