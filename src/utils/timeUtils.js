/**
 * Utility functions for time formatting and calculations
 */

/**
 * Format seconds into HH:MM:SS format
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} - Formatted time string
 */
export const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Format seconds into human-readable duration
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} - Human-readable duration
 */
export const formatDurationText = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours} giờ `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes} phút `;
  }
  
  if (seconds > 0 || (hours === 0 && minutes === 0)) {
    result += `${seconds} giây`;
  }
  
  return result.trim();
};

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return dateObj.toLocaleDateString('vi-VN', options);
};

/**
 * Format date to relative time (e.g., "2 giờ trước")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return 'Vừa xong';
  } else if (diffMin < 60) {
    return `${diffMin} phút trước`;
  } else if (diffHour < 24) {
    return `${diffHour} giờ trước`;
  } else if (diffDay < 30) {
    return `${diffDay} ngày trước`;
  } else if (diffMonth < 12) {
    return `${diffMonth} tháng trước`;
  } else {
    return `${diffYear} năm trước`;
  }
};

/**
 * Format time from 24h to 12h format
 * @param {string} time - Time in 24h format (HH:MM)
 * @returns {string} - Time in 12h format
 */
export const format24hTo12h = (time) => {
  if (!time || !time.includes(':')) return time;
  
  const [hours, minutes] = time.split(':');
  const hoursNum = parseInt(hours, 10);
  
  if (hoursNum === 0) {
    return `12:${minutes} AM`;
  } else if (hoursNum < 12) {
    return `${hoursNum}:${minutes} AM`;
  } else if (hoursNum === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hoursNum - 12}:${minutes} PM`;
  }
};

/**
 * Format time from 12h to 24h format
 * @param {string} time - Time in 12h format (h:mm AM/PM)
 * @returns {string} - Time in 24h format
 */
export const format12hTo24h = (time) => {
  if (!time) return time;
  
  const [timePart, meridiem] = time.split(' ');
  const [hours, minutes] = timePart.split(':');
  const hoursNum = parseInt(hours, 10);
  
  if (meridiem === 'AM') {
    if (hoursNum === 12) {
      return `00:${minutes}`;
    } else {
      return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
    }
  } else {
    if (hoursNum === 12) {
      return `12:${minutes}`;
    } else {
      return `${(hoursNum + 12).toString()}:${minutes}`;
    }
  }
};

/**
 * Get start and end of week dates
 * @param {Date} date - Date within the week
 * @returns {Object} - Start and end dates of the week
 */
export const getWeekRange = (date = new Date()) => {
  const day = date.getDay();
  const startDiff = day === 0 ? 6 : day - 1; // Adjust for Sunday
  
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - startDiff);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

/**
 * Get start and end of month dates
 * @param {Date} date - Date within the month
 * @returns {Object} - Start and end dates of the month
 */
export const getMonthRange = (date = new Date()) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
};

/**
 * Get days of week in locale format
 * @param {string} locale - Locale string (default: 'vi-VN')
 * @returns {Array} - Array of day names
 */
export const getDaysOfWeek = (locale = 'vi-VN') => {
  const baseDate = new Date(2023, 0, 2); // Monday
  const daysOfWeek = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);
    daysOfWeek.push(day.toLocaleDateString(locale, { weekday: 'short' }));
  }
  
  return daysOfWeek;
};

/**
 * Get months of year in locale format
 * @param {string} locale - Locale string (default: 'vi-VN')
 * @returns {Array} - Array of month names
 */
export const getMonthsOfYear = (locale = 'vi-VN') => {
  const months = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(2023, i, 1);
    months.push(date.toLocaleDateString(locale, { month: 'long' }));
  }
  
  return months;
};

/**
 * Check if two date ranges overlap
 * @param {Date} start1 - Start of first range
 * @param {Date} end1 - End of first range
 * @param {Date} start2 - Start of second range
 * @param {Date} end2 - End of second range
 * @returns {boolean} - Whether the ranges overlap
 */
export const doDateRangesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && start2 <= end1;
};

/**
 * Get duration between two dates in seconds
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Duration in seconds
 */
export const getDurationInSeconds = (startDate, endDate) => {
  return Math.floor((endDate - startDate) / 1000);
};

/**
 * Add days to a date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}; 