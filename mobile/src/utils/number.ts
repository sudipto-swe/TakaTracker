/**
 * Number formatting utilities.
 */

/**
 * Format number with thousands separator (Indian/BD style: 1,00,000).
 */
export const formatNumber = (num: number): string => {
    if (isNaN(num)) return '0';

    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const numStr = absNum.toString();

    // Split into integer and decimal parts
    const parts = numStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Apply Indian/BD number formatting (last 3 digits, then groups of 2)
    if (integerPart.length > 3) {
        const lastThree = integerPart.slice(-3);
        const remainingDigits = integerPart.slice(0, -3);

        // Group remaining digits by 2
        const groups = [];
        for (let i = remainingDigits.length; i > 0; i -= 2) {
            groups.unshift(remainingDigits.slice(Math.max(0, i - 2), i));
        }

        integerPart = groups.join(',') + ',' + lastThree;
    }

    const result = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    return isNegative ? `-${result}` : result;
};

/**
 * Parse formatted number string back to number.
 */
export const parseFormattedNumber = (str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

/**
 * Round to specified decimal places.
 */
export const roundTo = (num: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};

/**
 * Clamp number between min and max.
 */
export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
};

/**
 * Calculate percentage.
 */
export const percentage = (part: number, total: number): number => {
    if (total === 0) return 0;
    return roundTo((part / total) * 100, 1);
};

/**
 * Format percentage for display.
 */
export const formatPercentage = (value: number): string => {
    return `${roundTo(value, 1)}%`;
};

/**
 * Convert Bengali digits to English.
 */
export const bengaliToEnglishDigits = (str: string): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let result = str;
    bengaliDigits.forEach((bd, index) => {
        result = result.replace(new RegExp(bd, 'g'), index.toString());
    });
    return result;
};

/**
 * Convert English digits to Bengali.
 */
export const englishToBengaliDigits = (str: string): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)]);
};
