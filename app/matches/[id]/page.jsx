"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "../../utils/dateUtils";
import Chat from "../../components/Chat";
import { useFirebase } from "../../utils/firebaseContext";

const MatchProgress = ({
  match,
  currentUserId,
  onUpdateStart,
  onUpdateComplete,
  requester,
  provider
}) => {
  console.log("MatchProgress rendering:", { 
    matchId: match?.id, 
    status: match?.status,
    hasRequesterStarted: match?.requesterStarted,
    hasProviderStarted: match?.providerStarted 
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isRequester = currentUserId === match.requesterId;
  const hasStarted = isRequester
    ? match.requesterStarted
    : match.providerStarted;
  const otherHasStarted = isRequester
    ? match.providerStarted
    : match.requesterStarted;
  const hasCompleted = isRequester
    ? match.requesterCompleted
    : match.providerCompleted;
  const otherHasCompleted = isRequester
    ? match.providerCompleted
    : match.requesterCompleted;

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const getStatusInfo = () => {
    switch (match.status) {
      case "wanted":
        return {
          title: "Awaiting Start",
          description: hasStarted
            ? "Waiting for the other user to start"
            : "Click to start the match",
          action: hasStarted ? "Undo Start" : "Start Match",
          bothStarted: otherHasStarted && hasStarted,
          canProgress: !hasStarted,
          color: "yellow",
        };
      case "in-progress":
        return {
          title: "In Progress",
          description: hasCompleted
            ? "Waiting for the other user to complete"
            : "Click to mark as completed",
          action: hasCompleted ? "Undo Complete" : "Mark as Completed",
          bothCompleted: otherHasCompleted && hasCompleted,
          canProgress: true,
          color: "blue",
        };
      case "completed":
        return {
          title: "Completed",
          description: "This match has been completed",
          color: "green",
        };
      case "cancelled":
        return {
          title: "Cancelled",
          description: "This match has been cancelled",
          color: "gray",
        };
      default:
        return {
          title: match.status,
          description: "Unknown status",
          color: "gray",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleProgressClick = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    triggerAnimation();
    console.log(`MatchProgress: handling click for status ${match.status}, hasStarted=${hasStarted}`);
    
    try {
      if (match.status === "wanted") {
        // Log current state before action
        console.log(`Current state before click: hasStarted=${hasStarted}, otherHasStarted=${otherHasStarted}`);
        
        // Toggle state (if false, make true; if true, make false)
        const newStartedState = !hasStarted;
        console.log(`Setting started state to: ${newStartedState}`);
        
        await onUpdateStart(newStartedState);
      } else if (match.status === "in-progress") {
        console.log(`Current state before completion: hasCompleted=${hasCompleted}`);
        await onUpdateComplete(!hasCompleted);
      }
    } catch (error) {
      console.error("Error in progress click handler:", error);
    } finally {
      // Add a small delay before resetting the processing state to avoid double-clicks
      setTimeout(() => {
        console.log("Resetting processing state");
        setIsProcessing(false);
      }, 800); // Increased from 500ms to 800ms
    }
  };

  const getProgressStepColor = (stepStatus, currentStatus) => {
    if (stepStatus === currentStatus) {
      switch (statusInfo.color) {
        case 'yellow':
          return 'bg-yellow-500 dark:bg-yellow-400 ring-4 ring-yellow-100 dark:ring-yellow-900/30';
        case 'blue':
          return 'bg-blue-500 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30';
        case 'green':
          return 'bg-green-500 dark:bg-green-400 ring-4 ring-green-100 dark:ring-green-900/30';
        case 'gray':
        default:
          return 'bg-gray-500 dark:bg-gray-400 ring-4 ring-gray-100 dark:ring-gray-900/30';
      }
    } else if (
      (stepStatus === "wanted" &&
        ["in-progress", "completed"].includes(currentStatus)) ||
      (stepStatus === "in-progress" && currentStatus === "completed")
    ) {
      return "bg-green-500 dark:bg-green-400";
    }
    return "bg-gray-200 dark:bg-gray-700";
  };

  const renderActionButton = () => {
    if (match.status === "cancelled" || match.status === "completed") {
      return null; // No action button for completed or cancelled matches
    }

    const isPending = match.status === "wanted";
    const isClickable = isPending || match.status === "in-progress";

    return (
      <button
        onClick={handleProgressClick}
        disabled={!isClickable || isProcessing}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-white font-medium text-xs sm:text-sm flex items-center justify-center transition-all duration-300 ${
          isAnimating ? "animate-pulse" : ""
        } ${
          isPending
            ? hasStarted
              ? "bg-gray-500 hover:bg-gray-600" // Already started
              : "bg-green-500 hover:bg-green-600" // Ready to start
            : hasCompleted
            ? "bg-indigo-500 hover:bg-indigo-600" // Already completed (your side)
            : "bg-green-500 hover:bg-green-600" // Ready to complete
        } ${isProcessing ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        {isProcessing ? (
          <>
            Processing
            <svg
              className="animate-spin ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </>
        ) : isPending
          ? hasStarted
            ? "Started"
            : "Click to start"
          : hasCompleted
          ? "Completion Marked"
          : "Click to mark as completed"}
      </button>
    );
  };

  // Add participant status indicators
  const renderParticipantStatus = () => {
    return (
      <div className="mt-4 sm:mt-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Participants Status
        </h4>
        <div className="flex flex-col space-y-2 sm:space-y-3">
          {/* Requester status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 uppercase font-medium text-xs sm:text-sm">
                {requester?.name?.charAt(0) || "R"}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                {requester?.name || "Requester"} <span className="text-xs text-gray-500 hidden sm:inline">(Requester)</span>
              </span>
            </div>
            <div className="flex items-center">
              {match.status === "wanted" && (
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                  match.requesterStarted 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                }`}>
                  {match.requesterStarted ? "Ready" : "Not Started"}
                </span>
              )}
              {match.status === "in-progress" && (
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                  match.requesterCompleted 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                }`}>
                  {match.requesterCompleted ? "Completed" : "In Progress"}
                </span>
              )}
            </div>
          </div>
          
          {/* Provider status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 uppercase font-medium text-xs sm:text-sm">
                {provider?.name?.charAt(0) || "P"}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                {provider?.name || "Provider"} <span className="text-xs text-gray-500 hidden sm:inline">(Provider)</span>
              </span>
            </div>
            <div className="flex items-center">
              {match.status === "wanted" && (
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                  match.providerStarted 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                }`}>
                  {match.providerStarted ? "Ready" : "Not Started"}
                </span>
              )}
              {match.status === "in-progress" && (
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                  match.providerCompleted 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                }`}>
                  {match.providerCompleted ? "Completed" : "In Progress"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
        Match Progress
      </h3>

      {/* Participant Status */}
      {renderParticipantStatus()}

      {/* Progress Steps */}
      <div className="relative mt-4 sm:mt-6">
        <div className="overflow-hidden h-1.5 sm:h-2 mb-3 sm:mb-4 text-xs flex rounded bg-gray-100 dark:bg-gray-700">
          <div
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
              isAnimating ? "animate-pulse-once" : ""
            } ${
              match.status === "wanted"
                ? "bg-yellow-500 dark:bg-yellow-400 w-1/3"
                : match.status === "in-progress"
                ? "bg-blue-500 dark:bg-blue-400 w-2/3"
                : match.status === "completed"
                ? "bg-green-500 dark:bg-green-400 w-full"
                : "bg-gray-400 dark:bg-gray-500 w-1/3"
            }`}
          ></div>
        </div>

        <div className="flex justify-between">
          <div className="relative text-center">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getProgressStepColor(
                "wanted",
                match.status
              )} mx-auto flex items-center justify-center text-white mb-1 sm:mb-2 transition-all duration-300`}
            >
              <span className="text-xs">1</span>
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
              Awaiting
            </div>
          </div>

          <div className="relative text-center">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getProgressStepColor(
                "in-progress",
                match.status
              )} mx-auto flex items-center justify-center text-white mb-1 sm:mb-2 transition-all duration-300`}
            >
              <span className="text-xs">2</span>
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
              In Progress
            </div>
          </div>

          <div className="relative text-center">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getProgressStepColor(
                "completed",
                match.status
              )} mx-auto flex items-center justify-center text-white mb-1 sm:mb-2 transition-all duration-300`}
            >
              <span className="text-xs">3</span>
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {statusInfo.title}
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {statusInfo.description}
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            {renderActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [service, setService] = useState(null);
  const [requester, setRequester] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    currentUser,
    getMatchById,
    getServiceById,
    getUserById,
    updateMatchStart,
    updateMatchCompletion,
    sendMessage,
    subscribeToMatch,
    cancelMatch,
    isLoading: firebaseLoading
  } = useFirebase();

  // Subscribe to match updates
  useEffect(() => {
    if (!id) return;

    // Keep a stable reference to the match object
    let isInitialLoad = true;
    let unsubscribe = null;

    // Only subscribe if the user is authenticated
    if (currentUser) {
      try {
        unsubscribe = subscribeToMatch(id, (updatedMatch) => {
          // Ensure match has requesterStarted and providerStarted defined
          const normalizedMatch = {
            ...updatedMatch,
            requesterStarted: updatedMatch.requesterStarted || false,
            providerStarted: updatedMatch.providerStarted || false,
            requesterCompleted: updatedMatch.requesterCompleted || false,
            providerCompleted: updatedMatch.providerCompleted || false
          };
          
          setMatch(prev => {
            // For initial load or status change, update everything
            if (!prev || isInitialLoad || prev.status !== normalizedMatch.status) {
              isInitialLoad = false;
              return normalizedMatch;
            }
            
            // For message updates, don't replace the entire match object
            // This keeps references stable and prevents Chat remounting
            return {
              ...prev,
              requesterStarted: normalizedMatch.requesterStarted,
              providerStarted: normalizedMatch.providerStarted,
              requesterCompleted: normalizedMatch.requesterCompleted,
              providerCompleted: normalizedMatch.providerCompleted,
              messages: normalizedMatch.messages || [],
              updatedAt: normalizedMatch.updatedAt
            };
          });
        });
      } catch (error) {
        console.error("Error setting up match subscription:", error);
        setError("Failed to subscribe to match updates");
      }
    } else if (!currentUser && !firebaseLoading) {
      // Only redirect if auth has finished loading and the user is not authenticated
      router.push('/login');
    }

    return () => {
      // Clean up subscription when component unmounts or currentUser changes
      if (unsubscribe) {
        console.log("Unsubscribing from match updates");
        unsubscribe();
      }
    };
  }, [id, subscribeToMatch, currentUser, router, firebaseLoading]);

  // Watch for authentication changes to handle logout
  useEffect(() => {
    if (!currentUser && !loading && !firebaseLoading) {
      // User has logged out, redirect to login page
      router.push('/login');
    }
  }, [currentUser, loading, router, firebaseLoading]);

  // Load initial data
  useEffect(() => {
    const loadMatchData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Load match data
        const matchData = await getMatchById(id);
        if (!matchData) {
          setError('Match not found');
          return;
        }
        setMatch(matchData);

        // Load service and user data in parallel
        const [serviceData, requesterData, providerData] = await Promise.all([
          getServiceById(matchData.serviceId),
          getUserById(matchData.requesterId),
          getUserById(matchData.providerId)
        ]);

        setService(serviceData);
        setRequester(requesterData);
        setProvider(providerData);
      } catch (error) {
        console.error('Error loading match data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [id, getMatchById, getServiceById, getUserById]);

  const handleUpdateStart = async (hasStarted) => {
    if (!match || !currentUser) return;

    const isRequester = currentUser.id === match.requesterId;
    const updates = {
      requesterStarted: isRequester ? hasStarted : match.requesterStarted,
      providerStarted: !isRequester ? hasStarted : match.providerStarted,
    };

    // If both users have started, update status to in-progress
    const bothStarted =
      (isRequester ? hasStarted : match.requesterStarted) &&
      (!isRequester ? hasStarted : match.providerStarted);

    if (bothStarted) {
      updates.status = "in-progress";
    }

    try {
      // Pass currentUser.id explicitly to fix the "[object Object] is not part of match" error
      await updateMatchStart(match.id, currentUser.id, hasStarted);
    } catch (error) {
      console.error("Error updating match start:", error);
      setError(error.message);
    }
  };

  const handleUpdateComplete = async (isCompleted) => {
    if (!match || !currentUser) return;

    const isRequester = currentUser.id === match.requesterId;
    const updates = {
      requesterCompleted: isRequester ? isCompleted : match.requesterCompleted,
      providerCompleted: !isRequester ? isCompleted : match.providerCompleted,
    };

    // If both users have completed, update status to completed
    const bothCompleted =
      (isRequester ? isCompleted : match.requesterCompleted) &&
      (!isRequester ? isCompleted : match.providerCompleted);

    if (bothCompleted) {
      updates.status = "completed";
    }

    try {
      // Pass currentUser.id explicitly similar to handleUpdateStart
      await updateMatchCompletion(match.id, currentUser.id, isCompleted);
    } catch (error) {
      console.error("Error updating match completion:", error);
      setError(error.message);
    }
  };

  const handleSendMessage = async (content) => {
    if (!match || !currentUser || !content.trim()) return;

    try {
      // Don't set loading state or re-render match data immediately
      // Let the subscription handle the UI update
      await sendMessage(match.id, currentUser.id, content.trim());
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error.message);
    }
  };

  // Handle match cancellation
  const handleCancelMatch = async () => {
    if (!id || !currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await cancelMatch(id, currentUser.id);
      setShowCancelModal(false);
      // The subscription will update the match status
    } catch (error) {
      console.error('Error cancelling match:', error);
      setError('Failed to cancel match. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!match || !service || !requester || !provider) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Match not found</div>
      </div>
    );
  }

  const isUserInMatch = currentUser?.id === match.requesterId || currentUser?.id === match.providerId;
  if (!isUserInMatch) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">
          You don't have permission to view this match
        </div>
      </div>
    );
  }

  const otherUser = currentUser?.id === match.requesterId ? provider : requester;

  // Check if current user is a participant
  const isParticipant = currentUser && match && 
    (currentUser.id === match.requesterId || currentUser.id === match.providerId);

  // Check if match can be cancelled (not completed or already cancelled)
  const canCancel = isParticipant && match && 
    match.status !== "completed" && match.status !== "cancelled";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Match header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Match Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {service?.title || "Loading service details..."}
          </p>
        </div>
        
        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="mt-3 md:mt-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Cancel Match
          </button>
        )}
      </div>

      {/* Service Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            {service.title}
          </h2>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Created {formatDate(match.createdAt)}
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          {service.description}
        </p>
        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
          <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${
            service.type === "offering"
              ? "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
          }`}>
            {service.type === "offering" ? "Offering" : "Request"}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {service.category}
          </span>
        </div>
      </div>

      {/* Match Progress */}
      <MatchProgress
        match={match}
        currentUserId={currentUser?.id}
        onUpdateStart={handleUpdateStart}
        onUpdateComplete={handleUpdateComplete}
        requester={requester}
        provider={provider}
      />

      {/* Chat */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px] sm:h-[600px]">
        {match ? (
          <Chat
            key="stable-chat-component" // Use a completely stable key
            matchId={match.id}
            messages={match.messages || []}
            currentUserId={currentUser?.id}
            otherUser={otherUser}
            onSendMessage={handleSendMessage}
            messageText={messageText}
            setMessageText={setMessageText}
            disabled={match.status === "completed" || match.status === "cancelled"}
          />
        ) : (
          <div className="p-4 sm:p-6 text-center h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-sm text-gray-500 dark:text-gray-400">Loading conversation...</p>
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end sm:items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => setShowCancelModal(false)}
            ></div>

            {/* Modal positioning helper */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Cancel Match
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to cancel this match? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleCancelMatch}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span>Processing</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : 'Cancel Match'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto"
                  onClick={() => setShowCancelModal(false)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailPage;
