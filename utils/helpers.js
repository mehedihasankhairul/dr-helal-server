import crypto from 'crypto';
import dayjs from 'dayjs';

/**
 * Generate a unique reference number for appointments and prescriptions
 * Format: AYYXXXXX (8 characters)
 * Where A = type (A for appointment, R for prescription), YY = 2-digit year, XXXXX = random base36 string
 */
export const generateReferenceNumber = (type = 'APT') => {
  const now = dayjs();
  const year = now.format('YY'); // 2-digit year
  
  // Generate random base36 string (5 characters using 0-9 and A-Z)
  // Using crypto.randomInt(0, 60466176) to get 5 base36 characters
  const randomPart = crypto.randomInt(0, 60466176).toString(36).toUpperCase().padStart(5, '0');
  
  const prefix = type === 'PRESCRIPTION' ? 'R' : 'A';
  
  return `${prefix}${year}${randomPart}`;
};

/**
 * Validate reference number format
 */
export const isValidReferenceNumber = (refNumber) => {
  // New format: AYYXXXXX (8 characters) - A/R + 2-digit year + 5 base36 chars
  const pattern = /^[AR]\d{2}[0-9A-Z]{5}$/;
  return pattern.test(refNumber);
};

/**
 * Generate prescription reference number
 */
export const generatePrescriptionReferenceNumber = () => {
  return generateReferenceNumber('PRESCRIPTION');
};

/**
 * Parse reference number to extract information
 */
export const parseReferenceNumber = (refNumber) => {
  if (!isValidReferenceNumber(refNumber)) {
    return null;
  }
  
  // New format: AYYXXXXX (8 characters)
  const typeChar = refNumber[0];
  const year = refNumber.substring(1, 3);
  const randomPart = refNumber.substring(3, 8);
  
  return {
    type: typeChar === 'A' ? 'appointment' : 'prescription',
    year: `20${year}`, // Convert 2-digit to 4-digit year
    randomPart: randomPart,
    original: refNumber
  };
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Get days difference from today
 */
export const getDaysFromToday = (date) => {
  return dayjs(date).diff(dayjs(), 'day');
};

/**
 * Generate a unique file name for uploads
 */
export const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const extension = originalName.split('.').pop();
  
  return `${prefix}${timestamp}-${random}.${extension}`;
};

/**
 * Sanitize string for database storage
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhone = (phone) => {
  const phonePattern = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phonePattern.test(phone);
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export default {
  generateReferenceNumber,
  generatePrescriptionReferenceNumber,
  isValidReferenceNumber,
  parseReferenceNumber,
  formatDate,
  isPastDate,
  isToday,
  getDaysFromToday,
  generateFileName,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  capitalizeWords
};
