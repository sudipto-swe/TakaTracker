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
