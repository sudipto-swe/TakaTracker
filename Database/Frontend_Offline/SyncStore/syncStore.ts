/**
 * Sync store for managing offline data queue and sync status.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { produce } from 'immer';

interface SyncItem {
    id: string;
    type: 'contact' | 'transaction' | 'product';
    action: 'create' | 'update' | 'delete';
    data: any;
    createdAt: string;
    retryCount: number;
}

interface SyncConflict {
    id: string;
    type: string;
    localData: any;
    serverData: any;
    createdAt: string;
}

interface SyncState {
    // Queue of items waiting to sync
    queue: SyncItem[];

    // Conflicts that need manual resolution
    conflicts: SyncConflict[];

    // Status
    isSyncing: boolean;
    lastSyncAt: string | null;
    isOnline: boolean;

    // Stats
    pendingCount: number;

    // Actions
    addToQueue: (item: Omit<SyncItem, 'id' | 'createdAt' | 'retryCount'>) => void;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;

    addConflict: (conflict: Omit<SyncConflict, 'id' | 'createdAt'>) => void;
    resolveConflict: (id: string) => void;

    setSyncing: (syncing: boolean) => void;
    setLastSync: (date: string) => void;
    setOnline: (online: boolean) => void;

    incrementRetry: (id: string) => void;
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            queue: [],
            conflicts: [],
            isSyncing: false,
            lastSyncAt: null,
            isOnline: true,
            pendingCount: 0,

            addToQueue: (item) => set(
                produce((state: SyncState) => {
                    const newItem: SyncItem = {
                        ...item,
                        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        createdAt: new Date().toISOString(),
                        retryCount: 0,
                    };
                    state.queue.push(newItem);
                    state.pendingCount = state.queue.length;
                })
            ),

            removeFromQueue: (id) => set(
                produce((state: SyncState) => {
                    state.queue = state.queue.filter(item => item.id !== id);
                    state.pendingCount = state.queue.length;
                })
            ),

            clearQueue: () => set({ queue: [], pendingCount: 0 }),

            addConflict: (conflict) => set(
                produce((state: SyncState) => {
                    state.conflicts.push({
                        ...conflict,
                        id: `conflict_${Date.now()}`,
                        createdAt: new Date().toISOString(),
                    });
                })
            ),

            resolveConflict: (id) => set(
                produce((state: SyncState) => {
                    state.conflicts = state.conflicts.filter(c => c.id !== id);
                })
            ),

            setSyncing: (syncing) => set({ isSyncing: syncing }),

            setLastSync: (date) => set({ lastSyncAt: date }),

            setOnline: (online) => set({ isOnline: online }),

            incrementRetry: (id) => set(
                produce((state: SyncState) => {
                    const item = state.queue.find(i => i.id === id);
                    if (item) {
                        item.retryCount += 1;
                    }
                })
            ),
        }),
        {
            name: 'sync-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                queue: state.queue,
                lastSyncAt: state.lastSyncAt,
                pendingCount: state.pendingCount,
            }),
        }
    )
);
