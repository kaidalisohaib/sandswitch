"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ServiceCard from "../components/ServiceCard";
import MatchCard from "../components/MatchCard";
import MessagesTab from "./messages";
import MatchesTab from "./matches";
import { useFirebase } from "../utils/firebaseContext";
import { formatDistanceToNow } from "date-fns";
import { formatTimeAgo, normalizeTimestamp } from "../utils/dateUtils";

// Create a separate component that uses useSearchParams
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tab);

  // Update URL when tab changes
  useEffect(() => {
    const newUrl = `/dashboard${activeTab === "overview" ? "" : `?tab=${activeTab}`}`;
    router.push(newUrl);
  }, [activeTab, router]);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [matches, setMatches] = useState([]);
  const [userCache, setUserCache] = useState(new Map());

  // Use Firebase context for data
  const {
    getUserById,
    currentUser,
    getServicesByUserId,
    getUserMatches,
    getServiceById,
    isLoading: firebaseLoading,
  } = useFirebase();

  // Set a fallback user ID for development if currentUser is not available
  const currentUserId = currentUser?.id || null;

  // Fetch data when component mounts
  useEffect(() => {
    // Only redirect if we're sure the authentication is fully loaded and user is not authenticated
    let authCheckTimeout;
    
    if (!firebaseLoading && !currentUser) {
      // Add a short delay to ensure Firebase has time to restore auth state from local storage
      authCheckTimeout = setTimeout(() => {
        // Double-check the auth state before redirecting
        if (!currentUser) {
          console.log('User not authenticated, redirecting from dashboard to login');
          router.push("/login?redirect=/dashboard");
        }
      }, 1000); // Wait for 1 second before redirecting
      return;
    }
    
    async function fetchData() {
      setLoading(true);
      try {
        // Get user matches
        const userMatches = await getUserMatches(currentUserId);
        
        // Get user services and services associated with matches
        const [userOwnedServices, matchServices] = await Promise.all([
          getServicesByUserId(currentUserId),
          Promise.all((userMatches || []).map(match => 
            match.serviceId ? getServiceById(match.serviceId) : null
          ))
        ]);

        // Store user's own services separately for clarity
        const ownedServices = [...(userOwnedServices || [])];
        
        // Combine all services for displaying in match context 
        const allServices = [...ownedServices];
        matchServices.forEach(service => {
          if (service && !allServices.some(s => s.id === service.id)) {
            allServices.push(service);
          }
        });
        
        // Log services for debugging
        console.log('Services count breakdown:', {
          ownedByUser: ownedServices.length,
          fromMatches: matchServices.filter(Boolean).length,
          total: allServices.length
        });
        
        // Log services where userId doesn't match currentUserId for debugging
        const nonOwnedServices = allServices.filter(s => s.userId !== currentUserId);
        if (nonOwnedServices.length > 0) {
          console.log('Found services not owned by current user:', 
            nonOwnedServices.map(s => ({ id: s.id, title: s.title, userId: s.userId }))
          );
        }
        
        // Log deleted services for debugging
        const deletedServices = allServices.filter(s => s.status === "deleted");
        if (deletedServices.length > 0) {
          console.log('Found deleted services:', 
            deletedServices.map(s => ({ id: s.id, title: s.title, userId: s.userId, status: s.status }))
          );
        }
        
        // Build a list of all unique user IDs that need to be fetched
        const userIdsToFetch = new Set();
        userMatches.forEach(match => {
          // Add other user (requester or provider) to the list
          if (match.requesterId && match.requesterId !== currentUserId) {
            userIdsToFetch.add(match.requesterId);
          }
          if (match.providerId && match.providerId !== currentUserId) {
            userIdsToFetch.add(match.providerId);
          }
        });
        
        console.log('Fetching user data for:', [...userIdsToFetch]);
        
        // Fetch all user data in parallel
        if (userIdsToFetch.size > 0) {
          const userPromises = [...userIdsToFetch].map(userId => getUserById(userId));
          const userResults = await Promise.all(userPromises);
          
          // Build a new Map to update the cache
          const newCache = new Map(userCache);
          
          // Add each user to the cache
          [...userIdsToFetch].forEach((userId, index) => {
            if (userResults[index]) {
              newCache.set(userId, userResults[index]);
            }
          });
          
          // Update the cache state
          setUserCache(newCache);
        }
        
        // For matches, add normalized timestamps for sorting
        const matchesWithTimestamps = userMatches.map(match => {
          // Try to extract the timestamp from the last message
          let lastUpdateTime = match.updatedAt || match.createdAt;
          if (match.messages && match.messages.length > 0) {
            const lastMessage = match.messages[match.messages.length - 1];
            if (lastMessage.timestamp) {
              lastUpdateTime = lastMessage.timestamp;
            }
          }
          
          return {
            ...match,
            normalizedTimestamp: normalizeTimestamp(lastUpdateTime)
          };
        });
        
        setMatches(matchesWithTimestamps || []);
        setServices(allServices);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchData();
    }
    
    return () => {
      // Clear the timeout if the component unmounts or dependencies change
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, [currentUser, currentUserId, firebaseLoading, getUserMatches, getServicesByUserId, getServiceById, router]);

  // Get current user
  const currentUserMemo = useMemo(() => {
    return currentUser;
  }, [currentUser]);

  // Filter services created by the current user
  const userServices = useMemo(() => {
    if (!services || !currentUserId) return [];
    // Only include services where the current user is the owner AND the service is not deleted
    return services.filter(service => 
      service.userId === currentUserId && service.status !== "deleted"
    );
  }, [services, currentUserId]);

  // Filter matches involving the current user
  const userMatches = useMemo(() => {
    if (!matches || !currentUserId) return [];
    return matches;
  }, [matches, currentUserId]);

  // Group matches by status
  const matchesByStatus = useMemo(() => {
    return {
      active: userMatches.filter((m) => m.status === "in-progress"),
      pending: userMatches.filter((m) => m.status === "wanted"),
      completed: userMatches.filter((m) => m.status === "completed"),
      cancelled: userMatches.filter((m) => m.status === "cancelled"),
    };
  }, [userMatches]);

  // Active tab in your services section
  const [activeServicesTab, setActiveServicesTab] = useState("offering");

  // Filter services based on active tab
  const filteredServices = useMemo(() => {
    if (!userServices) return [];

    // userServices already excludes deleted services, so we only need to filter by type
    if (activeServicesTab === "offering") {
      return userServices.filter((s) => s.type === "offering");
    } else {
      return userServices.filter((s) => s.type === "request");
    }
  }, [userServices, activeServicesTab]);

  // Calculate service stats
  const serviceStats = useMemo(() => {
    if (!services) return { offering: 0, request: 0, active: 0, completed: 0 };

    // Filter out deleted services
    const activeServices = services.filter((s) => s.status !== "deleted");

    return {
      offering: activeServices.filter(
        (s) => s.type === "offering" && s.userId === currentUserId
      ).length,
      request: activeServices.filter(
        (s) => s.type === "request" && s.userId === currentUserId
      ).length,
      active: activeServices.filter(
        (s) => s.status === "active" && s.userId === currentUserId
      ).length,
      completed: activeServices.filter(
        (s) => s.status === "completed" && s.userId === currentUserId
      ).length,
    };
  }, [services, currentUserId]);

  // Function to handle service deletion
  const handleServiceDelete = (serviceId) => {
    setServices((prevServices) =>
      prevServices.filter((service) => service.id !== serviceId)
    );
  };

  // Show loading state
  if (loading || firebaseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header with user info and quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center p-4 sm:p-6">
          <div className="flex-shrink-0 mb-4 md:mb-0 flex items-center justify-center md:justify-start">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl sm:text-2xl text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
              {currentUser?.name?.charAt(0) || "?"}
            </div>
            <div className="ml-4 sm:ml-6 md:border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {currentUser?.name || "User"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Member since{" "}
                {currentUser?.createdAt
                  ? new Date(
                      currentUser.createdAt.seconds * 1000
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 md:gap-8 md:ml-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {userServices.filter(s => s.status !== "deleted").length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Services
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {matchesByStatus.active.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Active Matches
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {matchesByStatus.pending.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Pending
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {matchesByStatus.completed.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Completed
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 md:ml-auto flex justify-center md:justify-end">
            <div className="flex gap-2 sm:gap-3">
              <Link
                href="/create"
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg
                  className="h-4 w-4 mr-1 sm:mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">New</span> Service
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4 mr-1 sm:mr-1.5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="sm:hidden">
          <select
            onChange={(e) => setActiveTab(e.target.value)}
            value={activeTab}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          >
            <option value="overview">Overview</option>
            <option value="services">Your Services</option>
            <option value="matches">Your Matches</option>
            <option value="messages">Messages</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`${
                  activeTab === "services"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Your Services
              </button>
              <button
                onClick={() => setActiveTab("matches")}
                className={`${
                  activeTab === "matches"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Your Matches
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`${
                  activeTab === "messages"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Messages
                {userMatches.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium dark:bg-indigo-900 dark:text-indigo-200">
                    {userMatches.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Dashboard Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 sm:space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-3">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Offering
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {serviceStats.offering}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-3">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Requests
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {serviceStats.request}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-3">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {matchesByStatus.active.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-3">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {matchesByStatus.completed.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userMatches.length > 0 ? (
                userMatches
                  .sort((a, b) => {
                    // Sort using the normalized timestamps
                    const dateA = a.normalizedTimestamp || new Date(0);
                    const dateB = b.normalizedTimestamp || new Date(0);
                    return dateB - dateA;
                  })
                  .slice(0, 5)
                  .map((match) => {
                    // Find service in services array, ensuring we check both id formats
                    const service = services.find(
                      (s) => s.id === match.serviceId || s.id === match.service
                    );
                    const otherUserId =
                      match.requesterId === currentUserId
                        ? match.providerId
                        : match.requesterId;
                    
                    // Get user from cache
                    const otherUser = userCache.get(otherUserId);
                    
                    // Generate a display name with fallbacks
                    const otherUserName = otherUser
                      ? (otherUser.name || otherUser.displayName || (otherUser.email ? otherUser.email.split('@')[0] : `User ${otherUserId.substring(0, 4)}`))
                      : `User ${otherUserId ? otherUserId.substring(0, 4) : '?'}`;
                    
                    const isRequester = match.requesterId === currentUserId;
                    const lastMessage =
                      match.messages?.length > 0
                        ? match.messages[match.messages.length - 1]
                        : null;

                    // Debug log to help identify service matching issues
                    if (!service) {
                      console.debug('Service not found:', {
                        matchServiceId: match.serviceId,
                        matchService: match.service,
                        availableServiceIds: services.map(s => s.id)
                      });
                    }

                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
                                {otherUserName.charAt(0) || "?"}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {otherUserName}
                                  </h4>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                                    •
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      match.status === "completed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                        : match.status === "in-progress"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                                        : match.status === "wanted"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                    }`}
                                  >
                                    {match.status === "wanted"
                                      ? "Pending"
                                      : match.status === "in-progress"
                                      ? "Active"
                                      : match.status === "completed"
                                      ? "Completed"
                                      : "Cancelled"}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {isRequester
                                      ? "You requested"
                                      : "You offered"}
                                    :
                                  </span>
                                  <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                                    {service?.title || "Unknown Service"}
                                  </span>
                                </div>
                                {lastMessage && (
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {lastMessage.senderId === currentUserId
                                      ? "You: "
                                      : `${otherUserName}: `}
                                    {lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(
                                  match.lastUpdated ||
                                    match.updatedAt ||
                                    match.created ||
                                    match.createdAt
                                )}
                              </span>
                              {!lastMessage && (
                                <span className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  Start conversation
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
              ) : (
                <div className="p-6 text-center">
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
                    No recent activity
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start by browsing available services or creating your own.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link
                      href="/services"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Browse Services
                    </Link>
                    <Link
                      href="/create"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Create Service
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Offer a Service
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Share your skills with the community. Create a service and start
                connecting with people who need your help.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create New Service
              </Link>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Find a Service
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Looking for help? Browse available services in your community
                and connect with people who can assist you.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Your Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Services
            </h2>
            <Link
              href="/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Service
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveServicesTab("offering")}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeServicesTab === "offering"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Offerings (
                  {
                    userServices.filter(
                      (s) => s.type === "offering"
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setActiveServicesTab("request")}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeServicesTab === "request"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Requests (
                  {
                    userServices.filter(
                      (s) => s.type === "request"
                    ).length
                  }
                  )
                </button>
              </nav>
            </div>
          </div>

          {userServices &&
          userServices.filter((s) => s.status !== "deleted").length > 0 ? (
            <div>
              {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      currentUserId={currentUserId}
                      onDelete={handleServiceDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    You don't have any{" "}
                    {activeServicesTab === "offering"
                      ? "service offerings"
                      : "service requests"}{" "}
                    yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
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
                No services yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new service.
              </p>
              <div className="mt-6">
                <Link
                  href="/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Service
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "matches" && <MatchesTab />}

      {/* Messages Tab */}
      {activeTab === "messages" && <MessagesTab />}
    </div>
  );
}

// Create a loading fallback
function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="animate-pulse">
        <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
