import React from 'react';

const ChatMessage = ({ message, isOwn, senderName }) => {
  const messageTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`mb-4 flex ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {!isOwn && (
        <div className="flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 uppercase font-semibold text-xs">
            {senderName?.charAt(0) || "U"}
          </div>
        </div>
      )}

      <div
        className={`max-w-xs sm:max-w-md ${
          isOwn
            ? "bg-indigo-600 text-white rounded-tr-none"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none"
        } rounded-lg px-4 py-2 shadow`}
      >
        <div className="text-sm">{message.content}</div>
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
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-300 uppercase font-semibold text-xs">
            {senderName?.charAt(0) || "U"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 