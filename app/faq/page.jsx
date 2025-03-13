"use client";

import { useState } from "react";

export default function FAQPage() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqs = [
    {
      question: "What is SandSwitch?",
      answer: "SandSwitch is a student project conceptualized by Valentina Perez Rojas at CEGEP John Abbott. It's a platform concept that demonstrates how users could exchange services and skills within an educational community."
    },
    {
      question: "Is this a real service?",
      answer: "No, SandSwitch is a student project created for educational purposes. It serves as a prototype to demonstrate the concept of a service exchange platform."
    },
    {
      question: "Who created SandSwitch?",
      answer: "SandSwitch was conceptualized by Valentina Perez Rojas at CEGEP John Abbott, with website development by Sohaib Kaidali."
    },
    {
      question: "How would the service exchange work?",
      answer: "The platform demonstrates how users could potentially exchange services: browsing available services, messaging other users, and arranging service exchanges. This is a prototype to showcase the concept."
    },
    {
      question: "What types of services could be exchanged?",
      answer: "The platform shows examples of various services that could be exchanged in an educational community, such as tutoring, language practice, study groups, and skill sharing."
    },
    {
      question: "How can I learn more about this project?",
      answer: "You can contact Valentina Perez Rojas to learn more about the project concept and vision."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Learn more about this student project
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </h2>
                  <span className="ml-6 flex-shrink-0">
                    <svg
                      className={`h-5 w-5 transform transition-transform duration-200 ${
                        openQuestion === index ? "rotate-180" : ""
                      } text-gray-500 dark:text-gray-400`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </button>
              {openQuestion === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 