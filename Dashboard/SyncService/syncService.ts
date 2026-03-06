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