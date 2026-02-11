import { Alert } from 'react-native';

/**
 * Input validation utilities for the TNT app.
 * Provides comprehensive validation for user inputs, file uploads, and data integrity.
 */

/**
 * Phone number validation
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check length (Indian mobile numbers are 10 digits)
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }

  // Check if it starts with valid prefixes (6-9 for Indian mobiles)
  if (!cleanPhone.startsWith('6') &&
      !cleanPhone.startsWith('7') &&
      !cleanPhone.startsWith('8') &&
      !cleanPhone.startsWith('9')) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  return { isValid: true };
}

/**
 * OTP validation
 */
export function validateOTP(otp: string): { isValid: boolean; error?: string } {
  // OTP should be exactly 6 digits
  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: 'OTP must be 6 digits' };
  }

  return { isValid: true };
}

/**
 * File validation for uploads
 */
export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  maxFileNameLength?: number;
}

export function validateFile(
  file: { name: string; size: number; mimeType?: string },
  options: FileValidationOptions = {}
): { isValid: boolean; error?: string; warnings?: string[] } {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf'],
    maxFileNameLength = 255,
  } = options;

  const warnings: string[] = [];

  // Check file name
  if (file.name.length > maxFileNameLength) {
    return { isValid: false, error: 'File name is too long' };
  }

  // Check file name for suspicious characters
  if (/[<>:*?"|]/.test(file.name)) {
    return { isValid: false, error: 'File name contains invalid characters' };
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size exceeds ${formatFileSize(maxSizeBytes)} limit` };
  }

  // Warning for large files
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file detected - upload may take longer');
  }

  // Check file type
  if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
    return { isValid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
  }

  // Check file extension matches mime type for PDFs
  if (file.mimeType === 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { isValid: false, error: 'File extension does not match PDF type' };
  }

  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Numeric input validation
 */
export function validateNumericInput(
  value: string,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    integerOnly?: boolean;
  } = {}
): { isValid: boolean; error?: string; sanitizedValue?: number } {
  const { min, max, required = false, integerOnly = false } = options;

  // Check if required
  if (required && (!value || value.trim() === '')) {
    return { isValid: false, error: 'This field is required' };
  }

  // Allow empty for optional fields
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, sanitizedValue: undefined };
  }

  // Parse number
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  // Check integer requirement
  if (integerOnly && !Number.isInteger(num)) {
    return { isValid: false, error: 'Please enter a whole number' };
  }

  // Check min value
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  // Check max value
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }

  return { isValid: true, sanitizedValue: num };
}

/**
 * Quantity validation for orders
 */
export function validateQuantity(quantity: string): { isValid: boolean; error?: string; value?: number } {
  return validateNumericInput(quantity, {
    min: 1,
    max: 100,
    required: true,
    integerOnly: true,
  });
}

/**
 * Copies validation for printing
 */
export function validateCopies(copies: string): { isValid: boolean; error?: string; value?: number } {
  return validateNumericInput(copies, {
    min: 1,
    max: 50,
    required: true,
    integerOnly: true,
  });
}

/**
 * Email validation (for future use)
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Password validation (for future use)
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain uppercase, lowercase, and number' };
  }

  return { isValid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, options: { maxLength?: number; trim?: boolean } = {}): string {
  const { maxLength, trim = true } = options;

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"&]/g, '');

  return sanitized;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Show validation error alert
 */
export function showValidationError(error: string) {
  Alert.alert('Validation Error', error, [{ text: 'OK' }]);
}

/**
 * Show validation warnings
 */
export function showValidationWarnings(warnings: string[]) {
  if (warnings.length === 0) return;

  const message = warnings.join('\n\n');
  Alert.alert('Warning', message, [{ text: 'Continue' }, { text: 'Cancel', style: 'cancel' }]);
}
