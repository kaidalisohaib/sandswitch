"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "../utils/firebaseContext";
import { serverTimestamp } from "firebase/firestore";
import { Toast, ToastContainer } from "../components/Toast";
import Link from "next/link";

export default function CreateServicePage() {
  const router = useRouter();
  const { createService, currentUser, isLoading, categories, error, setError, clearError } = useFirebase();
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    category: "",
    type: "offering", // Default to offering
    location: "Campus Center", // Default to a common location on campus
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const SUBMISSION_COOLDOWN = 30000; // 30 seconds cooldown between submissions
  const [toasts, setToasts] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Campus locations
  const campusLocations = [
    "Online",
    "Student Wellness Center",
    "Casgrain Building",
    "Hochelaga Building",
    "Penfield Building", 
    "Stewart Building",
    "Stewart East",
    "Anne-Marie Edward Science Building",
    "Library",
    "Brittain Hall",
    "Sports Complex",
    "Oval",
    "Other Campus Location"
  ];

  // If user is not logged in, redirect to login page
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login?redirect=/create");
    }
  }, [currentUser, isLoading, router]);

  // Clear context error when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Add this effect to prevent form resubmission on refresh or navigation
  useEffect(() => {
    // Prevent form resubmission when page is refreshed
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
    setHasUnsavedChanges(true);

    // Clear specific field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formState.tags.includes(tag) && formState.tags.length < 5) {
      setFormState({
        ...formState,
        tags: [...formState.tags, tag],
      });
      setTagInput("");
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormState({
      ...formState,
      tags: formState.tags.filter((tag) => tag !== tagToRemove),
    });
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formState.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!formState.description.trim()) {
      errors.description = "Description is required";
    } else if (formState.description.length < 20) {
      errors.description = "Description should be at least 20 characters";
    }
    
    if (!formState.category) {
      errors.category = "Please select a category";
    }
    
    if (!formState.location.trim()) {
      errors.location = "Location is required";
    }
    
    if (formState.tags.length === 0) {
      errors.tags = "Please add at least one tag";
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent spam submissions
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;
    
    if (cooldownActive) {
      const remainingCooldown = Math.ceil((SUBMISSION_COOLDOWN - timeSinceLastSubmission) / 1000);
      setToast({
        type: 'error',
        message: `Please wait ${remainingCooldown} seconds before creating another exchange`
      });
      return;
    }
    
    // Validate the form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to the first error
      const firstError = document.querySelector(".text-red-600");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create service data object with Firebase server timestamp
      const serviceData = {
        ...formState,
        userId: currentUser.id,
        status: "active",
        created: serverTimestamp(),
      };
      
      // Add the service
      const result = await createService(serviceData);
      
      if (result.success) {
        // Update last submission time and activate cooldown
        setLastSubmissionTime(Date.now());
        setCooldownActive(true);
        
        // Set timer to remove cooldown
        setTimeout(() => {
          setCooldownActive(false);
        }, SUBMISSION_COOLDOWN);
        
        setToast({
          type: 'success',
          message: 'Service created successfully!'
        });
        // Redirect after showing the success message
        setTimeout(() => {
          router.push(`/services/${result.serviceId}`);
        }, 1500);
      } else {
        // Handle rate limiting errors differently for better UX
        if (result.error && result.error.includes('wait')) {
          // This seems to be a rate-limiting error
          setToast({
            type: 'warning',
            message: result.error,
            duration: 6000 // Show longer due to importance
          });
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to create service'
        });
        }
      }
    } catch (err) {
      console.error("Error creating service:", err);
      
      // Handle Firebase index error specifically
      if (err.message && (err.message.includes('index') || err.message.includes('requires an index'))) {
        setToast({
          type: 'warning',
          message: 'The system is being updated. Please try again in a few minutes while we complete maintenance.',
          duration: 8000
        });
      } else {
      setToast({
        type: 'error',
        message: err.message || 'An unexpected error occurred'
      });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Show loading state when authentication is still loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated (and not loading), don't render the form at all
  // The useEffect above will handle the redirect to login
  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create a Service to Earn Sandwiches
          </h1>
          <Link
            href="/"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            Cancel
          </Link>
        </div>
        
        {/* Sandwich Reward Info Banner */}
        <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">How the Sandwich Reward Works</h3>
              <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                <p><strong>SandSwitch</strong> is a unique platform where you provide services to fellow students and earn delicious sandwiches as rewards from Valentina! Here's how it works:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Create a service you can offer to others</li>
                  <li>When someone requests your service, you'll be matched</li>
                  <li>Complete the service as agreed</li>
                  <li>Submit proof of completion</li>
                  <li>Redeem your sandwich reward from Valentina</li>
                </ul>
                <p className="mt-2 font-medium">It's that simple - help others and get rewarded with a tasty sandwich!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Limits</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>To maintain a quality platform, users can create up to <strong>5 services per day</strong> and no more than <strong>2 per 5-minute period</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
        {/* Service Type */}
        <div>
              <label className="text-base font-medium text-gray-800 dark:text-white">
                What type of service is this?
          </label>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleInputChange({ target: { name: "type", value: "offering" } })}
                  className={`relative px-6 py-4 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out ${
                formState.type === "offering"
                      ? "bg-indigo-600 text-white border-transparent transform scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>I'm Offering a Service</span>
                    <span className="mt-1 text-xs opacity-80">I'll help others & earn a sandwich from Valentina</span>
                  </div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange({ target: { name: "type", value: "request" } })}
                  className={`relative px-6 py-4 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out ${
                formState.type === "request"
                      ? "bg-indigo-600 text-white border-transparent transform scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span>I Need a Service</span>
                    <span className="mt-1 text-xs opacity-80">I'm looking for help from others</span>
                  </div>
            </button>
          </div>
          {formErrors.type && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.type}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Service Title
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="title"
              id="title"
              value={formState.title}
              onChange={handleInputChange}
              className={`shadow-sm block w-full px-4 py-3 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${formErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Give your service a clear descriptive title"
            />
          </div>
          {formErrors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.title}</p>}
          
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
            <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300">Example titles:</h4>
            <div className="mt-1">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">For Academic Help:</p>
              <ul className="pl-4 text-xs text-amber-700 dark:text-amber-400 list-disc space-y-1">
                <li>Math Tutoring for Calculus 1</li>
                <li>Help with Java Programming Assignment</li>
                <li>Physics Homework Assistance</li>
              </ul>
              
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-2 mb-1">For Skills & Hobbies:</p>
              <ul className="pl-4 text-xs text-amber-700 dark:text-amber-400 list-disc space-y-1">
                <li>French Conversation Practice for Beginners</li>
                <li>Guitar Lessons for Beginners</li>
                <li>Drawing Portraits Tutorial</li>
              </ul>
              
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-2 mb-1">For Other Services:</p>
              <ul className="pl-4 text-xs text-amber-700 dark:text-amber-400 list-disc space-y-1">
                <li>Proof-reading Essays for English 101</li>
                <li>Help Setting Up Computer Software</li>
                <li>Resume Review and Feedback</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Describe your service in detail
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formState.description}
              onChange={handleInputChange}
              className={`shadow-sm block w-full px-4 py-3 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder={formState.type === "offering" ? "Describe what you're offering, your expertise level, availability, and preferences for the sandwich reward." : "Describe what kind of help you need, when you need it, and any other relevant details."}
            />
          </div>
          {formErrors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.description}</p>}
          
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
            <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300">Tips for a good description:</h4>
            <ul className="mt-1 pl-4 text-xs text-amber-700 dark:text-amber-400 list-disc space-y-1">
              <li>Be specific about what you're offering or what help you need</li>
              <li>Mention your availability (days/times)</li>
              <li>Include your experience or skill level</li>
              <li>If requesting a service, explain your timeline and requirements</li>
            </ul>
          </div>
        </div>

        

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  What category best fits your service?
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    className={`shadow-sm block w-full px-4 py-3 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${formErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select a category</option>
                    <option value="academic">Academic Help</option>
                    <option value="technology">Technology</option>
                    <option value="creative">Creative Skills</option>
                    <option value="language">Language Learning</option>
                    <option value="music">Music</option>
                    <option value="sports">Sports & Fitness</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {formErrors.category && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.category}</p>}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Where will the service take place?
                </label>
                <div className="mt-1">
                  <select
                    id="location"
                    name="location"
                    value={formState.location}
                    onChange={handleInputChange}
                    className={`shadow-sm block w-full px-4 py-3 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white ${formErrors.location ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select a location</option>
                    {campusLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.location && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.location}</p>}
                
                <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <h4 className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Location Tips:</h4>
                  <ul className="mt-1 pl-4 text-xs text-emerald-700 dark:text-emerald-400 list-disc space-y-1">
                    <li>Choose a public place on campus for in-person services</li>
                    <li>Select "Online" for virtual tutoring, consultations, or digital services</li>
                    <li>Be specific about meeting locations to avoid confusion</li>
                  </ul>
                </div>
              </div>
            </div>

        {/* Tags */}
        <div>
              <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Add tags to help people find your service
          </label>
              <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
                  name="tagInput"
                  id="tagInput"
                  value={tagInput}
                  onChange={handleTagInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                  className={`flex-1 min-w-0 block w-full rounded-none rounded-l-md px-4 py-3 sm:text-sm border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${formErrors.tags ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., tutoring, language, programming"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={formState.tags.length >= 5 || !tagInput.trim()}
                  className={`-ml-px relative inline-flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                    formState.tags.length >= 5 || !tagInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Add
                </button>
          </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
            {formState.tags.map((tag) => (
              <span
                key={tag}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 transition-all duration-200 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center rounded-full h-5 w-5 text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none"
                >
                  <span className="sr-only">Remove tag</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
              
              <div className="flex items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                  {formState.tags.length}/5 tags
                </p>
                
                {formState.tags.length < 5 && (
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    Type a tag and press Enter or click Add
                  </span>
                )}
              </div>
              {formErrors.tags && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.tags}</p>}
              
              <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">Suggested tags for your service:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('tutoring') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'tutoring']}))
                    }
                  }} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    tutoring
                  </button>
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('language') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'language']}))
                    }
                  }} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    language
                  </button>
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('programming') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'programming']}))
                    }
                  }} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    programming
                  </button>
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('sandwich') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'sandwich']}))
                    }
                  }} className="text-xs bg-gradient-to-r from-[#1a78ff]/20 to-[#db2777]/20 hover:from-[#1a78ff]/30 hover:to-[#db2777]/30 dark:from-[#1a78ff]/30 dark:to-[#db2777]/30 dark:hover:from-[#1a78ff]/40 dark:hover:to-[#db2777]/40 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    sandwich
                  </button>
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('reward') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'reward']}))
                    }
                  }} className="text-xs bg-gradient-to-r from-[#1a78ff]/20 to-[#db2777]/20 hover:from-[#1a78ff]/30 hover:to-[#db2777]/30 dark:from-[#1a78ff]/30 dark:to-[#db2777]/30 dark:hover:from-[#1a78ff]/40 dark:hover:to-[#db2777]/40 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    reward
                  </button>
                  <button type="button" onClick={() => {
                    if (!formState.tags.includes('help') && formState.tags.length < 5) {
                      setFormState(prev => ({...prev, tags: [...prev.tags, 'help']}))
                    }
                  }} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                    help
                  </button>
                </div>
              </div>
        </div>

        {/* Submit Button */}
            <div className="flex flex-col space-y-4 pt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      By creating this service, you acknowledge that {formState.type === "offering" ? "you'll receive a sandwich reward from Valentina upon completing the service" : "someone will help you and receive a sandwich reward from Valentina upon completion"}.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || cooldownActive}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : cooldownActive ? (
                    <>
                      <svg className="mr-1.5 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cooldown Active
                    </>
                  ) : (
                    <>
                      {formState.type === "offering" ? "Create Service & Earn Sandwich" : "Create Service Request"}
                      <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
      </form>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
    </div>
  );
}
