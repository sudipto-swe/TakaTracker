/**
 * Type definitions for TypeScript.
 */

// User types
export interface User {
    id: string;
    phone: string;
    name: string;
    businessName: string;
    businessType?: string;
    address?: string;
    profileImage?: string;
    role: 'merchant' | 'staff';
    language: 'bn' | 'en';
    isVerified: boolean;
}

// Contact types
export interface Contact {
    id: string;
    localId: string;
    serverId?: string;
    type: 'customer' | 'supplier';
    name: string;
    phone?: string;
    address?: string;
    balance: number;
    creditLimit: number;
    notes?: string;
    isSynced: boolean;
    syncedAt?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Transaction types
export type TransactionType =
    | 'sale'
    | 'purchase'
    | 'expense'
    | 'payment_in'
    | 'payment_out'
    | 'return_in'
    | 'return_out';

export interface Transaction {
    id: string;
    localId: string;
    serverId?: string;
    type: TransactionType;
    referenceNumber: string;
    contactId?: string;
    contactName?: string;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    discount: number;
    notes?: string;
    paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
    date: Date;
    isSynced: boolean;
    syncedAt?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Product types
export interface Product {
    id: string;
    localId: string;
    serverId?: string;
    sku?: string;
    name: string;
    category?: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    unit: string;
    lowStockThreshold: number;
    notes?: string;
    isSynced: boolean;
    syncedAt?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Dashboard summary
export interface DashboardSummary {
    todaySales: number;
    todayPurchases: number;
    todayExpenses: number;
    totalReceivable: number;
    totalPayable: number;
    transactionCount: number;
}

// Report types
export interface ReportData {
    period: 'today' | 'week' | 'month' | 'year' | 'custom';
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalPaymentsIn: number;
    totalPaymentsOut: number;
    netProfit: number;
    transactions: Transaction[];
}

// Sync types
export interface SyncStatus {
    lastSyncTime: Date | null;
    pendingChanges: number;
    isOnline: boolean;
    isSyncing: boolean;
}

// API response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    message_bn?: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
