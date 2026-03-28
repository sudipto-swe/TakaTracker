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
