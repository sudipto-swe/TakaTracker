import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType =
    | 'sale'
    | 'purchase'
    | 'expense';

export type ExpenseCategory =
    | 'employee'
    | 'electricity'
    | 'rent'
    | 'transport'
    | 'others';

export interface Transaction {
    id: string;
    localId: string;
    serverId?: string;
    type: TransactionType;
    referenceNumber: string;
    contactId?: string;
    contactName?: string;
    // Product details (for sale and purchase)
    productId?: string;
    productName?: string;
    quantity?: number;
    unitBuyPrice?: number;
    unitSellPrice?: number;
    unit?: string;
    // Expense details
    expenseCategory?: ExpenseCategory;
    // Amounts
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
