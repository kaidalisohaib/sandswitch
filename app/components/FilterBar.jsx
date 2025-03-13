"use client";

import { useState, useEffect } from "react";

export default function FilterBar({
  categories,
  activeFilter,
  onFilterChange,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState(activeFilter.searchTerm || "");

  useEffect(() => {
    setSearchTerm(activeFilter.searchTerm || "");
  }, [activeFilter.searchTerm]);

  // Apply search filter with debounce
  useEffect(() => {
    // Skip initial render
    if (searchTerm === activeFilter.searchTerm) return;
    
    // Add debounce to avoid too many updates while typing
    const timer = setTimeout(() => {
      if (!isLoading) {
        onFilterChange({ searchTerm });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, onFilterChange, isLoading, activeFilter.searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    // This is now just for form submission, filtering happens automatically through useEffect
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Search input */}
        <div className="md:col-span-2">
          <form onSubmit={handleSearch} className="relative">
            <label htmlFor="search" className="sr-only">
              Search services
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                )}
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                placeholder="Search by title, description, or tags..."
              />
              {searchTerm && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    onFilterChange({ searchTerm: "" });
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-500"
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
              )}
            </div>
          </form>
        </div>

        {/* Category filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={activeFilter.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            disabled={isLoading}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={activeFilter.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            disabled={isLoading}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <option value="">All Types</option>
            <option value="offering">Offerings</option>
            <option value="request">Requests</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      {(activeFilter.category || activeFilter.type || activeFilter.searchTerm) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Active filters:
          </span>
          {activeFilter.searchTerm && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
              Search: {activeFilter.searchTerm}
              <button
                type="button"
                onClick={() => onFilterChange({ searchTerm: "" })}
                disabled={isLoading}
                className={`ml-1 inline-flex items-center p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Remove search filter</span>
                <svg
                  className="h-3 w-3"
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
            </span>
          )}
          {activeFilter.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
              Category: {activeFilter.category}
              <button
                type="button"
                onClick={() => onFilterChange({ category: "" })}
                disabled={isLoading}
                className={`ml-1 inline-flex items-center p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Remove category filter</span>
                <svg
                  className="h-3 w-3"
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
            </span>
          )}
          {activeFilter.type && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
              Type: {activeFilter.type.charAt(0).toUpperCase() + activeFilter.type.slice(1)}
              <button
                type="button"
                onClick={() => onFilterChange({ type: "" })}
                disabled={isLoading}
                className={`ml-1 inline-flex items-center p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Remove type filter</span>
                <svg
                  className="h-3 w-3"
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
            </span>
          )}
          <button
            type="button"
            onClick={() => onFilterChange({ category: "", type: "", searchTerm: "" })}
            disabled={isLoading}
            className={`text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
