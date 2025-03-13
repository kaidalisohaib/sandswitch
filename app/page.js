"use client";

import Link from "next/link";
import { useFirebase } from "./utils/firebaseContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ServiceCard from "./components/ServiceCard";

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
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const glowVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
      scale: 1.2,
      opacity: 0,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
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
        .filter((s) => s.status === "active")
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
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
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
                SandSwitch is a unique platform where you can offer your
                services to the CEGEP John Abbott community and earn delicious
                sandwiches as rewards. Share your skills, help others, and get
                rewarded!
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
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
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
                  <svg
                    className="ml-2 w-5 h-5"
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

      {/* How It Works Section */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Simple steps to earn your sandwich reward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="bg-[#e6f1ff] dark:bg-[#1a78ff]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1a78ff] dark:text-[#6ba9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create or Browse Services
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Offer your skills or find services you need from other students
              </p>
              <div className="hidden md:block absolute top-12 right-0 w-24 h-2">
                <svg className="w-full text-[#1a78ff]/30 dark:text-[#1a78ff]/40" viewBox="0 0 100 10">
                  <line x1="0" y1="5" x2="95" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
                  <polyline points="88,1 96,5 88,9" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="text-center relative">
              <div className="bg-[#fce7f3] dark:bg-[#db2777]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#db2777] dark:text-[#f472b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Complete the Service
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work together to complete the service as agreed
              </p>
              <div className="hidden md:block absolute top-12 right-0 w-24 h-2">
                <svg className="w-full text-[#db2777]/30 dark:text-[#db2777]/40" viewBox="0 0 100 10">
                  <line x1="0" y1="5" x2="95" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
                  <polyline points="88,1 96,5 88,9" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-[#ede9fe] dark:bg-[#8b5cf6]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#8b5cf6] dark:text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Your Sandwich
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Submit proof of completion to receive your sandwich reward
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gradient-to-b from-transparent via-[#1a78ff]/5 to-[#db2777]/5 dark:via-[#1a78ff]/10 dark:to-[#db2777]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Why Choose SandSwitch?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              A unique platform that rewards your contributions to the community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1a78ff] to-[#db2777] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-8 bg-white dark:bg-gray-800 rounded-lg transform transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#e6f1ff] dark:bg-[#1a78ff]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#1a78ff] dark:text-[#6ba9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  Delicious Rewards
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Earn sandwiches as tokens of appreciation for your valuable services and contributions
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#db2777] to-[#8b5cf6] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-8 bg-white dark:bg-gray-800 rounded-lg transform transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fce7f3] dark:bg-[#db2777]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#db2777] dark:text-[#f472b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  Community Building
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Connect with other students and build meaningful relationships within our campus
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#1a78ff] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-8 bg-white dark:bg-gray-800 rounded-lg transform transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ede9fe] dark:bg-[#8b5cf6]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#8b5cf6] dark:text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  Skill Sharing
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Share your expertise and learn from others in a collaborative educational environment
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
                <motion.div 
                  key={service.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
                </motion.div>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No services available</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-8">Check back later or create your own service!</p>
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a78ff] hover:bg-[#004bb3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a78ff]"
              >
                Create Service
              </Link>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium bg-white dark:bg-gray-800 text-[#1a78ff] dark:text-[#6ba9ff] border-2 border-[#1a78ff] dark:border-[#6ba9ff] hover:bg-[#e6f1ff] dark:hover:bg-[#1a78ff]/10 transition-all duration-200 hover:scale-105"
            >
              View All Services
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#1a78ff] to-[#db2777] dark:from-[#1a78ff]/90 dark:to-[#db2777]/90 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Earning Sandwiches?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join our community and start offering your services today
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-[#1a78ff] bg-white hover:bg-gray-50 shadow-lg transition-all duration-200"
                >
                  Create Your First Service
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                >
                  Browse Services
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Animated glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white blur-3xl"
        />
        
        {/* Animated decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-grid-white/[0.1]" />
        </motion.div>
      </div>
    </div>
  );
}
