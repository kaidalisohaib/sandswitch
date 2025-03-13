"use client";

import { useState, useEffect } from "react";
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

  const { getUserById, getServicesByUserId, getUserMatches, currentUser, firebaseLoading } = useFirebase();
  const router = useRouter();

  // Get current user ID from context
  const currentUserId = currentUser?.id;

  // Check if user is authenticated and redirect to login if not
  useEffect(() => {
    if (!firebaseLoading && !currentUser) {
      // Redirect to login if user is not authenticated
      router.push(`/login?redirect=/profile/${id}`);
    }
  }, [currentUser, firebaseLoading, router, id]);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load user data
        const userData = await getUserById(id);
        if (!userData) {
          setError('User not found');
          return;
        }
        setUser(userData);

        // Load user's services and matches in parallel
        const [userServices, userMatches] = await Promise.all([
          getServicesByUserId(id),
          getUserMatches(id)
        ]);

        setServices(userServices);
        setMatches(userMatches);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Only load data if user is authenticated
    if (currentUser) {
      loadUserData();
    }
  }, [id, getUserById, getServicesByUserId, getUserMatches, currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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

  // Calculate stats
  const stats = {
    servicesOffered: services.filter(s => s.type === "offering" && s.status !== "deleted").length,
    servicesRequested: services.filter(s => s.type === "request" && s.status !== "deleted").length,
    matchesCompleted: matches.filter(m => m.status === "completed").length,
    rating: user.rating || "⭐ Coming Soon",
    memberSince: user.createdAt 
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