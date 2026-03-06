"""
Contact models for customers and suppliers.
Tracks balances and payment dues.
"""
from django.db import models
from django.conf import settings
import uuid


class Contact(models.Model):
    """
    Contact model representing customers (গ্রাহক) and suppliers (সরবরাহকারী).
    Tracks balances and payment dues.
    """
    
    class ContactType(models.TextChoices):
        CUSTOMER = 'customer', 'Customer (গ্রাহক)'
        SUPPLIER = 'supplier', 'Supplier (সরবরাহকারী)'
        BOTH = 'both', 'Both (উভয়)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    
    # Basic Info
    name = models.CharField(max_length=150)  # নাম
    phone = models.CharField(max_length=15, blank=True, db_index=True)  # ফোন
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)  # ঠিকানা
    image = models.ImageField(upload_to='contacts/', blank=True, null=True)
    
    # Type & Status
    contact_type = models.CharField(
        max_length=20,
        choices=ContactType.choices,
        default=ContactType.CUSTOMER
    )
    is_active = models.BooleanField(default=True)
    
    # Balance Tracking (calculated fields, updated on transactions)
    # Positive = they owe us, Negative = we owe them
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text='Current balance. Positive = they owe, Negative = we owe'
    )
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_purchases = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_received = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Credit Limit (optional)
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)  # নোট
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Sync fields
    local_id = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)  # Soft delete for sync
    
    class Meta:
        db_table = 'contacts'
        ordering = ['name']
        indexes = [
            models.Index(fields=['merchant', 'contact_type']),
            models.Index(fields=['merchant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"
    
    @property
    def has_dues(self):
        """Check if there are outstanding dues."""
        return self.balance != 0
    
    @property
    def is_debtor(self):
        """They owe us money."""
        return self.balance > 0
    
    @property
    def is_creditor(self):
        """We owe them money."""
        return self.balance < 0
    
    def update_balance(self):
        """Recalculate balance from transactions."""
        from apps.transactions.models import Transaction
        
        # Sales to customer = they owe us
        sales = Transaction.objects.filter(
            contact=self,
            transaction_type=Transaction.TransactionType.SALE,
            is_deleted=False
        ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        
        # Purchases from supplier = we owe them
        purchases = Transaction.objects.filter(
            contact=self,
            transaction_type=Transaction.TransactionType.PURCHASE,
            is_deleted=False
        ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        
        # Payments received (from customer)
        received = Transaction.objects.filter(
            contact=self,
            transaction_type=Transaction.TransactionType.PAYMENT_IN,
            is_deleted=False
        ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        
        # Payments made (to supplier)
        paid = Transaction.objects.filter(
            contact=self,
            transaction_type=Transaction.TransactionType.PAYMENT_OUT,
            is_deleted=False
        ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        
        self.total_sales = sales
        self.total_purchases = purchases
        self.total_received = received
        self.total_paid = paid
        
        # Balance = (Sales - Received) - (Purchases - Paid)
        self.balance = (sales - received) - (purchases - paid)
        self.save(update_fields=['balance', 'total_sales', 'total_purchases', 
                                  'total_received', 'total_paid', 'updated_at'])