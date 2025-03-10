"use client";

import Link from "next/link";
import { formatDate } from "../utils/dateUtils";

export default function UserProfileCard({ user }) {
  // Format joined date
  const joinedDate = formatDate(user.joinedDate);

  return (
    <div className="bg-indigo-50 dark:bg-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-shrink-0">
        <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-600 border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-2xl text-indigo-500 dark:text-indigo-300 uppercase font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>

      <div className="text-center sm:text-left">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {user.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Member since {joinedDate}
        </p>

        <div className="mt-2 flex items-center justify-center sm:justify-start">
          <div className="flex items-center">
            <svg
              className="text-yellow-400 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-1 text-gray-700 dark:text-gray-300">
              {user.rating}
            </span>
          </div>
          <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-300">
            {user.completedServices} services completed
          </span>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:ml-auto">
        <Link
          href={`/profile/${user.id}`}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
