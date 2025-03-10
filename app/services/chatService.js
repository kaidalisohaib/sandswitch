// Mock chat database - this would be replaced by Firebase in a real app
let chatMessages = [];

const chatService = {
  /**
   * Initialize the chat service with mock data
   * @param {Array} initialMessages - Initial messages from mock data
   */
  initializeWithMockData: (initialMessages) => {
    chatMessages = [...initialMessages];
  },

  /**
   * Get messages for a specific match
   * @param {string} matchId - The ID of the match
   * @returns {Array} - Messages for the match
   */
  getMessagesForMatch: (matchId) => {
    return chatMessages.filter(message => message.matchId === matchId);
  },

  /**
   * Send a new message
   * @param {Object} message - The message to send
   * @returns {Object} - The sent message with an ID
   */
  sendMessage: (message) => {
    const newMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    chatMessages.push(newMessage);
    return newMessage;
  },

  /**
   * Mark messages as read
   * @param {string} matchId - The ID of the match
   * @param {string} userId - The ID of the user marking messages as read
   * @returns {Array} - Updated messages
   */
  markMessagesAsRead: (matchId, userId) => {
    chatMessages = chatMessages.map(message => {
      // Mark messages where this user is the recipient as read
      if (message.matchId === matchId && message.receiverId === userId && !message.read) {
        return { ...message, read: true };
      }
      return message;
    });
    
    return chatMessages.filter(message => message.matchId === matchId);
  },

  /**
   * Get a list of unique chat conversations for a user
   * @param {string} userId - The user ID to find conversations for
   * @returns {Array} - Array of unique match IDs with unread count
   */
  getUserConversations: (userId) => {
    // Get unique match IDs where the user is a participant
    const uniqueMatchIds = [...new Set(
      chatMessages
        .filter(message => message.senderId === userId || message.receiverId === userId)
        .map(message => message.matchId)
    )];
    
    // For each match, get unread count and last message
    return uniqueMatchIds.map(matchId => {
      const matchMessages = chatMessages.filter(message => message.matchId === matchId);
      const unreadCount = matchMessages.filter(
        message => message.receiverId === userId && !message.read
      ).length;
      const lastMessage = matchMessages[matchMessages.length - 1];
      
      return {
        matchId,
        unreadCount,
        lastMessage
      };
    });
  },

  /**
   * Delete messages for a match
   * @param {string} matchId - The match ID
   * @returns {boolean} - Success status
   */
  deleteMessagesForMatch: (matchId) => {
    const initialLength = chatMessages.length;
    chatMessages = chatMessages.filter(message => message.matchId !== matchId);
    return chatMessages.length < initialLength;
  }
};

export default chatService; 