/**
 * Utility functions for data validation.
 */

/**
 * Validate Bangladesh phone number.
 */
export const isValidBDPhone = (phone: string): boolean => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Must be 11 digits starting with 01
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        // Valid operators: 013, 014, 015, 016, 017, 018, 019
        const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
        return validPrefixes.some(prefix => cleaned.startsWith(prefix));
    }

    // Also accept +880 format (13 digits)
    if (cleaned.length === 13 && cleaned.startsWith('880')) {
        return isValidBDPhone('0' + cleaned.slice(3));
    }

    return false;
};

/**
 * Format phone number for display.
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }

    if (cleaned.length === 13 && cleaned.startsWith('880')) {
        return `+880 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
    }

    return phone;
};

/**
 * Validate email address.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate positive number.
 */
export const isPositiveNumber = (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
};

/**
 * Validate non-negative number (including zero).
 */
export const isNonNegativeNumber = (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
};

/**
 * Check if string is empty or whitespace only.
 */
export const isEmpty = (value: string | null | undefined): boolean => {
    return !value || value.trim().length === 0;
};

/**
 * Sanitize string input.
 */
export const sanitize = (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
};
