"""
Transaction models for sales, purchases, expenses, and payments.
"""
from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid


class Transaction(models.Model):
    """
    Transaction model for all financial activities.
    - Sale (বিক্রয়): Selling to customers
    - Purchase (ক্রয়): Buying from suppliers
    - Expense (খরচ): Business expenses
    - Income (আয়): Other income
    - Payment In (টাকা পেলাম): Receiving money from customers
    - Payment Out (টাকা দিলাম): Paying money to suppliers
    - Return (ফেরত): Returns
    """
    
    class TransactionType(models.TextChoices):
        SALE = 'sale', 'Sale (বিক্রয়)'
        PURCHASE = 'purchase', 'Purchase (ক্রয়)'
        EXPENSE = 'expense', 'Expense (খরচ)'
        INCOME = 'income', 'Income (আয়)'
        PAYMENT_IN = 'payment_in', 'Received (টাকা পেলাম)'
        PAYMENT_OUT = 'payment_out', 'Paid (টাকা দিলাম)'
        RETURN_IN = 'return_in', 'Return Received (ফেরত পেলাম)'
        RETURN_OUT = 'return_out', 'Return Given (ফেরত দিলাম)'
    
    class PaymentMode(models.TextChoices):
        CASH = 'cash', 'Cash (নগদ)'
        BKASH = 'bkash', 'bKash'
        NAGAD = 'nagad', 'Nagad'
        ROCKET = 'rocket', 'Rocket'
        BANK = 'bank', 'Bank (ব্যাংক)'
        CREDIT = 'credit', 'Credit (বাকি)'
        OTHER = 'other', 'Other (অন্যান্য)'
    
    class ExpenseCategory(models.TextChoices):
        EMPLOYEE = 'employee', 'Employee Salary (কর্মচারী বেতন)'
        ELECTRICITY = 'electricity', 'Electricity Bill (বিদ্যুৎ বিল)'
        RENT = 'rent', 'Shop Rent (দোকান ভাড়া)'
        TRANSPORT = 'transport', 'Transport (পরিবহন)'
        OTHERS = 'others', 'Others (অন্যান্য)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    # Transaction Details
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        db_index=True
    )
    reference_number = models.CharField(max_length=50, blank=True, db_index=True)
    
    # Contact (optional - for sales/purchases/payments)
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    
    # Amount Details
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)  # Final amount
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    @property
    def due_amount(self):
        return self.total_amount - self.paid_amount
    
    # Payment
    payment_mode = models.CharField(
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.CASH
    )
    payment_reference = models.CharField(max_length=100, blank=True)  # e.g., bKash TrxID
    
    # Category (for expenses/income)
    category = models.CharField(max_length=100, blank=True)
    expense_category = models.CharField(
        max_length=20,
        choices=ExpenseCategory.choices,
        blank=True,
        default='',
        help_text='Expense category (কর্মচারী, বিদ্যুৎ, ভাড়া, পরিবহন, অন্যান্য)'
    )
    
    # Notes & Attachments
    notes = models.TextField(blank=True)  # নোট
    attachment = models.ImageField(upload_to='transactions/', blank=True, null=True)
    
    # Timestamps
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transactions'
    )
    
    # Sync fields
    local_id = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)  # Soft delete for sync
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['merchant', 'transaction_type']),
            models.Index(fields=['merchant', 'transaction_date']),
            models.Index(fields=['merchant', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - ৳{self.total_amount}"
    
    def save(self, *args, **kwargs):
        # Auto-generate reference number
        if not self.reference_number:
            prefix = self.transaction_type[:3].upper()
            import time
            self.reference_number = f"{prefix}-{int(time.time() * 1000) % 1000000}"
        
        super().save(*args, **kwargs)
        
        # Update contact balance after save
        if self.contact:
            self.contact.update_balance()


class TransactionItem(models.Model):
    """
    Line items for transactions (for sales/purchases with products).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='items'
    )
    
    # Product (optional - can be just description)
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transaction_items'
    )
    
    # Item Details
    name = models.CharField(max_length=200)  # Product name or description
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, default='pcs')  # পিস, কেজি, লিটার, etc.
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2)  # (quantity * unit_price) - discount
    
    class Meta:
        db_table = 'transaction_items'
    
    def __str__(self):
        return f"{self.name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate total
        self.total = (self.quantity * self.unit_price) - self.discount
        super().save(*args, **kwargs)