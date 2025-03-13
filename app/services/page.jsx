"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import ServiceCard from "../components/ServiceCard";
import FilterBar from "../components/FilterBar";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "../utils/firebaseContext";

// Create a separate component that uses useSearchParams
function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    getAvailableServices, 
    currentUser, 
    isLoading, 
    error, 
    categories 
  } = useFirebase();
  const [filteredServices, setFilteredServices] = useState([]);
  const [services, setServices] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [localError, setLocalError] = useState("");
  const [activeFilter, setActiveFilter] = useState({
    category: searchParams.get("category") || "",
    type: searchParams.get("type") || "",
    searchTerm: searchParams.get("tag") || searchParams.get("search") || "",
  });

  // Load services from Firebase
  useEffect(() => {
    async function loadServices() {
      if (isLoading) return;
      
      try {
        const availableServices = await getAvailableServices();
        setServices(availableServices);
      } catch (err) {
        console.error("Error loading services:", err);
        setLocalError("Failed to load services. Please try again.");
        setServices([]);
      }
    }
    
    loadServices();
  }, [getAvailableServices, isLoading]);

  // Memoize the filter function for better performance
  const applyFilters = useCallback((services, filters) => {
    if (!services || !Array.isArray(services)) {
      console.warn("Services array is invalid:", services);
      return [];
    }
    
    try {
      // Filter by category
      let filtered = services;
      if (filters.category && filters.category !== "All") {
        filtered = filtered.filter(s => s.category === filters.category);
      }
      
      // Filter by type (offering/request)
      if (filters.type) {
        filtered = filtered.filter(s => s.type === filters.type);
      }
      
      // Filter by search term (title, description, tags)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(searchLower) || 
          s.description.toLowerCase().includes(searchLower) ||
          s.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return filtered;
    } catch (err) {
      console.error("Error applying filters:", err);
      setLocalError("Error filtering services. Please try again.");
      return [];
    }
  }, []);

  // Apply filters when services or filter changes
  useEffect(() => {
    if (isLoading) return;
    
    try {
      const filtered = applyFilters(services, activeFilter);
      setFilteredServices(filtered);
      setLocalError("");
    } catch (err) {
      console.error("Error filtering services:", err);
      setLocalError("Failed to filter services. Please try again.");
      setFilteredServices([]);
    }
  }, [services, activeFilter, applyFilters, isLoading]);

  // Update URL and filter services when filter changes
  const handleFilterChange = (newFilters) => {
    setIsFiltering(true);
    
    try {
      // Create merged filter object that includes both existing active filters and new ones
      const mergedFilters = { ...activeFilter, ...newFilters };

      // Update active filter state
      setActiveFilter(mergedFilters);

      // Update URL query parameters
      const params = new URLSearchParams();
      if (mergedFilters.category && mergedFilters.category !== "All") {
        params.set("category", mergedFilters.category);
      }
      if (mergedFilters.type) {
        params.set("type", mergedFilters.type);
      }
      if (mergedFilters.searchTerm) {
        params.set("search", mergedFilters.searchTerm);
      }
      
      // Update URL without refreshing the page
      router.push(`/services?${params.toString()}`, { scroll: false });
    } catch (err) {
      console.error("Error updating filters:", err);
      setLocalError("Failed to update filters. Please try again.");
    } finally {
      setIsFiltering(false);
    }
  };

  const handleTagClick = (tag) => {
    handleFilterChange({ searchTerm: tag });
  };

  // Handle service deletion
  const handleServiceDelete = (serviceId) => {
    // Remove the service from both services and filtered services
    setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
    setFilteredServices(prevFiltered => prevFiltered.filter(s => s.id !== serviceId));
  };

  const renderError = () => {
    if (!error && !localError) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 flex items-start">
        <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-medium">{error || localError}</p>
          <button 
            className="text-red-600 hover:underline text-sm mt-1" 
            onClick={() => setLocalError("")}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Browse Services
      </h1>

      {renderError()}

      <FilterBar
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        isLoading={isFiltering}
      />

      {isFiltering ? (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No services found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Try adjusting your filters or search for something else
          </p>
          <button
            onClick={() => handleFilterChange({
              category: "",
              type: "",
              searchTerm: "",
            })}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              currentUserId={currentUser?.id}
              onTagClick={handleTagClick}
              onDelete={handleServiceDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Create a loading fallback
function ServicesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServicesContent />
    </Suspense>
  );
}
