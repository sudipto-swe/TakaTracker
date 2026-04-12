/**
 * CASL Ability Definition for TakaTracker RBAC.
 *
 * Defines the ability (what a user can/cannot do) based on
 * the permissions list received from the backend API.
 *
 * Permission format: "action:subject" (e.g., "create:transaction")
 */
import { PureAbility, AbilityBuilder } from '@casl/ability';

// ═══════════════════════════════════════════════════════════════════
//  Type Definitions
// ═══════════════════════════════════════════════════════════════════

export type Actions = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export type Subjects =
    | 'dashboard'
    | 'transaction'
    | 'contact'
    | 'inventory'
    | 'reports'
    | 'payments'
    | 'staff'
    | 'settings'
    | 'notifications'
    | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;

// ═══════════════════════════════════════════════════════════════════
//  Ability Factory
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a CASL Ability instance from a list of permission codenames.
 *
 * @param permissions - Array of "action:subject" strings from the backend
 * @returns PureAbility instance for can/cannot checks
 *
 * @example
 *   const ability = defineAbilityFor(['view:dashboard', 'create:transaction']);
 *   ability.can('view', 'dashboard');   // true
 *   ability.can('view', 'reports');     // false
 */
export function defineAbilityFor(permissions: string[]): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(PureAbility);

    permissions.forEach((perm) => {
        const colonIndex = perm.indexOf(':');
        if (colonIndex === -1) return;

        const action = perm.substring(0, colonIndex) as Actions;
        const subject = perm.substring(colonIndex + 1) as Subjects;

        builder.can(action, subject);
    });

    return builder.build();
}

/**
 * Create a default (empty) ability — no permissions granted.
 * Used before login or when permissions haven't loaded yet.
 */
export function createDefaultAbility(): AppAbility {
    return new PureAbility<[Actions, Subjects]>([]);
}

/**
 * Create a full-access ability — used for admin/superuser.
 */
export function createAdminAbility(): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(PureAbility);
    builder.can('manage', 'all');
    return builder.build();
}

// ═══════════════════════════════════════════════════════════════════
//  Default Permission Sets (fallback when backend is unavailable)
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    merchant: [
        'view:dashboard',
        'create:transaction', 'view:transaction', 'edit:transaction', 'delete:transaction',
        'view:contact', 'create:contact', 'edit:contact', 'delete:contact',
        'view:inventory', 'manage:inventory',
        'view:reports',
        'manage:payments',
        'manage:staff',
        'manage:settings',
        'view:notifications',
    ],
    staff: [
        'view:dashboard',
        'create:transaction', 'view:transaction',
        'view:contact', 'create:contact',
        'view:inventory',
        'view:notifications',
    ],
    admin: [
        'view:dashboard',
        'create:transaction', 'view:transaction', 'edit:transaction', 'delete:transaction',
        'view:contact', 'create:contact', 'edit:contact', 'delete:contact',
        'view:inventory', 'manage:inventory',
        'view:reports',
        'manage:payments',
        'manage:staff',
        'manage:settings',
        'view:notifications',
    ],
};
