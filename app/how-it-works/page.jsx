"use client";

import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: "Project Overview",
      description: "SandSwitch is a student project conceptualized by Valentina Perez Rojas at CEGEP John Abbott that demonstrates the concept of a service exchange platform within an educational community.",
    },
    {
      number: 2,
      title: "Platform Features",
      description: "The platform showcases various features including user profiles, service listings, and a messaging system - all designed to demonstrate how students could potentially exchange skills and services.",
    },
    {
      number: 3,
      title: "Educational Purpose",
      description: "This project serves as a prototype to explore the potential of service exchange platforms within educational communities, combining innovative concept design with modern web development.",
    },
    {
      number: 4,
      title: "Future Potential",
      description: "While this is a student project, it demonstrates the potential for creating meaningful connections within educational communities through skill and service exchange.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Understanding this student project
          </p>
        </div>

        <div className="mt-12">
          <div className="space-y-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Project Credits
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Project Owner: Valentina Perez Rojas<br />
            Website Development: Sohaib Kaidali<br /><br />
            For more information about the project concept or to provide feedback, 
            please visit the contact page.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
} 