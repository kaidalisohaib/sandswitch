import React from 'react';
import { format } from 'date-fns';
import { normalizeTimestamp } from '../utils/dateUtils';

const ChatMessage = ({ message, isOwn, senderName }) => {
  // Safely normalize the timestamp before formatting
  const formatMessageTime = (timestamp) => {
    try {
      const normalizedDate = normalizeTimestamp(timestamp);
      if (!normalizedDate) return 'Unknown time';
      
      return format(normalizedDate, 'p'); // 'p' format for 12-hour time (e.g., 10:15 AM)
    } catch (error) {
      console.error('Error formatting message time:', error);
      return 'Unknown time';
    }
  };

  const messageTime = formatMessageTime(message.timestamp);

  return (
    <div
      className={`mb-3 flex ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {!isOwn && (
        <div className="flex-shrink-0 mr-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold text-xs">
            {senderName?.charAt(0) || "U"}
          </div>
        </div>
      )}

      <div
        className={`max-w-[75%] sm:max-w-[70%] md:max-w-[65%] ${
          isOwn
            ? "bg-indigo-600 text-white rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-lg"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none rounded-tr-lg rounded-bl-lg rounded-br-lg"
        } px-3 py-2 sm:px-4 sm:py-2 shadow-sm break-words overflow-wrap-break-word overflow-hidden`}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            isOwn
              ? "text-indigo-200"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {messageTime}
        </div>
      </div>

      {isOwn && (
        <div className="flex-shrink-0 ml-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold text-xs">
            {senderName?.charAt(0) || "U"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 