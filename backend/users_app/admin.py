"""Admin registration for Users app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('phone', 'name', 'business_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_verified')
    search_fields = ('phone', 'name', 'business_name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Profile', {'fields': ('name', 'business_name', 'business_type', 'address', 'email')}),
        ('Role', {'fields': ('role', 'merchant', 'language', 'currency')}),
        ('Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Sync', {'fields': ('last_sync_at',)}),
    )
    add_fieldsets = (
        (None, {'fields': ('phone', 'password1', 'password2', 'name', 'business_name')}),
    )


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('phone', 'purpose', 'is_verified', 'created_at', 'expires_at')
    list_filter = ('purpose', 'is_verified')
    search_fields = ('phone',)
