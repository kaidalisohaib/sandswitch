"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFirebase } from "../utils/firebaseContext";
import { formatDate, formatDistanceToNow } from "date-fns";
import { formatTimeAgo } from "../utils/dateUtils";

export default function MatchCard({ match, currentUserId }) {
  const { 
    updateMatchCompletion, 
    updateMatchStart,
    getServiceById, 
    getUserById,
    cancelMatch
  } = useFirebase();

  const [service, setService] = useState(null);
  const [requester, setRequester] = useState(null);
  const [provider, setProvider] = useState(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (match) {
        try {
          // Get service data
          if (match.serviceId) {
            const serviceData = await getServiceById(match.serviceId);
            setService(serviceData);
          }
          
          // Get requester data
          if (match.requesterId) {
            const requesterData = await getUserById(match.requesterId);
            setRequester(requesterData);
          }
          
          // Get provider data
          if (match.providerId) {
            const providerData = await getUserById(match.providerId);
            setProvider(providerData);
          }
        } catch (err) {
          console.error("Error loading match data:", err);
        }
      }
    }
    
    loadData();
  }, [match, getServiceById, getUserById]);

  // Determine if current user is requester or provider
  const isRequester = currentUserId === match.requesterId;
  const currentUserRole = isRequester ? "requester" : "provider";
  const otherUser = isRequester ? provider : requester;

  // Get completion and start status for both users
  const hasCurrentUserStarted = isRequester ? match.requesterStarted : match.providerStarted;
  const hasOtherUserStarted = isRequester ? match.providerStarted : match.requesterStarted;
  const hasCurrentUserCompleted = isRequester ? match.requesterCompleted : match.providerCompleted;
  const hasOtherUserCompleted = isRequester ? match.providerCompleted : match.requesterCompleted;

  // Format the relative time
  const timeAgo = formatTimeAgo(match.created);

  // Handle start toggle
  const handleStartToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log("MatchCard: updating start status for", match.id, currentUserId);
      await updateMatchStart(match.id, currentUserId, !hasCurrentUserStarted);
    } catch (error) {
      console.error("Error toggling start status:", error);
    }
  };

  // Handle completion toggle
  const handleCompletionToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await updateMatchCompletion(match.id, currentUserId, !hasCurrentUserCompleted);
  };

  // Handle cancel
  const handleCancel = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await cancelMatch(match.id, currentUserId);
  };

  // Get status text and button text
  const getStatusInfo = () => {
    if (match.status === "cancelled") {
      return {
        statusText: "Cancelled",
        buttonText: "",
        canComplete: false,
        showStartButton: false,
        showCompleteButton: false,
        showCancelButton: false
      };
    }

    if (match.status === "wanted") {
      if (!hasCurrentUserStarted && !hasOtherUserStarted) {
        return {
          statusText: "Waiting for both users to start",
          buttonText: "Start Match",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false,
          showCancelButton: true
        };
      }
      if (hasCurrentUserStarted && !hasOtherUserStarted) {
        return {
          statusText: `Waiting for ${otherUser?.name || 'other user'} to start`,
          buttonText: "Cancel Start",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false,
          showCancelButton: true
        };
      }
      if (!hasCurrentUserStarted && hasOtherUserStarted) {
        return {
          statusText: `${otherUser?.name || 'Other user'} is ready to start`,
          buttonText: "Start Match",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false,
          showCancelButton: true
        };
      }
    }
    
    if (match.status === "in-progress") {
      // Only show complete button if both users have started
      const canShowComplete = hasCurrentUserStarted && hasOtherUserStarted;
      const isServiceOwner = service?.userId === currentUserId;
      
      if (hasCurrentUserCompleted && hasOtherUserCompleted) {
        return {
          statusText: "Both users have marked as complete",
          buttonText: "Unmark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete,
          showCancelButton: isServiceOwner
        };
      }
      if (hasCurrentUserCompleted) {
        return {
          statusText: `Waiting for ${otherUser?.name || 'other user'} to complete`,
          buttonText: "Unmark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete,
          showCancelButton: isServiceOwner
        };
      }
      if (hasOtherUserCompleted) {
        return {
          statusText: `${otherUser?.name || 'Other user'} has marked as complete`,
          buttonText: "Mark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete,
          showCancelButton: isServiceOwner
        };
      }
      
      if (!canShowComplete) {
        return {
          statusText: "Waiting for both users to start before completion",
          buttonText: "",
          canComplete: false,
          showStartButton: true,
          showCompleteButton: false,
          showCancelButton: true
        };
      }
      
      return {
        statusText: "In Progress",
        buttonText: "Mark Complete",
        canComplete: true,
        showStartButton: false,
        showCompleteButton: canShowComplete,
        showCancelButton: isServiceOwner
      };
    }
    
    if (match.status === "completed") {
      return {
        statusText: "Completed",
        buttonText: "",
        canComplete: false,
        showStartButton: false,
        showCompleteButton: false,
        showCancelButton: false
      };
    }
    
    return {
      statusText: match.status,
      buttonText: "",
      canComplete: false,
      showStartButton: false,
      showCompleteButton: false,
      showCancelButton: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
      aria-label="Open Match"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${
              match.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200" :
              match.status === "in-progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200" :
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
            }`}>
              {statusInfo.statusText}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {timeAgo} ago
          </span>
        </div>

        {/* Service details */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-1">
            {service?.title || "Service"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {service?.description || "No description available"}
          </p>
        </div>

        {/* Users involved */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold text-sm">
                {requester?.name?.charAt(0) || "R"}
              </div>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {requester?.name || "Requester"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requester
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-2 sm:mr-3 text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {provider?.name || "Provider"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provider
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold text-sm">
                {provider?.name?.charAt(0) || "P"}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-end items-center gap-2">
          {statusInfo.showCancelButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCancel(e);
              }}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
            >
              Cancel Match
            </button>
          )}

          {statusInfo.showStartButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleStartToggle(e);
              }}
              className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                hasCurrentUserStarted
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  : "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
              }`}
            >
              {statusInfo.buttonText}
            </button>
          )}

          {statusInfo.showCompleteButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCompletionToggle(e);
              }}
              className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                hasCurrentUserCompleted
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  : "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
              }`}
            >
              {statusInfo.buttonText}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
