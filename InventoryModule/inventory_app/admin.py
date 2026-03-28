"""Admin registration for Inventory app."""
from django.contrib import admin
from .models import Product, StockAdjustment


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'purchase_price', 'selling_price',
                    'stock_quantity', 'stock_status', 'is_active')
    list_filter = ('is_active', 'category', 'is_service')
    search_fields = ('name', 'sku', 'barcode')
    ordering = ('name',)


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'adjustment_type', 'quantity', 'previous_quantity',
                    'new_quantity', 'created_at')
    list_filter = ('adjustment_type',)
    ordering = ('-created_at',)
