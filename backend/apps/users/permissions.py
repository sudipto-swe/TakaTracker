"""
DRF Permission Classes for RBAC.

Usage in views:
    from apps.users.permissions import HasRBACPermission, IsMerchant

    class MyView(APIView):
        permission_classes = [IsAuthenticated, HasRBACPermission]
        required_permission = 'view:reports'

    # Or use the factory function:
    class MyView(APIView):
        permission_classes = [IsAuthenticated, rbac_permission('manage:inventory')]
"""
from rest_framework.permissions import BasePermission


class HasRBACPermission(BasePermission):
    """
    Check if user has the RBAC permission specified in
    `view.required_permission` or `view.required_permissions`.
    
    Middleware Flow Step 3 (Validate) & Step 4 (Resolve):
    - Reads the required permission from the view
    - Checks against the user's role → permissions chain
    - Returns True (allow) or False (deny with 403)
    """
    message = 'You do not have permission to perform this action.'
    message_bn = 'এই কাজটি করার অনুমতি আপনার নেই।'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers bypass all permission checks
        if request.user.is_superuser:
            return True

        # Single permission check
        required = getattr(view, 'required_permission', None)
        if required:
            return request.user.has_perm_rbac(required)

        # Multiple permissions (any of them grants access)
        required_perms = getattr(view, 'required_permissions', None)
        if required_perms:
            return request.user.has_any_perm(*required_perms)

        # If no specific permission is set on the view, allow
        # (protected only by IsAuthenticated)
        return True


class IsMerchant(BasePermission):
    """Only allow merchant users."""
    message = 'Only merchants can perform this action.'
    message_bn = 'শুধুমাত্র ব্যবসায়ীরা এই কাজটি করতে পারবেন।'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_merchant
        )


class IsStaffOfMerchant(BasePermission):
    """
    Ensure staff users can only access data belonging to their merchant.
    Works with views that have a `get_merchant_queryset()` method.
    """
    message = 'You can only access your merchant\'s data.'
    message_bn = 'আপনি শুধুমাত্র আপনার ব্যবসায়ীর ডেটা দেখতে পারবেন।'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Merchants can always access their own data
        if request.user.is_merchant:
            return True
        # Staff must have a linked merchant
        return request.user.merchant is not None


def rbac_permission(codename):
    """
    Factory function to create a permission class for a specific codename.
    
    Usage:
        permission_classes = [IsAuthenticated, rbac_permission('view:reports')]
    """
    class DynamicRBACPermission(HasRBACPermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
            if request.user.is_superuser:
                return True
            return request.user.has_perm_rbac(codename)

    DynamicRBACPermission.__name__ = f'RBACPerm_{codename}'
    DynamicRBACPermission.__qualname__ = f'RBACPerm_{codename}'
    return DynamicRBACPermission
