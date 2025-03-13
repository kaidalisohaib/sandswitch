"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function HowItWorksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get("section") || "overview");

  const sections = [
    {
      id: "overview",
      title: "Overview",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            SandSwitch is a unique platform where you can offer your services to others
            in the CEGEP John Abbott community. The twist? Instead of traditional
            bartering, you'll receive a delicious sandwich as a reward for your
            contribution!
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Whether you're offering tutoring, creative services, or other assistance,
            your help will be appreciated with a tasty sandwich reward after
            completing the service.
          </p>
        </div>
      ),
    },
    {
      id: "process",
      title: "The Process",
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              1. Create or Browse Services
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Start by creating a service offering or browsing existing services
              in the community. You can offer any type of service that would be
              helpful to others.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              2. Connect with Others
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              When someone is interested in your service, you'll be connected
              through our platform. Discuss the details and arrange the service
              delivery.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              3. Complete the Service
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Provide your service as agreed. Make sure to document the completion
              as you'll need to submit proof to receive your reward.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              4. Get Your Sandwich Reward
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              After completing the service, submit proof of completion to Valentina.
              Once verified, you'll receive your well-deserved sandwich reward!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "guidelines",
      title: "Guidelines",
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Service Guidelines
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Services should be appropriate and helpful to the community</li>
              <li>Be clear and honest about what you can offer</li>
              <li>Complete services as agreed upon</li>
              <li>Submit clear proof of completion</li>
              <li>Treat others with respect and professionalism</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reward System
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>One completed service = One sandwich reward</li>
              <li>Rewards are verified by Valentina</li>
              <li>Proof of completion must be submitted within 24 hours</li>
              <li>Rewards are distributed on campus</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    router.push(`/how-it-works?section=${sectionId}`, { scroll: false });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        How It Works
      </h1>

      <div className="flex flex-col space-y-8">
        {/* Navigation */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                activeSection === section.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {sections.find((s) => s.id === activeSection)?.content}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Ready to start offering services and earning sandwich rewards?
          </p>
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create a Service
          </Link>
        </div>
      </div>
    </div>
  );
}

function HowItWorksLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse">
        <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<HowItWorksLoading />}>
      <HowItWorksContent />
    </Suspense>
  );
} 