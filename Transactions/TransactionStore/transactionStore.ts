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

export interface TodaySummary {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    netProfit: number;
    receivable: number;
    payable: number;
    transactionCount: number;
}

/** Compute today's summary from the full transaction list */
function computeTodaySummary(transactions: Transaction[]): TodaySummary {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    const summary: TodaySummary = {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        netProfit: 0,
        receivable: 0,
        payable: 0,
        transactionCount: 0,
    };

    for (const tx of transactions) {
        const txDate = new Date(tx.date);
        const txStr = `${txDate.getFullYear()}-${txDate.getMonth()}-${txDate.getDate()}`;

        if (txStr !== todayStr) continue;

        summary.transactionCount++;

        switch (tx.type) {
            case 'sale': {
                summary.totalSales += tx.amount;
                summary.receivable += tx.dueAmount;
                // Profit = (sellPrice - buyPrice) × quantity
                const sellProfit = (tx.quantity || 0) * ((tx.unitSellPrice || 0) - (tx.unitBuyPrice || 0));
                summary.netProfit += sellProfit;
                break;
            }
            case 'purchase':
                summary.totalPurchases += tx.amount;
                summary.payable += tx.dueAmount;
                break;
            case 'expense':
                summary.totalExpenses += tx.amount;
                summary.netProfit -= tx.amount;
                break;
        }
    }

    return summary;
}