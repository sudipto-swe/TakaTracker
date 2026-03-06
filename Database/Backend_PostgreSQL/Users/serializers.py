"""
User serializers for authentication and profile management.
"""
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import OTPVerification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'name', 'business_name', 'business_type',
            'address', 'profile_image', 'role', 'language', 'currency',
            'is_verified', 'date_joined', 'last_sync_at'
        ]
        read_only_fields = ['id', 'phone', 'role', 'is_verified', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    otp = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['phone', 'name', 'business_name', 'otp']
    
    def validate(self, data):
        # Verify OTP
        phone = data['phone']
        otp = data.pop('otp')
        
        verification = OTPVerification.objects.filter(
            phone=phone,
            purpose='register',
            is_verified=False
        ).order_by('-created_at').first()
        
        if not verification or not verification.is_valid(otp):
            raise serializers.ValidationError({
                'otp': 'Invalid or expired OTP / অবৈধ বা মেয়াদোত্তীর্ণ OTP'
            })
        
        verification.is_verified = True
        verification.save()
        
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_verified = True
        user.save()
        return user


class OTPRequestSerializer(serializers.Serializer):
    """Serializer for requesting OTP."""
    
    phone = serializers.CharField(max_length=15)
    purpose = serializers.ChoiceField(
        choices=['login', 'register', 'reset'],
        default='login'
    )


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying OTP and getting tokens."""
    
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    
    def validate(self, data):
        phone = data['phone']
        otp = data['otp']
        
        verification = OTPVerification.objects.filter(
            phone=phone,
            is_verified=False
        ).order_by('-created_at').first()
        
        if not verification:
            raise serializers.ValidationError({
                'otp': 'No OTP request found / কোনো OTP অনুরোধ পাওয়া যায়নি'
            })
        
        verification.attempts += 1
        verification.save()
        
        if not verification.is_valid(otp):
            raise serializers.ValidationError({
                'otp': 'Invalid or expired OTP / অবৈধ বা মেয়াদোত্তীর্ণ OTP'
            })
        
        verification.is_verified = True
        verification.save()
        
        # Get or create user
        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={'is_verified': True}
        )
        
        if not user.is_verified:
            user.is_verified = True
            user.save()
        
        data['user'] = user
        data['is_new_user'] = created
        
        return data
    
    def get_tokens(self, user):
        """Generate JWT tokens for user."""
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for refreshing access token."""
    
    refresh = serializers.CharField()


class ChangeLanguageSerializer(serializers.Serializer):
    """Serializer for changing language preference."""
    
    language = serializers.ChoiceField(choices=[('bn', 'বাংলা'), ('en', 'English')])