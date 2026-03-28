/**
 * Sync API service for offline data synchronization.
 */
import apiClient, { ApiResponse } from './client';

interface SyncPullResponse {
    success: boolean;
    synced_at: string;
    contacts?: any[];
    transactions?: any[];
    products?: any[];
}

interface SyncPushResponse {
    success: boolean;
    synced_at: string;
    synced: {
        contacts: number;
        transactions: number;
        products: number;
    };
    conflicts: any[];
    conflict_count: number;
}

interface SyncStatusResponse {
    success: boolean;
    last_sync_at: string | null;
    counts: {
        contacts: number;
        transactions: number;
        products: number;
    };
}

export const syncService = {
    /**
     * Pull data from server.
     */
    pull: async (params?: {
        last_sync_at?: string;
        models?: ('contacts' | 'transactions' | 'products')[];
    }): Promise<ApiResponse<SyncPullResponse>> => {
        try {
            const response = await apiClient.post('/sync/pull/', params || {});
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to pull data',
            };
        }
    },

    /**
     * Push data to server.
     */
    push: async (data: {
        contacts?: any[];
        transactions?: any[];
        products?: any[];
    }): Promise<ApiResponse<SyncPushResponse>> => {
        try {
            const response = await apiClient.post('/sync/push/', data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to push data',
            };
        }
    },

    /**
     * Get sync status.
     */
    getStatus: async (): Promise<ApiResponse<SyncStatusResponse>> => {
        try {
            const response = await apiClient.get('/sync/status/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get sync status',
            };
        }
    },
};
