"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "../../utils/dateUtils";
import UserProfileCard from "../../components/UserProfileCard";
import { useMockData } from "../../utils/mockDataContext";

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [service, setService] = useState(null);
  const [user, setUser] = useState(null);
  const [existingMatch, setExistingMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use our mock data context
  const { 
    getServiceById, 
    getUserById, 
    createMatch, 
    sendMessage,
    getUserMatches 
  } = useMockData();

  // Current user (mock)
  const currentUserId = "user1";

  // Load data
  useEffect(() => {
    const serviceData = getServiceById(id);
    
    if (serviceData) {
      setService(serviceData);
      
      // Get user info
      const userData = getUserById(serviceData.userId);
      setUser(userData);
      
      // Check for existing match
      const userMatches = getUserMatches(currentUserId);
      const match = userMatches.find(m => m.serviceId === id);
      setExistingMatch(match);
    }
    
    setLoading(false);
  }, [id, getServiceById, getUserById, getUserMatches, currentUserId]);

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

  // Determine the tag styling based on service type
  const tagClass = isOffering
    ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

  // Format created date
  const createdDate = formatDateTime(service.created);

  const handleContactRequest = (e) => {
    e.preventDefault();
    
    // Set loading state
    setIsSubmitting(true);
    
    // Create a new match
    const matchData = {
      serviceId: service.id,
      // If service is an offering, currentUser is requester. Otherwise, currentUser is provider
      requesterId: isOffering ? currentUserId : service.userId,
      providerId: isOffering ? service.userId : currentUserId,
    };
    
    // Create the match
    const newMatch = createMatch(
      matchData.serviceId,
      matchData.requesterId,
      matchData.providerId
    );
    
    // If there's a message, send it
    if (message.trim()) {
      sendMessage(newMatch.id, currentUserId, message);
    }
    
    // Reset form and show success
    setIsSubmitting(false);
    setShowContactModal(false);
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds, then redirect to the match
    setTimeout(() => {
      setShowSuccessMessage(false);
      router.push(`/matches/${newMatch.id}`);
    }, 3000);
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
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagClass}`}
              >
                {isOffering ? "Offering" : "Request"}
              </span>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {service.category}
              </span>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {service.status.charAt(0).toUpperCase() +
                  service.status.slice(1)}
              </span>
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

            <UserProfileCard user={user} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-end">
            {existingMatch ? (
              <Link
                href={`/matches/${existingMatch.id}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
              >
                View Your Match
              </Link>
            ) : (
              <button
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
              >
                {isOffering ? "Request This Service" : "Offer to Help"}
              </button>
            )}

            <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150">
              <svg
                className="h-5 w-5 mr-2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              Report Service
            </button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
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
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Choose how you'd like to communicate with {user.name}:
            </p>

            <form onSubmit={handleContactRequest}>
              <div className="space-y-4 mb-6">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={`Introduce yourself to ${user.name} and explain why you're interested in this ${service.type === "offering" ? "service" : "request"}.`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Communication Preference
                </label>

                <div className="flex items-center">
                  <input
                    id="in-app"
                    name="contact-method"
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                    checked={true}
                    readOnly
                  />
                  <label
                    htmlFor="in-app"
                    className="ml-3 block text-gray-700 dark:text-gray-300"
                  >
                    In-app messaging
                  </label>
                </div>

                <div className="pl-7 mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You'll be able to communicate with {user.name} directly through our messaging system.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
