"""
Payment URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PaymentWebhookView

router = DefaultRouter()
router.register('', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/<str:gateway>/', PaymentWebhookView.as_view(), name='payment-webhook'),
]
