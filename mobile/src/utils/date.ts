/**
 * Date utility functions.
 */

/**
 * Get start of today.
 */
export const getStartOfToday = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

/**
 * Get end of today.
 */
export const getEndOfToday = (): Date => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
};

/**
 * Get start of week (Saturday in Bangladesh).
 */
export const getStartOfWeek = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 6 ? 0 : day + 1; // Saturday = 0
    now.setDate(now.getDate() - diff);
    now.setHours(0, 0, 0, 0);
    return now;
};

/**
 * Get start of month.
 */
export const getStartOfMonth = (): Date => {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now;
};

/**
 * Get start of year.
 */
export const getStartOfYear = (): Date => {
    const now = new Date();
    now.setMonth(0, 1);
    now.setHours(0, 0, 0, 0);
    return now;
};

/**
 * Check if date is today.
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Check if date is this week.
 */
export const isThisWeek = (date: Date): boolean => {
    const startOfWeek = getStartOfWeek();
    return date >= startOfWeek;
};

/**
 * Check if date is this month.
 */
export const isThisMonth = (date: Date): boolean => {
    const now = new Date();
    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
};

/**
 * Get relative time string.
 */
export const getRelativeTime = (date: Date, locale: 'bn' | 'en' = 'bn'): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (locale === 'bn') {
        if (diffDays === 0) return 'আজ';
        if (diffDays === 1) return 'গতকাল';
        if (diffDays < 7) return `${diffDays} দিন আগে`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} মাস আগে`;
        return `${Math.floor(diffDays / 365)} বছর আগে`;
    } else {
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }
};

/**
 * Format date range for display.
 */
export const formatDateRange = (start: Date, end: Date, locale: 'bn' | 'en' = 'bn'): string => {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short'
    };
    const startStr = start.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', options);
    const endStr = end.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', options);
    return `${startStr} - ${endStr}`;
};
