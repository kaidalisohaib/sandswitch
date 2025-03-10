"use client";

import React from "react";
import Link from "next/link";
import { useMockData } from "../utils/mockDataContext";
import { formatDate, formatDistanceToNow } from "../utils/dateUtils";

export default function MatchCard({ match, currentUserId }) {
  const { 
    users, 
    services, 
    updateMatchCompletion, 
    updateMatchStart,
    getServiceById, 
    getUserById 
  } = useMockData();

  // Get the service and users involved
  const service = getServiceById(match.serviceId);
  const requester = getUserById(match.requesterId);
  const provider = getUserById(match.providerId);
  
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
  const timeAgo = formatDistanceToNow(new Date(match.created));

  // Handle start toggle
  const handleStartToggle = () => {
    updateMatchStart(match.id, currentUserId, !hasCurrentUserStarted);
  };

  // Handle completion toggle
  const handleCompletionToggle = () => {
    updateMatchCompletion(match.id, currentUserId, !hasCurrentUserCompleted);
  };

  // Get status text and button text
  const getStatusInfo = () => {
    if (match.status === "wanted") {
      if (!hasCurrentUserStarted && !hasOtherUserStarted) {
        return {
          statusText: "Waiting for both users to start",
          buttonText: "Start Match",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false
        };
      }
      if (hasCurrentUserStarted && !hasOtherUserStarted) {
        return {
          statusText: `Waiting for ${otherUser?.name || 'other user'} to start`,
          buttonText: "Cancel Start",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false
        };
      }
      if (!hasCurrentUserStarted && hasOtherUserStarted) {
        return {
          statusText: `${otherUser?.name || 'Other user'} is ready to start`,
          buttonText: "Start Match",
          canStart: true,
          showStartButton: true,
          showCompleteButton: false
        };
      }
    }
    
    if (match.status === "in-progress") {
      // Only show complete button if both users have started
      const canShowComplete = hasCurrentUserStarted && hasOtherUserStarted;
      
      if (hasCurrentUserCompleted && hasOtherUserCompleted) {
        return {
          statusText: "Both users have marked as complete",
          buttonText: "Unmark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete
        };
      }
      if (hasCurrentUserCompleted) {
        return {
          statusText: `Waiting for ${otherUser?.name || 'other user'} to complete`,
          buttonText: "Unmark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete
        };
      }
      if (hasOtherUserCompleted) {
        return {
          statusText: `${otherUser?.name || 'Other user'} has marked as complete`,
          buttonText: "Mark Complete",
          canComplete: true,
          showStartButton: false,
          showCompleteButton: canShowComplete
        };
      }
      
      if (!canShowComplete) {
        return {
          statusText: "Waiting for both users to start before completion",
          buttonText: "",
          canComplete: false,
          showStartButton: true,
          showCompleteButton: false
        };
      }
      
      return {
        statusText: "In Progress",
        buttonText: "Mark Complete",
        canComplete: true,
        showStartButton: false,
        showCompleteButton: canShowComplete
      };
    }
    
    if (match.status === "completed") {
      return {
        statusText: "Completed",
        buttonText: "",
        canComplete: false,
        showStartButton: false,
        showCompleteButton: false
      };
    }
    
    return {
      statusText: match.status,
      buttonText: "",
      canComplete: false,
      showStartButton: false,
      showCompleteButton: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              match.status === "completed" ? "bg-green-100 text-green-800" :
              match.status === "in-progress" ? "bg-blue-100 text-blue-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {statusInfo.statusText}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {timeAgo}
          </span>
        </div>

        {/* Service details */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {service?.title || "Service"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {service?.description || "No description available"}
          </p>
        </div>

        {/* Users involved */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold">
                {requester?.name?.charAt(0) || "R"}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {requester?.name || "Requester"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requester
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-3 text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {provider?.name || "Provider"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provider
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold">
                {provider?.name?.charAt(0) || "P"}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Details
          </Link>
          
          <div className="space-x-2">
            {statusInfo.showStartButton && (
              <button
                onClick={handleStartToggle}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  hasCurrentUserStarted
                    ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500"
                    : "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {statusInfo.buttonText}
              </button>
            )}
            
            {statusInfo.showCompleteButton && (
              <button
                onClick={handleCompletionToggle}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  hasCurrentUserCompleted
                    ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500"
                    : "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {statusInfo.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
