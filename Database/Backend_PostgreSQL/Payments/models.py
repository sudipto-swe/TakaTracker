"""
Payment models for tracking payment gateway transactions.
"""
from django.db import models
from django.conf import settings
import uuid


class PaymentLog(models.Model):
    """
    Log of all payment gateway transactions.
    Tracks bKash, Nagad, Rocket payments for auditing.
    """
    
    class Gateway(models.TextChoices):
        BKASH = 'bkash', 'bKash'
        NAGAD = 'nagad', 'Nagad'
        ROCKET = 'rocket', 'Rocket'
        BANK = 'bank', 'Bank Transfer'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending (অপেক্ষমান)'
        SUCCESS = 'success', 'Success (সফল)'
        FAILED = 'failed', 'Failed (ব্যর্থ)'
        CANCELLED = 'cancelled', 'Cancelled (বাতিল)'
        REFUNDED = 'refunded', 'Refunded (ফেরত)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_logs'
    )
    
    # Transaction Reference
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_logs'
    )
    
    # Payment Details
    gateway = models.CharField(max_length=20, choices=Gateway.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=5, default='BDT')
    
    # Gateway References
    gateway_transaction_id = models.CharField(max_length=100, blank=True, db_index=True)
    gateway_reference = models.CharField(max_length=100, blank=True)
    sender_number = models.CharField(max_length=20, blank=True)  # Sender's mobile
    receiver_number = models.CharField(max_length=20, blank=True)  # Merchant's mobile
    
    # QR Payment
    qr_code_id = models.CharField(max_length=100, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    status_message = models.TextField(blank=True)
    
    # Webhook Data
    webhook_data = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['gateway', 'gateway_transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.gateway} - ৳{self.amount} ({self.status})"


class MerchantWallet(models.Model):
    """
    Virtual wallet for tracking merchant balance.
    This is a display/tracking wallet, not a real money store.
    """
    
    merchant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet',
        primary_key=True
    )
    
    # Balances (tracked, not stored)
    total_received = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # মোট পেয়েছি
    total_sent = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # মোট দিয়েছি
    
    # Connected Accounts
    bkash_number = models.CharField(max_length=15, blank=True)
    nagad_number = models.CharField(max_length=15, blank=True)
    rocket_number = models.CharField(max_length=15, blank=True)
    
    # QR Code
    merchant_qr_id = models.CharField(max_length=100, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'merchant_wallets'
    
    @property
    def balance(self):
        return self.total_received - self.total_sent
    
    def __str__(self):
        return f"Wallet: {self.merchant.name or self.merchant.phone}"
