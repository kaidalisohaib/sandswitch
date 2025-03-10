"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ServiceCard from "../components/ServiceCard";
import MatchCard from "../components/MatchCard";
import MessagesTab from "./messages";
import { useMockData } from "../utils/mockDataContext";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("services");
  const [loading, setLoading] = useState(true);

  // Use our mock data context 
  const { 
    users,
    services,
    matches,
    getUserById,
  } = useMockData();

  // Mock current user ID (in a real app, this would come from authentication)
  const currentUserId = "user1";
  
  // Get current user
  const currentUser = useMemo(() => {
    return getUserById(currentUserId);
  }, [getUserById, currentUserId]);

  // Filter services created by the current user
  const userServices = useMemo(() => {
    if (!services || !currentUserId) return [];
    return services.filter(service => service.userId === currentUserId);
  }, [services, currentUserId]);

  // Filter matches involving the current user
  const userMatches = useMemo(() => {
    if (!matches || !currentUserId) return [];
    return matches.filter(match => 
      match.requesterId === currentUserId || match.providerId === currentUserId
    );
  }, [matches, currentUserId]);

  // Count conversations (all matches now use in-app chat)
  const conversationsCount = userMatches.length;
  
  // Set loading state
  useEffect(() => {
    if (currentUser && services && matches) {
      setLoading(false);
    }
  }, [currentUser, services, matches]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Manage your services and matches in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/create"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
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

          <Link
            href="/services"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
          >
            <svg
              className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            Browse Services
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-12">
        <div className="flex flex-col sm:flex-row items-center p-6">
          <div className="flex-shrink-0 mb-4 sm:mb-0">
            <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-3xl text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
              {currentUser?.name?.charAt(0) || "?"}
            </div>
          </div>

          <div className="ml-0 sm:ml-6 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentUser?.name || "User"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Member since{" "}
              {currentUser?.joinedDate ? new Date(currentUser.joinedDate).toLocaleDateString() : "N/A"}
            </p>

            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-1"
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
                <span className="text-gray-700 dark:text-gray-300">
                  {userServices.length} services
                </span>
              </div>

              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {userMatches.length} matches
                </span>
              </div>

              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {conversationsCount} conversations
                </span>
              </div>

              <div className="flex items-center">
                <svg
                  className="text-yellow-400 h-5 w-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {currentUser?.rating || "N/A"} rating
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto mt-6 sm:mt-0">
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
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
              {conversationsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium dark:bg-indigo-900 dark:text-indigo-200">
                  {conversationsCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "services" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userServices.length > 0 ? (
            userServices.map((service) => (
              <ServiceCard key={service.id} service={service} currentUserId={currentUserId} />
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
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

      {activeTab === "matches" && (
        <div className="grid grid-cols-1 gap-8">
          {userMatches.length > 0 ? (
            userMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match}
                currentUserId={currentUserId} 
              />
            ))
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No matches yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Browse services and find matches that interest you.
              </p>
              <div className="mt-6">
                <Link
                  href="/services"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M4 8a6 6 0 1110.89 3.477l2.823 2.822a1 1 0 01-1.414 1.414l-2.823-2.822A6 6 0 014 8zm6-4a4 4 0 100 8 4 4 0 000-8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Browse Services
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "messages" && <MessagesTab />}
    </div>
  );
}
