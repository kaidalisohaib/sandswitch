"use client";

import Link from "next/link";
import { useMockData } from "../utils/mockDataContext";
import { formatDistanceToNow } from "../utils/dateUtils";

export default function ServiceCard({ service, currentUserId }) {
  // Get data from context
  const { users, matches } = useMockData();
  
  // Find the user who created this service
  const user = users.find((u) => u.id === service.userId);
  
  // Find matches for this service
  const serviceMatches = matches.filter(m => 
    m.serviceId === service.id && 
    (m.requesterId === currentUserId || m.providerId === currentUserId)
  );

  // Log matches for debugging
  console.log('Service matches:', {
    serviceId: service.id,
    currentUserId,
    allMatches: matches.length,
    filteredMatches: serviceMatches.length,
    matches: serviceMatches
  });

  // Determine card border color based on type
  const borderColorClass =
    service.type === "offering"
      ? "border-pink-400 dark:border-pink-600"
      : "border-blue-400 dark:border-blue-600";

  // Format the relative time
  const timeAgo = formatDistanceToNow(new Date(service.created));
  
  // Format match statuses
  const formatStatus = (status) => {
    switch (status) {
      case "wanted": return "Pending Start";
      case "in-progress": return "In Progress";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };
  
  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "wanted":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get detailed status text
  const getDetailedStatus = (match) => {
    const otherUserId = match.requesterId === currentUserId ? match.providerId : match.requesterId;
    const otherUser = users.find(u => u.id === otherUserId);
    const otherUserName = otherUser?.name || "User";

    if (match.status === "wanted") {
      const hasRequesterStarted = match.requesterStarted || false;
      const hasProviderStarted = match.providerStarted || false;
      
      if (!hasRequesterStarted && !hasProviderStarted) {
        return "Waiting for both users to start";
      }
      
      const youStarted = match.requesterId === currentUserId ? hasRequesterStarted : hasProviderStarted;
      const theyStarted = match.requesterId === currentUserId ? hasProviderStarted : hasRequesterStarted;
      
      if (youStarted && !theyStarted) {
        return `Waiting for ${otherUserName} to start`;
      } else if (!youStarted && theyStarted) {
        return `${otherUserName} is ready to start`;
      }
    }
    
    if (match.status === "in-progress") {
      const youCompleted = match.requesterId === currentUserId ? match.requesterCompleted : match.providerCompleted;
      const theyCompleted = match.requesterId === currentUserId ? match.providerCompleted : match.requesterCompleted;
      
      if (youCompleted && theyCompleted) {
        return "Both users marked as complete";
      } else if (youCompleted) {
        return `Waiting for ${otherUserName} to complete`;
      } else if (theyCompleted) {
        return `${otherUserName} marked as complete`;
      }
      return "In progress";
    }
    
    return formatStatus(match.status);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${borderColorClass} hover:shadow-lg transition duration-300`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                service.type === "offering"
                  ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {service.type === "offering" ? "Offering" : "Request"}
            </span>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {service.category}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo}
          </span>
        </div>

        <Link href={`/services/${service.id}`}>
          <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150">
            {service.title}
          </h3>
        </Link>

        <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-3">
          {service.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <Link
              key={tag}
              href={`/services?tag=${tag}`}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition duration-150"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || "Anonymous User"}
            </p>
            <div className="flex items-center mt-1">
              <svg
                className="text-yellow-400 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {user?.rating || "4.0"} ({user?.completedServices || "0"}{" "}
                services)
              </span>
            </div>
          </div>
          <div className="ml-auto">
            {serviceMatches.length > 0 ? (
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {serviceMatches.length} active {serviceMatches.length === 1 ? 'match' : 'matches'}
                </span>
                <div className="space-y-2">
                  {serviceMatches.map((match) => {
                    const otherUserId = match.requesterId === currentUserId ? match.providerId : match.requesterId;
                    const otherUser = users.find(u => u.id === otherUserId);
                    
                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className={`flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150`}
                      >
                        <span className={`inline-flex mr-2 h-2 w-2 rounded-full ${
                          match.status === 'completed' ? 'bg-green-400' : 
                          match.status === 'in-progress' ? 'bg-blue-400' : 
                          'bg-yellow-400'
                        }`}></span>
                        Match with {otherUser?.name || "User"}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Link
                href={`/services/${service.id}`}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
        
        {/* Service matches summary */}
        {serviceMatches.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Match Status:</h4>
            <div className="flex flex-wrap gap-2">
              {serviceMatches.map(match => {
                const otherUserId = match.requesterId === currentUserId ? match.providerId : match.requesterId;
                const otherUser = users.find(u => u.id === otherUserId);
                
                return (
                  <div 
                    key={match.id} 
                    className="text-xs px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700"
                  >
                    <span className={`inline-block px-2 py-0.5 rounded-full ${getStatusClass(match.status)}`}>
                      {formatStatus(match.status)}
                    </span>
                    <span className="mx-1">with</span>
                    <span className="font-medium">{otherUser?.name || "User"}</span>
                    
                    {/* Show detailed status */}
                    <div className="mt-1 text-gray-500 dark:text-gray-400 text-xs">
                      {getDetailedStatus(match)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
