/**
 * RBAC Ability Context — React Context provider for CASL.
 *
 * Wraps the app in an AbilityProvider so any component can
 * check permissions via the useAbility() hook.
 *
 * Usage:
 *   const ability = useAbility();
 *   if (ability.can('view', 'reports')) { ... }
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import {
    AppAbility,
    defineAbilityFor,
    createDefaultAbility,
    DEFAULT_PERMISSIONS,
} from './ability';

// ═══════════════════════════════════════════════════════════════════
//  Context
// ═══════════════════════════════════════════════════════════════════

const AbilityContext = createContext<AppAbility>(createDefaultAbility());

/**
 * Hook to access the current user's CASL ability instance.
 *
 * @example
 *   const ability = useAbility();
 *   ability.can('create', 'transaction');  // true for merchant
 *   ability.can('view', 'reports');        // false for staff
 */
export const useAbility = (): AppAbility => {
    return useContext(AbilityContext);
};

// ═══════════════════════════════════════════════════════════════════
//  Provider
// ═══════════════════════════════════════════════════════════════════

interface AbilityProviderProps {
    children: React.ReactNode;
}

/**
 * Provides CASL ability to the entire app tree.
 * Reads permissions from the auth store and rebuilds the ability
 * whenever they change.
 */
export const AbilityProvider: React.FC<AbilityProviderProps> = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const permissions = useAuthStore((state) => state.permissions);

    const ability = useMemo(() => {
        // If we have explicit permissions from the backend, use those
        if (permissions && permissions.length > 0) {
            return defineAbilityFor(permissions);
        }

        // Fallback: derive from role string using default permission sets
        if (user?.role) {
            const rolePerms = DEFAULT_PERMISSIONS[user.role];
            if (rolePerms) {
                return defineAbilityFor(rolePerms);
            }
        }

        // No user / no role → empty ability
        return createDefaultAbility();
    }, [user?.role, permissions]);

    return (
        <AbilityContext.Provider value={ability}>
            {children}
        </AbilityContext.Provider>
    );
};

export default AbilityProvider;
