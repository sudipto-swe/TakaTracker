"""Admin registration for Contacts app."""
from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'contact_type', 'balance', 'is_active', 'created_at')
    list_filter = ('contact_type', 'is_active')
    search_fields = ('name', 'phone')
    ordering = ('name',)
    readonly_fields = ('balance', 'total_sales', 'total_purchases', 'total_received', 'total_paid')
