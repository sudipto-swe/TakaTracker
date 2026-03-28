/**
 * Transaction Store Unit Tests
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useTransactionStore } from '../../store/transactionStore';

const mockTransaction = {
    id: '1',
    localId: 'local-1',
    type: 'sale' as const,
    amount: 1000,
    paidAmount: 500,
    dueAmount: 500,
    contactId: 'contact-1',
    contactName: 'Test Customer',
    notes: 'Test transaction',
    date: new Date('2026-02-08'),
    isSynced: false,
};

describe('TransactionStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useTransactionStore.setState({
            transactions: [],
            todaySummary: {
                totalSales: 0,
                totalPurchases: 0,
                totalExpenses: 0,
                receivable: 0,
                payable: 0,
            },
            isLoading: false,
        });
    });

    describe('addTransaction', () => {
        it('should add a transaction to the list', () => {
            const { result } = renderHook(() => useTransactionStore());

            act(() => {
                result.current.addTransaction(mockTransaction);
            });

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0]).toEqual(mockTransaction);
        });

        it('should add multiple transactions', () => {
            const { result } = renderHook(() => useTransactionStore());

            const transaction2 = { ...mockTransaction, id: '2', localId: 'local-2' };

            act(() => {
                result.current.addTransaction(mockTransaction);
                result.current.addTransaction(transaction2);
            });

            expect(result.current.transactions).toHaveLength(2);
        });
    });

    describe('updateTransaction', () => {
        it('should update an existing transaction', () => {
            const { result } = renderHook(() => useTransactionStore());

            act(() => {
                result.current.addTransaction(mockTransaction);
            });

            act(() => {
                result.current.updateTransaction('1', { amount: 2000 });
            });

            expect(result.current.transactions[0].amount).toBe(2000);
        });

        it('should not modify other transactions', () => {
            const { result } = renderHook(() => useTransactionStore());
            const transaction2 = { ...mockTransaction, id: '2', localId: 'local-2', amount: 500 };

            act(() => {
                result.current.addTransaction(mockTransaction);
                result.current.addTransaction(transaction2);
            });

            act(() => {
                result.current.updateTransaction('1', { amount: 2000 });
            });

            expect(result.current.transactions[1].amount).toBe(500);
        });
    });

    describe('deleteTransaction', () => {
        it('should remove a transaction from the list', () => {
            const { result } = renderHook(() => useTransactionStore());

            act(() => {
                result.current.addTransaction(mockTransaction);
            });

            expect(result.current.transactions).toHaveLength(1);

            act(() => {
                result.current.deleteTransaction('1');
            });

            expect(result.current.transactions).toHaveLength(0);
        });
    });

    describe('updateTodaySummary', () => {
        it('should update today summary correctly', () => {
            const { result } = renderHook(() => useTransactionStore());

            const summary = {
                totalSales: 10000,
                totalPurchases: 5000,
                totalExpenses: 1000,
                receivable: 3000,
                payable: 2000,
            };

            act(() => {
                result.current.updateTodaySummary(summary);
            });

            expect(result.current.todaySummary).toEqual(summary);
        });
    });

    describe('getTransactionsByType', () => {
        it('should filter transactions by type', () => {
            const { result } = renderHook(() => useTransactionStore());

            const purchaseTransaction = { ...mockTransaction, id: '2', type: 'purchase' as const };
            const expenseTransaction = { ...mockTransaction, id: '3', type: 'expense' as const };

            act(() => {
                result.current.addTransaction(mockTransaction); // sale
                result.current.addTransaction(purchaseTransaction);
                result.current.addTransaction(expenseTransaction);
            });

            const sales = result.current.getTransactionsByType('sale');
            expect(sales).toHaveLength(1);
            expect(sales[0].type).toBe('sale');
        });
    });
});
