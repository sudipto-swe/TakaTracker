"""
RBAC Middleware — Implements the 4-step permission flow:

    1. Request   → Incoming HTTP request arrives
    2. Intercept → JWT Authentication (handled by DRF's JWTAuthentication)
    3. Validate  → Load user's role → fetch permissions from RolePermission
    4. Resolve   → Attach permissions to request, allow request to proceed

This middleware runs AFTER Django's AuthenticationMiddleware,
so `request.user` is already populated when we execute.

It pre-loads the user's RBAC permissions and caches them on the
request object so DRF permission classes can access them efficiently
without repeated database queries.
"""
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache


class RBACMiddleware(MiddlewareMixin):
    """
    Attaches RBAC permissions to every authenticated request.
    
    After this middleware runs, you can access:
        request.rbac_permissions  → list of codenames ['view:dashboard', ...]
        request.rbac_role_name    → string role name e.g. 'merchant'
    """

    # Cache permissions for 5 minutes to avoid repeated DB hits
    CACHE_TTL = 300  # seconds

    def process_request(self, request):
        """
        Step 3 (Validate) + Step 4 (Resolve):
        Load permissions and attach to request.
        """
        # Default: no permissions
        request.rbac_permissions = []
        request.rbac_role_name = None

        # Only process authenticated users
        if not hasattr(request, 'user') or request.user.is_anonymous:
            return None

        user = request.user

        # Superusers get a special marker
        if user.is_superuser:
            request.rbac_permissions = ['*']  # Wildcard = all permissions
            request.rbac_role_name = 'admin'
            return None

        # Try to load from cache first
        cache_key = f'rbac_perms_{user.pk}'
        cached = cache.get(cache_key)

        if cached is not None:
            request.rbac_permissions = cached['permissions']
            request.rbac_role_name = cached['role_name']
            return None

        # Load from database
        permissions = user.get_permissions()
        role_name = user.role  # The CharField value

        # Cache for next request
        cache.set(cache_key, {
            'permissions': permissions,
            'role_name': role_name,
        }, self.CACHE_TTL)

        request.rbac_permissions = permissions
        request.rbac_role_name = role_name

        return None

    @staticmethod
    def invalidate_user_cache(user_id):
        """
        Call this when a user's role or permissions change
        to clear their cached permissions.
        """
        cache_key = f'rbac_perms_{user_id}'
        cache.delete(cache_key)
