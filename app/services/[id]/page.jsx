"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "../../utils/dateUtils";
import UserProfileCard from "../../components/UserProfileCard";
import { useFirebase } from "../../utils/firebaseContext";

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [service, setService] = useState(null);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use our Firebase context
  const { 
    getServiceById, 
    getUserById, 
    createMatch, 
    sendMessage,
    getUserMatches,
    currentUser,
    isLoading,
    deleteService
  } = useFirebase();

  // Get current user ID from context
  const currentUserId = currentUser?.id;

  // Load data
  useEffect(() => {
    async function loadData() {
      if (isLoading) return;
      
      try {
        // Get service data
        const serviceData = await getServiceById(id);
        
        if (serviceData) {
          setService(serviceData);
          
          // Get user info
          const userData = await getUserById(serviceData.userId);
          setUser(userData);
          
          // Get all matches for this service if user is logged in
          if (currentUserId) {
            const userMatches = await getUserMatches(currentUserId);
            const serviceMatches = userMatches.filter(m => m.serviceId === id);
            setMatches(serviceMatches);
            
            // Fetch user data for each match
            if (serviceMatches.length > 0) {
              const userIds = new Set();
              serviceMatches.forEach(match => {
                if (match.requesterId !== currentUserId) userIds.add(match.requesterId);
                if (match.providerId !== currentUserId) userIds.add(match.providerId);
              });
              
              const userPromises = Array.from(userIds).map(userId => getUserById(userId));
              const userData = await Promise.all(userPromises);
              setUsers(userData.filter(u => u)); // Filter out any null values
            }
          }
        }
      } catch (err) {
        console.error("Error loading service data:", err);
        setError("Failed to load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, getServiceById, getUserById, getUserMatches, currentUserId, isLoading]);

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If service not found, show 404
  if (!service) {
    return notFound();
  }

  // Determine if this is an offering or request
  const isOffering = service.type === "offering";
  const isOwnService = service.userId === currentUserId;

  // Get match summary info
  const matchSummary = {
    total: matches.length,
    active: matches.filter(m => m.status === 'in-progress').length,
    pending: matches.filter(m => m.status === 'wanted').length,
    completed: matches.filter(m => m.status === 'completed').length
  };

  // Determine the tag styling based on service type
  const tagClass = isOffering
    ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

  // Format created date
  const createdDate = formatDate(service.created, 'PPp');

  // Determine if user can contact the service provider/requester
  const canContact = currentUserId && 
                     currentUserId !== service.userId &&
                     service.status !== 'deleted';

  // Determine if user can delete the service
  const canDelete = currentUserId === service.userId;

  const handleContactRequest = async (e) => {
    e.preventDefault();
    
    // Set loading state
    setIsSubmitting(true);
    
    try {
      // Check if service is deleted or inactive
      if (service.status === 'deleted') {
        setIsSubmitting(false);
        setError("This service is no longer available.");
        return;
      }
      
      // Check message length
      const MAX_MESSAGE_LENGTH = 1000;
      if (message.length > MAX_MESSAGE_LENGTH) {
        setIsSubmitting(false);
        setError(`Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`);
        return;
      }
      
      // Create a new match
      const matchData = {
        serviceId: service.id,
        // If service is an offering, currentUser is requester. Otherwise, currentUser is provider
        requesterId: isOffering ? currentUserId : service.userId,
        providerId: isOffering ? service.userId : currentUserId,
      };
      
      // Check if user already has active matches for this service
      const userMatches = await getUserMatches(currentUserId);
      const serviceMatches = userMatches.filter(match => match.serviceId === service.id);
      
      // Check if there are any matches that are not completed or cancelled
      const existingActiveMatch = serviceMatches.find(match => 
        !['completed', 'cancelled'].includes(match.status)
      );
      
      if (existingActiveMatch) {
        setIsSubmitting(false);
        setError("You already have an active match for this service. Please complete or cancel it before creating a new one.");
        return;
      }
      
      console.log("Creating match with data:", matchData);
      
      // Create the match
      const result = await createMatch(
        matchData.serviceId,
        matchData.requesterId,
        matchData.providerId
      );
      
      // Check if match creation was successful
      if (!result.success) {
        setIsSubmitting(false);
        setError(result.error || "Failed to create match. Please try again.");
        return;
      }
      
      console.log("Match created with ID:", result.matchId);
      
      // If there's a message, send it
      if (message.trim()) {
        console.log(`Sending initial message to match ${result.matchId}`);
        await sendMessage(result.matchId, currentUserId, message);
      }
      
      // Reset form and show success
      setIsSubmitting(false);
      setShowContactModal(false);
      setShowSuccessMessage(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        setShowSuccessMessage(false);
        if (result.matchId) {
          console.log(`Redirecting to match ${result.matchId}...`);
          router.push(`/matches/${result.matchId}`);
        } else {
          console.log("No valid match ID, redirecting to dashboard");
          router.push('/dashboard');
        }
      }, 3000);
    } catch (err) {
      console.error("Error creating match:", err);
      setError("An error occurred while creating the match. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await deleteService(id);
      if (result.success) {
        // Redirect immediately on successful deletion
        router.push('/services');
      } else {
        setError(result.error || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "wanted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/services"
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Services
        </Link>
      </div>

      {/* Check for login status and display appropriate action buttons */}
      {!currentUserId && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                You need to be logged in to interact with this service.
              </p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <Link
                  href={`/login?redirect=/services/${id}`}
                  className="whitespace-nowrap font-medium text-yellow-700 hover:text-yellow-600 dark:text-yellow-200 dark:hover:text-yellow-100"
                >
                  Login now <span aria-hidden="true">&rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Match created successfully! Redirecting to chat...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagClass}`}>
                {isOffering ? "Offering" : "Request"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {service.category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(service.status)}`}>
                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </span>
              {isOwnService && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
                  Your Service
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Posted on {createdDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {service.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
            {service.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {service.tags.map((tag) => (
              <Link
                key={tag}
                href={`/services?tag=${tag}`}
                className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition duration-150"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="flex items-center mb-6">
            <svg
              className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">
              {service.location}
            </span>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 mb-6" />

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isOffering ? "Service Provider" : "Requester"}
            </h2>

            {currentUserId ? (
              <UserProfileCard user={user} />
            ) : (
              <div className="bg-indigo-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-indigo-100 dark:border-gray-700 flex items-center justify-center text-2xl text-gray-400 dark:text-gray-500">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        View Full Profile Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Sign in to see the provider's profile, rating, and service history
                      </p>
                      <div className="pt-2">
                        <Link
                          href={`/login?redirect=/services/${id}`}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login to View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Match Section */}
          {isOwnService ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Matches ({matchSummary.total})
              </h2>
              
              {matchSummary.total > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {matchSummary.active > 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge('in-progress')}`}>
                        {matchSummary.active} Active
                      </span>
                    )}
                    {matchSummary.pending > 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge('wanted')}`}>
                        {matchSummary.pending} Pending
                      </span>
                    )}
                    {matchSummary.completed > 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge('completed')}`}>
                        {matchSummary.completed} Completed
                      </span>
                    )}
                    {matches.some(m => m.status === 'cancelled') && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge('cancelled')}`}>
                        {matches.filter(m => m.status === 'cancelled').length} Cancelled
                      </span>
                    )}
                  </div>

                  {/* Active/Pending Matches */}
                  {(matchSummary.active > 0 || matchSummary.pending > 0) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Active & Pending Matches
                      </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                        {matches.filter(m => ['wanted', 'in-progress'].includes(m.status)).map(match => {
                        try {
                          const otherUserId = match.requesterId === currentUserId ? match.providerId : match.requesterId;
                          const otherUser = users.find(u => u?.id === otherUserId);
                          const lastMessage = match.messages?.[match.messages.length - 1];
                          
                          return (
                            <Link
                              key={match.id}
                              href={`/matches/${match.id}`}
                              className="block p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-medium">
                                    {otherUser?.name?.charAt(0) || "?"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {otherUser?.name || "Unknown User"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {lastMessage ? (
                                        <span className="line-clamp-1">{lastMessage.content}</span>
                                      ) : (
                                        "No messages yet"
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                                  {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                                </span>
                              </div>
                            </Link>
                          );
                        } catch (error) {
                          console.error("Error rendering match:", error);
                          return null; // Skip this match if there's an error
                        }
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed/Cancelled Matches */}
                  {(matchSummary.completed > 0 || matches.some(m => m.status === 'cancelled')) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Past Matches
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                        {matches.filter(m => ['completed', 'cancelled'].includes(m.status)).map(match => {
                          try {
                            const otherUserId = match.requesterId === currentUserId ? match.providerId : match.requesterId;
                            const otherUser = users.find(u => u?.id === otherUserId);
                            const lastMessage = match.messages?.[match.messages.length - 1];
                            
                            return (
                              <Link
                                key={match.id}
                                href={`/matches/${match.id}`}
                                className="block p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-medium">
                                      {otherUser?.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {otherUser?.name || "Unknown User"}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {lastMessage ? (
                                          <span className="line-clamp-1">{lastMessage.content}</span>
                                        ) : (
                                          "No messages yet"
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                                  </span>
                                </div>
                              </Link>
                            );
                          } catch (error) {
                            console.error("Error rendering match:", error);
                            return null; // Skip this match if there's an error
                          }
                        })}
                      </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No matches yet. When someone contacts you about this service, they'll appear here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // For non-service owners
            <>
              {/* Active Matches Section */}
              {matches.some(match => ['wanted', 'in-progress'].includes(match.status)) && (
            <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Active Matches
                  </h2>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                      <div className="ml-3 w-full">
                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                          You have active {matches.filter(m => ['wanted', 'in-progress'].includes(m.status)).length > 1 ? 'matches' : 'a match'} for this service
                    </h3>
                    <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                          <div className="mt-3 space-y-2">
                            {matches.filter(m => ['wanted', 'in-progress'].includes(m.status)).map(match => (
                              <Link
                                key={match.id}
                                href={`/matches/${match.id}`}
                                className="block px-3 py-2 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(match.created, 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Past Matches Section - Only show if there are completed or cancelled matches */}
              {matches.some(match => ['completed', 'cancelled'].includes(match.status)) && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Past Matches
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 w-full">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Past match history
                        </h3>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="mt-3 space-y-2">
                            {matches.filter(match => ['completed', 'cancelled'].includes(match.status)).map(match => (
                          <Link
                            key={match.id}
                            href={`/matches/${match.id}`}
                            className="block px-3 py-2 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(match.created, 'MMM d, yyyy')}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              )}
            </>
          )}

          {/* Contact area */}
          {service.status === 'deleted' ? (
            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-300 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Service no longer available</h3>
                  <div className="mt-2 text-sm">
                    <p>This service has been removed by the provider and is no longer available.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interested in this service?</h2>
              
              {isOwnService ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This is your service. You can edit or delete it from the dashboard.
                  </p>
                  
                  <div className="mt-4 flex space-x-4">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete Service
                    </button>
                  </div>
                </div>
              ) : matches.some(match => ['wanted', 'in-progress'].includes(match.status)) ? (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    You already have an active match with this service.
                  </p>
                  <button
                    onClick={() => router.push(`/matches/${matches.find(m => ['wanted', 'in-progress'].includes(m.status)).id}`)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Match
                  </button>
                </div>
              ) : !currentUserId ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Please log in to contact this {isOffering ? "service provider" : "requester"}.
                  </p>
                  <Link
                    href={`/login?redirect=/services/${id}`}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Log In
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Contact {isOffering ? "Provider" : "Requester"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowContactModal(false)}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Contact about this service
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send a message to start the conversation about this service.
                      </p>
                    </div>
                    
                    {/* Display error if present */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
                        <div className="flex">
                          <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleContactRequest} className="mt-4">
                      <textarea
                        id="message"
                        name="message"
                        rows="4"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Write a message to introduce yourself..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      ></textarea>
                      
                      {/* Character counter */}
                      <div className="mt-1 flex justify-end">
                        <span 
                          className={`text-xs ${
                            message.length > 1000 
                              ? 'text-red-500 dark:text-red-400'
                              : message.length > 900
                                ? 'text-amber-500 dark:text-amber-400' 
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {message.length}/1000
                        </span>
                      </div>
                      
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </span>
                          ) : (
                            "Send Message"
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={() => setShowContactModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteModal(false)}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Service
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this service? This action cannot be undone.
                        {matches.length > 0 && (
                          <span className="block mt-2 text-red-600 dark:text-red-400">
                            Note: This will also delete any non-completed matches associated with this service.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
