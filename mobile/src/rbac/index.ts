/**
 * RBAC module barrel export.
 *
 * Usage:
 *   import { Can, useCan, useAbility, AbilityProvider } from '../rbac';
 */
export { AbilityProvider, useAbility } from './AbilityContext';
export { Can, useCan } from './Can';
export {
    defineAbilityFor,
    createDefaultAbility,
    createAdminAbility,
    DEFAULT_PERMISSIONS,
} from './ability';
export type { Actions, Subjects, AppAbility } from './ability';
