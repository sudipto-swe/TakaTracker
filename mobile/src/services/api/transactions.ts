/**
 * Transaction API service.
 */
import apiClient, { ApiResponse } from './client';

interface Transaction {
    id: string;
    local_id: string;
    transaction_type: string;
    reference_number: string;
    contact: string | null;
    contact_name: string;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    paid_amount: number;
    payment_mode: string;
    payment_reference: string;
    category: string;
    notes: string;
    transaction_date: string;
    is_deleted: boolean;
    items: TransactionItem[];
}

interface TransactionItem {
    id: string;
    product: string | null;
    name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount: number;
    total: number;
}

interface DashboardSummary {
    today: {
        total_sales: number;
        total_purchases: number;
        total_expenses: number;
        total_income: number;
        total_received: number;
        total_paid: number;
        gross_profit: number;
        transaction_count: number;
    };
    week: {
        total_sales: number;
        total_purchases: number;
    };
    month: {
        total_sales: number;
        total_purchases: number;
    };
    dues: {
        total_receivable: number;
        total_payable: number;
    };
    low_stock_count: number;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const transactionService = {
    /**
     * Get list of transactions with optional filters.
     */
    list: async (params?: {
        type?: string;
        date_from?: string;
        date_to?: string;
        contact?: string;
        page?: number;
    }): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
        try {
            const response = await apiClient.get('/transactions/', { params });
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch transactions',
            };
        }
    },

    /**
     * Get transaction details.
     */
    get: async (id: string): Promise<ApiResponse<Transaction>> => {
        try {
            const response = await apiClient.get(`/transactions/${id}/`);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch transaction',
            };
        }
    },

    /**
     * Create new transaction.
     */
    create: async (data: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
        try {
            const response = await apiClient.post('/transactions/', data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create transaction',
            };
        }
    },

    /**
     * Update transaction.
     */
    update: async (id: string, data: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
        try {
            const response = await apiClient.patch(`/transactions/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update transaction',
            };
        }
    },

    /**
     * Delete transaction (soft delete).
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
        try {
            await apiClient.delete(`/transactions/${id}/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete transaction',
            };
        }
    },

    /**
     * Get dashboard data.
     */
    getDashboard: async (): Promise<ApiResponse<DashboardSummary>> => {
        try {
            const response = await apiClient.get('/transactions/dashboard/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch dashboard',
            };
        }
    },

    /**
     * Get today's summary.
     */
    getTodaySummary: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await apiClient.get('/transactions/today/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch today summary',
            };
        }
    },
};
