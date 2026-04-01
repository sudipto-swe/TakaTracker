/**
 * Internationalization setup with Bengali (bn) and English (en) support.
 */
import { I18n } from 'i18n-js';
import bn from './locales/bn.json';
import en from './locales/en.json';

const i18n = new I18n({
    bn,
    en,
});

// Default to Bengali
i18n.defaultLocale = 'bn';
i18n.locale = 'bn';

// Enable fallbacks (show English if Bengali translation missing)
i18n.enableFallback = true;

export default i18n;

/**
 * Translate helper function.
 * Usage: t('dashboard.title') => returns translated string
 * Note: This is NOT reactive — use useT() inside components instead.
 */
export const t = (key: string, options?: object): string => {
    return i18n.t(key, options);
};

/**
 * Set the current language.
 */
export const setLanguage = (language: 'bn' | 'en'): void => {
    i18n.locale = language;
};

/**
 * Get current language.
 */
export const getLanguage = (): string => {
    return i18n.locale;
};

/**
 * Format currency in BDT.
 */
export const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '৳0';

    // Format with comma separators
    const formatted = num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return `৳${formatted}`;
};

/**
 * Format date in Bengali-friendly format.
 */
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (i18n.locale === 'bn') {
        const months = [
            'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
            'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];
        return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    }

    return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};
