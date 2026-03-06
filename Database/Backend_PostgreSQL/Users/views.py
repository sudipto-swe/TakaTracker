"""
User views for authentication and profile management.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from .models import OTPVerification
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    ChangeLanguageSerializer,
)

User = get_user_model()


class OTPRequestView(APIView):
    """Request OTP for phone authentication."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone = serializer.validated_data['phone']
        purpose = serializer.validated_data['purpose']
        
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # For development, use fixed OTP
        if phone.endswith('0000'):
            otp = '123456'
        
        # Create OTP record
        OTPVerification.objects.create(
            phone=phone,
            otp=otp,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        # TODO: Send OTP via SMS gateway (for now, log it)
        print(f"[DEV] OTP for {phone}: {otp}")
        
        return Response({
            'success': True,
            'message': 'OTP sent successfully',
            'message_bn': 'OTP সফলভাবে পাঠানো হয়েছে',
            # In production, remove this:
            'dev_otp': otp if phone.endswith('0000') else None
        })


class OTPVerifyView(APIView):
    """Verify OTP and authenticate user."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        is_new_user = serializer.validated_data['is_new_user']
        tokens = serializer.get_tokens(user)
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        return Response({
            'success': True,
            'is_new_user': is_new_user,
            'user': UserSerializer(user).data,
            'tokens': tokens
        })


class RegisterView(APIView):
    """Register new user with OTP verification."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'message_bn': 'নিবন্ধন সফল হয়েছে',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profile management."""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(pk=self.request.user.pk)
    
    def get_object(self):
        return self.request.user
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile."""
        if request.method == 'GET':
            return Response({
                'success': True,
                'user': UserSerializer(request.user).data
            })
        
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Profile updated',
            'message_bn': 'প্রোফাইল আপডেট হয়েছে',
            'user': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def change_language(self, request):
        """Change language preference."""
        serializer = ChangeLanguageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request.user.language = serializer.validated_data['language']
        request.user.save(update_fields=['language', 'updated_at'])
        
        return Response({
            'success': True,
            'message': 'Language changed',
            'message_bn': 'ভাষা পরিবর্তন হয়েছে',
            'language': request.user.language
        })
    
    @action(detail=False, methods=['get'])
    def staff(self, request):
        """Get staff members for the current merchant."""
        if not request.user.is_merchant:
            return Response({
                'success': False,
                'error': 'Only merchants can view staff'
            }, status=status.HTTP_403_FORBIDDEN)
        
        staff = request.user.staff_members.filter(is_active=True)
        return Response({
            'success': True,
            'staff': UserSerializer(staff, many=True).data
        })