/**
 * Currency and Date Formatting Tests (i18n)
 */
import { formatCurrency, formatDate, t, setLanguage, getLanguage } from '../../i18n';

describe('formatCurrency', () => {
    it('should format positive numbers with Taka symbol', () => {
        expect(formatCurrency(1000)).toBe('৳1,000');
        expect(formatCurrency(50)).toBe('৳50');
        expect(formatCurrency(1234567)).toBe('৳12,34,567');
    });

    it('should handle decimal numbers', () => {
        expect(formatCurrency(1000.5)).toBe('৳1,000.5');
        expect(formatCurrency(99.99)).toBe('৳99.99');
    });

    it('should handle zero', () => {
        expect(formatCurrency(0)).toBe('৳0');
    });

    it('should handle string amounts', () => {
        expect(formatCurrency('500')).toBe('৳500');
        expect(formatCurrency('1234.56')).toBe('৳1,234.56');
    });

    it('should handle invalid input', () => {
        expect(formatCurrency(NaN)).toBe('৳0');
        expect(formatCurrency('invalid')).toBe('৳0');
    });
});

describe('formatDate', () => {
    const testDate = new Date('2026-02-08T12:00:00');

    it('should format date in Bengali when locale is bn', () => {
        setLanguage('bn');
        const formatted = formatDate(testDate);
        expect(formatted).toContain('ফেব্রুয়ারি');
        expect(formatted).toContain('8');
        expect(formatted).toContain('2026');
    });

    it('should format date in English when locale is en', () => {
        setLanguage('en');
        const formatted = formatDate(testDate);
        expect(formatted).toContain('Feb');
        expect(formatted).toContain('8');
        expect(formatted).toContain('2026');
    });

    it('should handle string dates', () => {
        setLanguage('bn');
        const formatted = formatDate('2026-02-08');
        expect(formatted).toContain('ফেব্রুয়ারি');
    });
});

describe('Translation (t)', () => {
    beforeAll(() => {
        setLanguage('bn');
    });

    it('should return Bengali translations', () => {
        expect(t('common.appName')).toBe('ট্যালিখাতা');
        expect(t('dashboard.title')).toBe('ড্যাশবোর্ড');
        expect(t('transactions.sale')).toBe('বিক্রয়');
    });

    it('should handle nested keys', () => {
        expect(t('auth.login')).toBe('লগইন');
        expect(t('auth.logout')).toBe('লগআউট');
    });

    it('should return key if translation not found', () => {
        const missingKey = 'missing.key.here';
        const result = t(missingKey);
        expect(result).toContain('missing');
    });
});

describe('Language Switching', () => {
    it('should switch language correctly', () => {
        setLanguage('en');
        expect(getLanguage()).toBe('en');

        setLanguage('bn');
        expect(getLanguage()).toBe('bn');
    });

    it('should affect translations after switch', () => {
        setLanguage('en');
        // Note: English translations would be tested if en.json exists

        setLanguage('bn');
        expect(t('common.save')).toBe('সংরক্ষণ করুন');
    });
});
