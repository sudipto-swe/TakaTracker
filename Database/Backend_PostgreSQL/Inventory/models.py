"""
Inventory models for products and stock management.
"""
from django.db import models
from django.conf import settings
import uuid


class Product(models.Model):
    """
    Product model for inventory management.
    Tracks stock levels with low-stock alerts.
    """
    
    class StockStatus(models.TextChoices):
        IN_STOCK = 'in_stock', 'In Stock (স্টকে আছে)'
        LOW_STOCK = 'low_stock', 'Low Stock (স্টক কম)'
        OUT_OF_STOCK = 'out_of_stock', 'Out of Stock (স্টক শেষ)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products'
    )
    
    # Product Info
    name = models.CharField(max_length=200)  # পণ্যের নাম
    sku = models.CharField(max_length=50, blank=True, db_index=True)  # Stock Keeping Unit
    barcode = models.CharField(max_length=100, blank=True, db_index=True)  # বারকোড
    description = models.TextField(blank=True)  # বিবরণ
    category = models.CharField(max_length=100, blank=True)  # ক্যাটাগরি
    
    # Pricing
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # ক্রয় মূল্য
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # বিক্রয় মূল্য
    wholesale_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)  # পাইকারি মূল্য
    
    # Stock
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # বর্তমান স্টক
    unit = models.CharField(max_length=30, default='pcs')  # একক: পিস, কেজি, লিটার
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=10)  # স্টক সতর্কতা সীমা
    
    @property
    def stock_status(self):
        if self.stock_quantity <= 0:
            return self.StockStatus.OUT_OF_STOCK
        elif self.stock_quantity <= self.low_stock_threshold:
            return self.StockStatus.LOW_STOCK
        return self.StockStatus.IN_STOCK
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage."""
        if self.purchase_price > 0:
            return ((self.selling_price - self.purchase_price) / self.purchase_price) * 100
        return 0
    
    # Media
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_service = models.BooleanField(default=False)  # True for services (no stock tracking)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Sync fields
    local_id = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['merchant', 'category']),
            models.Index(fields=['merchant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} (৳{self.selling_price})"
    
    def update_stock(self, quantity_change, transaction_type):
        """
        Update stock based on transaction.
        - Sale: decrease stock
        - Purchase: increase stock
        - Return In: increase stock
        - Return Out: decrease stock
        """
        from apps.transactions.models import Transaction
        
        if transaction_type in [Transaction.TransactionType.SALE, Transaction.TransactionType.RETURN_OUT]:
            self.stock_quantity -= quantity_change
        elif transaction_type in [Transaction.TransactionType.PURCHASE, Transaction.TransactionType.RETURN_IN]:
            self.stock_quantity += quantity_change
        
        self.save(update_fields=['stock_quantity', 'updated_at'])


class StockAdjustment(models.Model):
    """
    Track stock adjustments (manual corrections, damages, etc.)
    """
    
    class AdjustmentType(models.TextChoices):
        ADDITION = 'addition', 'Addition (যোগ)'
        SUBTRACTION = 'subtraction', 'Subtraction (বিয়োগ)'
        DAMAGE = 'damage', 'Damage (ক্ষতি)'
        CORRECTION = 'correction', 'Correction (সংশোধন)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='adjustments'
    )
    
    adjustment_type = models.CharField(max_length=20, choices=AdjustmentType.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    previous_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    new_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    
    reason = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stock_adjustments'
        ordering = ['-created_at']
