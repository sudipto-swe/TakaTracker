/**
 * App configuration constants.
 */

export const API_CONFIG = {
    // Change this to your backend URL
    BASE_URL: __DEV__ ? 'http://localhost:8000/api/v1' : 'https://api.takatracker.com/api/v1',
    TIMEOUT: 30000,
};

export const APP_CONFIG = {
    APP_NAME: 'TakaTracker',
    APP_NAME_BN: 'টাকাট্র্যাকার',
    VERSION: '1.0.0',

    // Sync settings
    SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    SYNC_RETRY_DELAY_MS: 30 * 1000,  // 30 seconds

    // Pagination
    DEFAULT_PAGE_SIZE: 20,

    // OTP
    OTP_LENGTH: 6,
    OTP_RESEND_DELAY_SECONDS: 60,

    // Currency
    CURRENCY_CODE: 'BDT',
    CURRENCY_SYMBOL: '৳',

    // Default language
    DEFAULT_LANGUAGE: 'bn',
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: '@auth_token',
    REFRESH_TOKEN: '@refresh_token',
    USER_DATA: '@user_data',
    LANGUAGE: '@language',
    LAST_SYNC: '@last_sync',
    OFFLINE_QUEUE: '@offline_queue',
};

export const TRANSACTION_TYPES = {
    SALE: 'sale',
    PURCHASE: 'purchase',
    EXPENSE: 'expense',
} as const;

export const PAYMENT_MODES = {
    CASH: 'cash',
    BKASH: 'bkash',
    NAGAD: 'nagad',
    ROCKET: 'rocket',
    BANK: 'bank',
    CREDIT: 'credit',
    OTHER: 'other',
} as const;

export const CONTACT_TYPES = {
    CUSTOMER: 'customer',
    SUPPLIER: 'supplier',
    BOTH: 'both',
} as const;
