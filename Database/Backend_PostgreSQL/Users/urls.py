"""
User URL configuration.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    OTPRequestView,
    OTPVerifyView,
    RegisterView,
    ProfileViewSet,
)

urlpatterns = [
    # Authentication
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Profile
    path('profile/', ProfileViewSet.as_view({'get': 'me', 'patch': 'me'}), name='profile'),
    path('profile/language/', ProfileViewSet.as_view({'post': 'change_language'}), name='change-language'),
    path('profile/staff/', ProfileViewSet.as_view({'get': 'staff'}), name='staff-list'),
]