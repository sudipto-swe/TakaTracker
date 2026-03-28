"""Admin registration for Transactions app."""
from django.contrib import admin
from .models import Transaction, TransactionItem


class TransactionItemInline(admin.TabularInline):
    model = TransactionItem
    extra = 0
    readonly_fields = ('total',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'transaction_type', 'total_amount', 'paid_amount',
                    'payment_mode', 'transaction_date', 'created_at')
    list_filter = ('transaction_type', 'payment_mode', 'expense_category', 'transaction_date')
    search_fields = ('reference_number', 'notes')
    ordering = ('-transaction_date', '-created_at')
    date_hierarchy = 'transaction_date'
    inlines = [TransactionItemInline]
    readonly_fields = ('reference_number', 'created_at', 'updated_at')
