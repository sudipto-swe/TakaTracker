/**
 * Transaction store for managing all transactions.
 * Today's summary is computed reactively from the transactions array.
 * Data persists to AsyncStorage across app restarts.
 */
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

/** Compute all-time net profit from all transactions */
export function computeAllTimeProfit(transactions: Transaction[]): number {
    let profit = 0;
    for (const tx of transactions) {
        if (tx.type === 'sale') {
            profit += (tx.quantity || 0) * ((tx.unitSellPrice || 0) - (tx.unitBuyPrice || 0));
        } else if (tx.type === 'expense') {
            profit -= tx.amount;
        }
    }
    return profit;
}

/** Get daily sales totals for heatmap (last N days) */
export function getDailySales(transactions: Transaction[], days: number = 126): Record<string, number> {
    const result: Record<string, number> = {};
    const now = new Date();

    // Initialize all days to 0
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        result[key] = 0;
    }

    for (const tx of transactions) {
        if (tx.type !== 'sale') continue;
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (key in result) {
            result[key] += tx.amount;
        }
    }

    return result;
}

interface TransactionState {
    transactions: Transaction[];
    todaySummary: TodaySummary;
    isLoading: boolean;

    // Actions
    setTransactions: (transactions: Transaction[]) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    getTransactionById: (id: string) => Transaction | undefined;
    getTransactionsByContact: (contactId: string) => Transaction[];
    getTransactionsByType: (type: TransactionType) => Transaction[];
    setLoading: (loading: boolean) => void;
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set, get) => ({
            transactions: [],
            todaySummary: {
                totalSales: 0,
                totalPurchases: 0,
                totalExpenses: 0,
                netProfit: 0,
                receivable: 0,
                payable: 0,
                transactionCount: 0,
            },
            isLoading: false,

            setTransactions: (transactions) => {
                const todaySummary = computeTodaySummary(transactions);
                set({ transactions, todaySummary });
            },

            addTransaction: (transaction) => {
                const newTransactions = [transaction, ...get().transactions];
                const todaySummary = computeTodaySummary(newTransactions);
                set({ transactions: newTransactions, todaySummary });
            },

            updateTransaction: (id, updates) => {
                const newTransactions = get().transactions.map(t =>
                    (t.id === id || t.localId === id) ? { ...t, ...updates } : t
                );
                const todaySummary = computeTodaySummary(newTransactions);
                set({ transactions: newTransactions, todaySummary });
            },

            deleteTransaction: (id) => {
                const newTransactions = get().transactions.filter(t => t.id !== id && t.localId !== id);
                const todaySummary = computeTodaySummary(newTransactions);
                set({ transactions: newTransactions, todaySummary });
            },

            getTransactionById: (id) => {
                return get().transactions.find(t => t.id === id || t.localId === id);
            },

            getTransactionsByContact: (contactId) => {
                return get().transactions.filter(t => t.contactId === contactId);
            },

            getTransactionsByType: (type) => {
                return get().transactions.filter(t => t.type === type);
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'transaction-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                transactions: state.transactions,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.transactions) {
                    state.todaySummary = computeTodaySummary(state.transactions);
                }
            },
        }
    )
);