/**
 * <Can> Permission Guard Component.
 *
 * Conditionally renders children based on RBAC permissions.
 * Uses the CASL ability from AbilityContext.
 *
 * @example
 *   <Can action="view" subject="reports">
 *       <MenuItem icon="stats" label="Reports" />
 *   </Can>
 *
 *   <Can action="manage" subject="inventory" fallback={<LockedBadge />}>
 *       <InventoryManager />
 *   </Can>
 *
 *   <Can not action="manage" subject="staff">
 *       <Text>You don't have staff management access</Text>
 *   </Can>
 */
import React from 'react';
import { useAbility } from './AbilityContext';
import type { Actions, Subjects } from './ability';

interface CanProps {
    /** The action to check (e.g., 'view', 'create', 'edit', 'delete', 'manage') */
    action: Actions;
    /** The subject to check (e.g., 'transaction', 'reports', 'inventory') */
    subject: Subjects;
    /** If true, renders children when the user CANNOT perform the action */
    not?: boolean;
    /** Optional fallback to render when permission is denied */
    fallback?: React.ReactNode;
    /** Children to render when permission is granted */
    children: React.ReactNode;
}

/**
 * Declarative permission guard component.
 * Renders children only if the current user has the specified permission.
 */
export const Can: React.FC<CanProps> = ({
    action,
    subject,
    not: negate = false,
    fallback = null,
    children,
}) => {
    const ability = useAbility();
    const hasPermission = ability.can(action, subject);

    // If `not` prop is set, invert the check
    const shouldRender = negate ? !hasPermission : hasPermission;

    if (shouldRender) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

/**
 * Hook version of Can — returns a boolean.
 *
 * @example
 *   const canViewReports = useCan('view', 'reports');
 *   if (canViewReports) { navigation.navigate('Reports'); }
 */
export const useCan = (action: Actions, subject: Subjects): boolean => {
    const ability = useAbility();
    return ability.can(action, subject);
};

export default Can;
