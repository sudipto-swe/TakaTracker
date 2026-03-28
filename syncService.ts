/**
 * Background sync service — connects Zustand stores to Django backend.
 * Push unsynced data → server, then pull server changes → local stores.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService as syncAPI } from './api/sync';
import { useTransactionStore, Transaction } from '../store/transactionStore';
import { useInventoryStore, Product } from '../store/inventoryStore';
import { useContactStore, Contact } from '../store/contactStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { STORAGE_KEYS } from '../constants/config';

const LAST_SYNC_KEY = STORAGE_KEYS.LAST_SYNC;
const SYNC_LOCK_KEY = '@sync_lock';

export interface SyncResult {
    success: boolean;
    itemsPushed: number;
    itemsPulled: number;
    errors: string[];
    syncedAt?: string;
}

class BackgroundSyncService {
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private _isSyncing = false;
    private _lastSyncAt: string | null = null;

    get isSyncing() { return this._isSyncing; }
    get lastSyncAt() { return this._lastSyncAt; }

    /**
     * Initialize: load last sync time.
     */
    async initialize(): Promise<void> {
        this._lastSyncAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
    }

    /**
     * Start periodic sync (default 5 min).
     */
    startPeriodicSync(intervalMs = 5 * 60 * 1000): void {
        this.stopPeriodicSync();
        this.syncInterval = setInterval(() => {
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
                this.triggerSync();
            }
        }, intervalMs);
    }

    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
