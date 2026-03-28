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

    /**
     * Full sync: push → pull.
     */
    async triggerSync(): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            itemsPushed: 0,
            itemsPulled: 0,
            errors: [],
        };

        if (this._isSyncing) {
            result.errors.push('Sync already in progress');
            return result;
        }

        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
            result.errors.push('Not authenticated');
            return result;
        }

        try {
            this._isSyncing = true;
            useSyncStore.getState().setSyncing(true);
            console.log('[Sync] Starting sync...');

            // Step 1: Push local changes
            const pushResult = await this.pushLocalChanges();
            result.itemsPushed = pushResult.count;
            result.errors.push(...pushResult.errors);

            // Step 2: Pull server changes
            const pullResult = await this.pullServerChanges();
            result.itemsPulled = pullResult.count;
            result.errors.push(...pullResult.errors);

            // Save timestamp
            const now = new Date().toISOString();
            await AsyncStorage.setItem(LAST_SYNC_KEY, now);
            this._lastSyncAt = now;
            result.syncedAt = now;
            useSyncStore.getState().setLastSync(now);

            result.success = result.errors.length === 0;
            console.log(`[Sync] Done: ${result.itemsPushed} pushed, ${result.itemsPulled} pulled`);
        } catch (error) {
            console.error('[Sync] Error:', error);
            result.errors.push((error as Error).message);
        } finally {
            this._isSyncing = false;
            useSyncStore.getState().setSyncing(false);
        }

        return result;
    }
