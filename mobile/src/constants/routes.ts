/**
 * Route names for navigation.
 */

export const ROUTES = {
    // Auth Stack
    AUTH: {
        LOGIN: 'Login',
        OTP: 'OTP',
        REGISTER: 'Register',
        ONBOARDING: 'Onboarding',
    },

    // Main Tabs
    TABS: {
        HOME: 'Home',
        TRANSACTIONS: 'Transactions',
        ADD: 'Add',
        CONTACTS: 'Contacts',
        MORE: 'More',
    },

    // Dashboard Stack
    DASHBOARD: {
        MAIN: 'DashboardMain',
        NOTIFICATIONS: 'Notifications',
    },

    // Transactions Stack
    TRANSACTION: {
        LIST: 'TransactionList',
        ADD: 'AddTransaction',
        DETAIL: 'TransactionDetail',
        EDIT: 'EditTransaction',
    },

    // Contacts Stack
    CONTACT: {
        LIST: 'ContactList',
        ADD: 'AddContact',
        DETAIL: 'ContactDetail',
        EDIT: 'EditContact',
        DUES: 'DuesList',
    },

    // Inventory Stack
    INVENTORY: {
        LIST: 'InventoryList',
        ADD: 'AddProduct',
        DETAIL: 'ProductDetail',
        EDIT: 'EditProduct',
        LOW_STOCK: 'LowStock',
    },

    // Payments Stack
    PAYMENT: {
        QR: 'QRPayment',
        SCAN: 'QRScanner',
        WALLET: 'Wallet',
        HISTORY: 'PaymentHistory',
    },

    // Reports Stack
    REPORTS: {
        MAIN: 'ReportsMain',
        DAILY: 'DailyReport',
        WEEKLY: 'WeeklyReport',
        MONTHLY: 'MonthlyReport',
        DUES: 'DuesReport',
    },

    // Settings
    SETTINGS: {
        MAIN: 'SettingsMain',
        PROFILE: 'Profile',
        LANGUAGE: 'Language',
        SYNC: 'SyncSettings',
        ABOUT: 'About',
    },
} as const;
