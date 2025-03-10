"use client";

import { useState } from "react";
import { services, categories } from "../mockData";
import ServiceCard from "../components/ServiceCard";
import FilterBar from "../components/FilterBar";

export default function ServicesPage() {
  const [filteredServices, setFilteredServices] = useState(services);
  const [activeFilter, setActiveFilter] = useState({
    category: "",
    type: "",
    searchTerm: "",
  });

  const handleFilterChange = (newFilters) => {
    // Create merged filter object that includes both existing active filters and new ones
    const mergedFilters = { ...activeFilter, ...newFilters };

    // Update active filter state
    setActiveFilter(mergedFilters);

    // Start with all services and apply all filters
    let filtered = [...services];

    // Filter by category
    if (mergedFilters.category && mergedFilters.category !== "All") {
      filtered = filtered.filter(
        (service) => service.category === mergedFilters.category
      );
    }

    // Filter by type (offering/request)
    if (mergedFilters.type) {
      filtered = filtered.filter(
        (service) => service.type === mergedFilters.type
      );
    }

    // Filter by search term
    if (mergedFilters.searchTerm) {
      const term = mergedFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    setFilteredServices(filtered);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Browse Services
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Find services offered by community members or post your own request.
        </p>
      </div>

      <FilterBar
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              No services found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
