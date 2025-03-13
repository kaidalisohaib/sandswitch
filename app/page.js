"use client";

import Link from "next/link";
import { useFirebase } from "./utils/firebaseContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { getAvailableServices, isLoading } = useFirebase();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const glowVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
      scale: 1.2,
      opacity: 0,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Fetch services from Firebase
  useEffect(() => {
    async function fetchServices() {
      try {
        const firebaseServices = await getAvailableServices();
        setServices(firebaseServices || []);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      }
    }
    
    if (!isLoading) {
      fetchServices();
    }
  }, [getAvailableServices, isLoading]);
  
  useEffect(() => {
    if (services && services.length > 0) {
      const featured = services
        .filter(s => s.status === 'active')
        .slice(0, 3);
      setFeaturedServices(featured);
    }
  }, [services]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a78ff]/5 to-[#db2777]/5 dark:from-[#1a78ff]/10 dark:to-[#db2777]/10">
        {/* Animated background elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-white/[0.02]" />
        </motion.div>

        {/* Animated glow effects */}
        <motion.div
          variants={glowVariants}
          initial="initial"
          animate="animate"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-[#1a78ff]/20 to-[#db2777]/20 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.span 
                  className="bg-clip-text text-transparent bg-gradient-to-r from-[#1a78ff] via-[#8b5cf6] to-[#db2777]"
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: "100% 50%" }}
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                >
                  Exchange Services
                </motion.span>
                <br />
                Within Your Community
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300"
              >
                Connect with fellow students, share skills, and help each other grow. 
                Join our community of service exchange today.
              </motion.p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/services"
                  className="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-[#1a78ff] to-[#004bb3] hover:from-[#004bb3] hover:to-[#1a78ff] text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Browse Services
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/create"
                  className="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium bg-white dark:bg-gray-800 text-[#1a78ff] dark:text-[#6ba9ff] border-2 border-[#1a78ff] dark:border-[#6ba9ff] hover:bg-[#e6f1ff] dark:hover:bg-[#1a78ff]/10 transition-all duration-200"
                >
                  Create Service
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated decorative elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"
        />
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-transparent via-[#1a78ff]/5 to-[#db2777]/5 dark:via-[#1a78ff]/10 dark:to-[#db2777]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Simple steps to start exchanging services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1a78ff] to-[#db2777] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#e6f1ff] dark:bg-[#1a78ff]/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#1a78ff] dark:text-[#6ba9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create a Service
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your skills or request help from others. Describe what you can offer or what you need.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#db2777] to-[#8b5cf6] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#fce7f3] dark:bg-[#db2777]/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#db2777] dark:text-[#f472b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect & Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Find matches and communicate through our built-in chat system to discuss details.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#1a78ff] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#ede9fe] dark:bg-[#8b5cf6]/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#8b5cf6] dark:text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Exchange Services
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Meet up, exchange services, and help each other grow within the community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Services Section */}
      <div className="py-24 bg-gradient-to-b from-[#1a78ff]/5 via-white to-[#db2777]/5 dark:from-[#1a78ff]/10 dark:via-gray-900 dark:to-[#db2777]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Check out some of our active services
            </p>
          </div>

          {isLoading ? (
            // Loading state for featured services
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredServices.map((service, index) => (
                <div 
                  key={service.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-2 w-full ${
                    service.type === 'offering'
                      ? 'bg-gradient-to-r from-[#1a78ff] via-[#4291ff] to-[#6ba9ff]'
                      : 'bg-gradient-to-r from-[#db2777] via-[#ec4899] to-[#f472b6]'
                  }`} />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#1a78ff] dark:group-hover:text-[#6ba9ff] transition-colors duration-200">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center text-sm font-medium text-[#1a78ff] dark:text-[#6ba9ff] hover:text-[#004bb3] dark:hover:text-[#4291ff] transition-colors duration-200"
                    >
                      Learn More
                      <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No featured services available</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back later or create your own service!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium bg-white dark:bg-gray-800 text-[#1a78ff] dark:text-[#6ba9ff] border-2 border-[#1a78ff] dark:border-[#6ba9ff] hover:bg-[#e6f1ff] dark:hover:bg-[#1a78ff]/10 transition-all duration-200 hover:scale-105"
            >
              View All Services
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
