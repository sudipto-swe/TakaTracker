"""
Custom User model for TallyKhata.
Supports phone-based authentication with merchant/staff roles.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for phone-based authentication."""
    
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('Phone number is required')
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.MERCHANT)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with phone-based authentication.
    Supports merchant and staff roles for business hierarchy.
    """
    
    class Role(models.TextChoices):
        MERCHANT = 'merchant', 'Merchant (ব্যবসায়ী)'
        STAFF = 'staff', 'Staff (কর্মচারী)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    
    # Profile
    name = models.CharField(max_length=150, blank=True)  # নাম
    business_name = models.CharField(max_length=200, blank=True)  # ব্যবসার নাম
    business_type = models.CharField(max_length=100, blank=True)  # ব্যবসার ধরন
    address = models.TextField(blank=True)  # ঠিকানা
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Role & Permissions
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MERCHANT)
    merchant = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='staff_members',
        help_text='For staff users, this is their merchant'
    )
    
    # Preferences
    language = models.CharField(max_length=5, default='bn', choices=[('bn', 'বাংলা'), ('en', 'English')])
    currency = models.CharField(max_length=5, default='BDT')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Sync
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.name or self.phone}"
    
    @property
    def is_merchant(self):
        return self.role == self.Role.MERCHANT
    
    def get_merchant(self):
        """Get the merchant for this user (self if merchant, or linked merchant if staff)."""
        if self.is_merchant:
            return self
        return self.merchant


class OTPVerification(models.Model):
    """OTP verification for phone authentication."""
    
    phone = models.CharField(max_length=15, db_index=True)
    otp = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=20,
        choices=[
            ('login', 'Login'),
            ('register', 'Registration'),
            ('reset', 'Password Reset'),
        ],
        default='login'
    )
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'otp_verifications'
        ordering = ['-created_at']
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self, otp):
        if self.is_expired():
            return False
        if self.attempts >= 5:
            return False
        return self.otp == otp