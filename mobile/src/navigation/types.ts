/**
 * Navigation type definitions.
 */
import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    OTP: {
        phone: string;
        purpose: 'register' | 'forgot-password';
        name?: string;
        businessName?: string;
        password?: string;
    };
    ForgotPassword: undefined;
    ResetPassword: { phone: string };
};

// Main Tab Navigator
export type MainTabParamList = {
    Home: undefined;
    Transactions: undefined;
    Add: undefined;
    Contacts: undefined;
    More: undefined;
};

// Dashboard Stack
export type DashboardStackParamList = {
    DashboardMain: undefined;
    Notifications: undefined;
};

// Transaction Stack
export type TransactionStackParamList = {
    TransactionList: undefined;
    AddTransaction: { type?: string };
    TransactionDetail: { id: string };
    EditTransaction: { id: string };
};

// Contact Stack
export type ContactStackParamList = {
    ContactList: { type?: 'customer' | 'supplier' };
    AddContact: { type?: 'customer' | 'supplier' };
    ContactDetail: { id: string };
    EditContact: { id: string };
    DuesList: undefined;
};

// Inventory Stack
export type InventoryStackParamList = {
    InventoryList: undefined;
    AddProduct: undefined;
    ProductDetail: { id: string };
    EditProduct: { id: string };
    LowStock: undefined;
    BarcodeScanner: undefined;
};

// Payment Stack
export type PaymentStackParamList = {
    QRPayment: undefined;
    QRScanner: undefined;
    Wallet: undefined;
    PaymentHistory: undefined;
};

// Reports Stack
export type ReportStackParamList = {
    ReportsMain: undefined;
    DailyReport: { date?: string };
    WeeklyReport: undefined;
    MonthlyReport: undefined;
    DuesReport: undefined;
};

// Settings Stack
export type SettingsStackParamList = {
    SettingsMain: undefined;
    Profile: undefined;
    Language: undefined;
    SyncSettings: undefined;
    About: undefined;
};

// Root Navigator
export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainTabParamList>;
    AddTransaction: { type?: string; contactId?: string };
    Inventory: undefined;
    QRPayment: undefined;
    Reports: undefined;
    AddContact: { type?: 'customer' | 'supplier' };
    ContactDetail: { id: string };
    Notifications: undefined;
    Predictions: undefined;
    ChatBot: undefined;
};

// Helper type for useNavigation hook
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
