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
