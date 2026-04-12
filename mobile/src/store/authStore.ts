/**
 * Authentication store using Zustand with RBAC permissions.
 * Manages user state, tokens, permissions, and auth actions.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { DEFAULT_PERMISSIONS } from '../rbac/ability';

interface User {
    id: string;
    phone: string;
    name: string;
    businessName: string;
    businessType?: string;
    address?: string;
    profileImage?: string;
    role: 'merchant' | 'staff' | 'admin';
    language: 'bn' | 'en';
    isVerified: boolean;
}

interface RegisteredUser {
    password: string;
    user: User;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    registeredUsers: Record<string, RegisteredUser>; // phone -> credentials
    permissions: string[]; // RBAC permission codenames

    // Actions
    setUser: (user: User) => void;
    setTokens: (access: string, refresh: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
    setPermissions: (permissions: string[]) => void;

    // Password-based auth actions
    registerUser: (user: User, password: string) => void;
    loginUser: (phone: string, password: string) => { success: boolean; error?: string };
    isPhoneRegistered: (phone: string) => boolean;
    resetPassword: (phone: string, newPassword: string) => boolean;
}

/**
 * Get default permissions for a role when backend is unavailable.
 */
function getDefaultPermissions(role: string): string[] {
    return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS['staff'] || [];
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,
            registeredUsers: {},
            permissions: [],

            setUser: (user) => set({
                user,
                isAuthenticated: true,
                // Auto-set permissions from defaults if none exist yet
                permissions: get().permissions.length > 0
                    ? get().permissions
                    : getDefaultPermissions(user.role),
            }),

            setTokens: (access, refresh) => set({
                accessToken: access,
                refreshToken: refresh,
                isAuthenticated: true,
            }),

            logout: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                permissions: [],
            }),

            updateUser: (updates) => set((state) => {
                const updatedUser = state.user ? { ...state.user, ...updates } : null;
                // If role changed, update permissions too
                const roleChanged = updates.role && updates.role !== state.user?.role;
                return {
                    user: updatedUser,
                    permissions: roleChanged
                        ? getDefaultPermissions(updates.role!)
                        : state.permissions,
                };
            }),

            setLoading: (loading) => set({ isLoading: loading }),

            setPermissions: (permissions) => set({ permissions }),

            registerUser: (user, password) => set((state) => ({
                registeredUsers: {
                    ...state.registeredUsers,
                    [user.phone]: { password, user },
                },
                user,
                accessToken: 'token_' + Date.now(),
                refreshToken: 'refresh_' + Date.now(),
                isAuthenticated: true,
                permissions: getDefaultPermissions(user.role),
            })),

            loginUser: (phone, password) => {
                const state = get();
                const registered = state.registeredUsers[phone];

                if (!registered) {
                    return { success: false, error: 'accountNotFound' };
                }
                if (registered.password !== password) {
                    return { success: false, error: 'wrongPassword' };
                }

                set({
                    user: registered.user,
                    accessToken: 'token_' + Date.now(),
                    refreshToken: 'refresh_' + Date.now(),
                    isAuthenticated: true,
                    permissions: getDefaultPermissions(registered.user.role),
                });
                return { success: true };
            },

            isPhoneRegistered: (phone) => {
                return !!get().registeredUsers[phone];
            },

            resetPassword: (phone, newPassword) => {
                const state = get();
                const registered = state.registeredUsers[phone];
                if (!registered) return false;

                set({
                    registeredUsers: {
                        ...state.registeredUsers,
                        [phone]: { ...registered, password: newPassword },
                    },
                });
                return true;
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                registeredUsers: state.registeredUsers,
                permissions: state.permissions,
            }),
        }
    )
);

