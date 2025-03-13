import { format, formatDistanceToNow } from 'date-fns';

/**
 * Normalizes various timestamp formats to a JavaScript Date object
 * Handles Firebase Timestamp objects, Date objects, ISO strings, UNIX timestamps, etc.
 * @param {*} timestamp - The timestamp to normalize
 * @returns {Date|null} A JavaScript Date object or null if invalid
 */
export function normalizeTimestamp(timestamp) {
  if (!timestamp) return null;
  
  try {
    // Already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Firebase Timestamp with seconds and nanoseconds
    if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Firebase Timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Handle numeric timestamp (milliseconds since epoch)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // Handle ISO string or other string formats
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.error('Unrecognized timestamp format:', timestamp);
    return null;
  } catch (error) {
    console.error('Error normalizing timestamp:', error, timestamp);
    return null;
  }
}

/**
 * Formats a date/timestamp into a string using date-fns format
 * Handles Firebase timestamps, Date objects, ISO strings, and timestamps in seconds
 * @param {*} date - The date to format (Firebase Timestamp, Date, ISO string, or seconds)
 * @param {string} formatStr - The date-fns format string to use (default: 'MMM d, yyyy')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  const normalizedDate = normalizeTimestamp(date);
  if (!normalizedDate) return '';
  
  try {
    return format(normalizedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export function formatTimeAgo(date) {
  const normalizedDate = normalizeTimestamp(date);
  
  if (!normalizedDate) {
    console.debug('Could not normalize date value:', date);
    return 'Recently';
  }
  
  try {
    return formatDistanceToNow(normalizedDate, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time ago:', error, date);
    return 'Recently';
  }
} 