"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "../../utils/dateUtils";
import Chat from "../../components/Chat";
import { useMockData } from "../../utils/mockDataContext";

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCompleted, setUserCompleted] = useState(false);
  const [otherUserCompleted, setOtherUserCompleted] = useState(false);
  
  // Use our mock data context
  const { 
    getMatchById, 
    getServiceById, 
    getUserById, 
    sendMessage: sendContextMessage, 
    updateMatchStatus,
    updateMatchCompletion,
    getMatchCompletionForUser
  } = useMockData();

  // Mock current user ID (in a real app, this would come from authentication)
  const currentUserId = "user1";

  // Find the match from mock data
  useEffect(() => {
    // Strip any encoding or special characters from the ID
    const cleanId = decodeURIComponent(id).replace(/^match/, 'match');
    
    const matchData = getMatchById(cleanId);
    
    if (matchData) {
      setMatch(matchData);
      setMessages(matchData.messages || []);
      
      // Get completion statuses
      const isRequester = currentUserId === matchData.requesterId;
      setUserCompleted(isRequester ? matchData.requesterCompleted : matchData.providerCompleted);
      setOtherUserCompleted(isRequester ? matchData.providerCompleted : matchData.requesterCompleted);
    }
    setLoading(false);
  }, [id, getMatchById, currentUserId]);

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If match not found, show 404
  if (!match) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
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
            Back to Dashboard
          </Link>
        </div>
        
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Match not found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The match you're looking for doesn't exist or has been removed.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find the service
  const service = getServiceById(match.serviceId);

  // Get users
  const requester = getUserById(match.requesterId);
  const provider = getUserById(match.providerId);

  // Determine if current user is requester or provider
  const isRequester = currentUserId === match.requesterId;
  const currentUser = isRequester ? requester : provider;
  const otherUser = isRequester ? provider : requester;

  const handleSendMessage = (newMessage) => {
    // Use context function to add message
    sendContextMessage(match.id, currentUserId, newMessage.content);
    
    // Update local state for immediate UI update
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
  };

  const handleToggleCompletion = () => {
    // Toggle the current user's completion status
    const newCompletionStatus = !userCompleted;
    
    // Update context
    updateMatchCompletion(match.id, currentUserId, newCompletionStatus);
    
    // Update local state
    setUserCompleted(newCompletionStatus);
    
    // If both users have now completed, update the match status
    if (newCompletionStatus && otherUserCompleted) {
      // Both users have completed - update local state to reflect completed status
      setMatch(prev => ({
        ...prev,
        status: "completed",
        lastUpdated: new Date().toISOString()
      }));
    } else if (match.status === "completed" && !newCompletionStatus) {
      // User unmarked completion, move back to in-progress
      setMatch(prev => ({
        ...prev,
        status: "in-progress",
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  const handleCancel = () => {
    // Update match status to cancelled
    updateMatchStatus(match.id, "cancelled");
    
    // Update local state
    setMatch(prev => ({
      ...prev,
      status: "cancelled",
      lastUpdated: new Date().toISOString()
    }));
  };

  // Format status text
  const formatStatus = (status) => {
    switch (status) {
      case "wanted":
        return "Pending Confirmation";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Get status color class
  const getStatusClass = () => {
    switch (match.status) {
      case "wanted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/dashboard"
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
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass()}`}
              >
                {formatStatus(match.status)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                In-App Chat
              </span>
              
              {/* Show completion status badges */}
              {userCompleted && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  You marked as complete
                </span>
              )}
              
              {otherUserCompleted && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {otherUser?.name || "Other user"} marked as complete
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Match created: {formatDateTime(new Date(match.created))}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {service?.title || "Service not found"}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {service?.description || "No description available"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Requester
              </h3>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
                  {requester?.name.charAt(0) || "?"}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {requester?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rating: {requester?.rating || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Provider
              </h3>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
                  {provider?.name.charAt(0) || "?"}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {provider?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rating: {provider?.rating || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {match.status !== "cancelled" && (
            <div className="flex justify-end space-x-4">
              <button 
                onClick={handleToggleCompletion}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  userCompleted
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-green-600 hover:bg-green-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150`}
              >
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={userCompleted ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"}
                  />
                </svg>
                {userCompleted ? "Unmark Complete" : "Mark as Complete"}
              </button>

              {match.status !== "completed" && (
                <button 
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel Match
                </button>
              )}
            </div>
          )}
          
          {/* Show explanation of completion status */}
          {(userCompleted || otherUserCompleted) && match.status !== "completed" && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 rounded-md text-sm">
              <p>
                <span className="font-semibold">Note:</span> This match will be marked as completed when both users mark it as complete.
                {otherUserCompleted && !userCompleted && " Please mark the match as complete if the service has been fulfilled."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-[600px]">
        <Chat
          matchId={match.id}
          currentUserId={currentUserId}
          currentUser={currentUser}
          otherUser={otherUser}
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          isDisabled={match.status === "completed" || match.status === "cancelled"}
        />
      </div>
    </div>
  );
}
