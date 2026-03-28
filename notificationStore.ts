/**
 * Notification store — Tracks due payment alerts for the shop owner.
 * Automatically detects overdue customers and generates in-app notifications.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderFrequency = 'daily' | 'weekly' | 'monthly';

export interface DueNotification {
    id: string;
    contactId: string;
    contactName: string;
    contactPhone?: string;
    totalDue: number;
    transactionCount: number;
    oldestDueDate: string;
    daysSinceOldest: number;
    isRead: boolean;
    createdAt: string;
}

interface NotificationState {
    notifications: DueNotification[];
    isEnabled: boolean;
    frequency: ReminderFrequency;
    minDueAmount: number;
    lastCheckedAt: string | null;
    unreadCount: number;

    // Actions
    setNotifications: (notifications: DueNotification[]) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    toggleEnabled: () => void;
    setFrequency: (frequency: ReminderFrequency) => void;
    setMinDueAmount: (amount: number) => void;
    setLastChecked: (date: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            isEnabled: true,
            frequency: 'weekly',
            minDueAmount: 100,
            lastCheckedAt: null,
            unreadCount: 0,

            setNotifications: (notifications) => set({
                notifications,
                unreadCount: notifications.filter(n => !n.isRead).length,
            }),

            markAsRead: (id) => set((state) => {
                const updated = state.notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.isRead).length,
                };
            }),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0,
            })),

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),

            setFrequency: (frequency) => set({ frequency }),

            setMinDueAmount: (amount) => set({ minDueAmount: amount }),

            setLastChecked: (date) => set({ lastCheckedAt: date }),
        }),
        {
            name: 'due-notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                notifications: state.notifications,
                isEnabled: state.isEnabled,
                frequency: state.frequency,
                minDueAmount: state.minDueAmount,
                lastCheckedAt: state.lastCheckedAt,
                unreadCount: state.unreadCount,
            }),
        }
    )
);
