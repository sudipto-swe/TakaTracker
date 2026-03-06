"""
Payment views with gateway stubs.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
import uuid
import json

from .models import PaymentLog, MerchantWallet
from .serializers import (
    PaymentLogSerializer,
    MerchantWalletSerializer,
    QRPaymentRequestSerializer,
    PaymentWebhookSerializer,
)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment history."""
    
    serializer_class = PaymentLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        merchant = self.request.user.get_merchant()
        return PaymentLog.objects.filter(merchant=merchant).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def wallet(self, request):
        """Get merchant wallet info (ওয়ালেট)."""
        wallet, created = MerchantWallet.objects.get_or_create(
            merchant=request.user.get_merchant()
        )
        return Response({
            'success': True,
            'wallet': MerchantWalletSerializer(wallet).data
        })
    
    @action(detail=False, methods=['patch'])
    def update_wallet(self, request):
        """Update wallet payment numbers."""
        wallet, _ = MerchantWallet.objects.get_or_create(
            merchant=request.user.get_merchant()
        )
        serializer = MerchantWalletSerializer(wallet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Wallet updated',
            'message_bn': 'ওয়ালেট আপডেট হয়েছে',
            'wallet': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def generate_qr(self, request):
        """
        Generate QR code for receiving payment (টাকা নিন).
        This is a stub - in production, integrate with actual payment gateway.
        """
        serializer = QRPaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount = serializer.validated_data['amount']
        gateway = serializer.validated_data['gateway']
        reference = serializer.validated_data.get('reference', '')
        
        merchant = request.user.get_merchant()
        wallet, _ = MerchantWallet.objects.get_or_create(merchant=merchant)
        
        # Get merchant's payment number for the gateway
        payment_number = getattr(wallet, f'{gateway}_number', '')
        if not payment_number:
            return Response({
                'success': False,
                'error': f'{gateway} number not configured',
                'error_bn': f'{gateway} নম্বর সেট করা হয়নি'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate QR code ID (in production, get from gateway)
        qr_id = f"QR-{gateway.upper()}-{uuid.uuid4().hex[:12].upper()}"
        
        # Create payment log
        payment_log = PaymentLog.objects.create(
            merchant=merchant,
            gateway=gateway,
            amount=amount,
            receiver_number=payment_number,
            qr_code_id=qr_id,
            status=PaymentLog.Status.PENDING
        )
        
        # Generate QR data (stub)
        # In production, this would be actual gateway QR data
        qr_data = {
            'gateway': gateway,
            'merchant': merchant.business_name or merchant.name,
            'number': payment_number,
            'amount': str(amount),
            'reference': reference,
            'qr_id': qr_id,
        }
        
        # Deep link URLs for payment apps
        deep_links = {
            'bkash': f"bkash://payment?amount={amount}&receiver={payment_number}&reference={qr_id}",
            'nagad': f"nagad://payment?amount={amount}&receiver={payment_number}&reference={qr_id}",
            'rocket': f"rocket://payment?amount={amount}&receiver={payment_number}&reference={qr_id}",
        }
        
        print(f"[DEV] QR Generated: {qr_data}")  # Development log
        
        return Response({
            'success': True,
            'qr_id': qr_id,
            'qr_data': json.dumps(qr_data),
            'deep_link': deep_links.get(gateway),
            'payment_log_id': str(payment_log.id),
            'message': 'QR code generated',
            'message_bn': 'QR কোড তৈরি হয়েছে'
        })
    
    @action(detail=False, methods=['post'])
    def confirm_payment(self, request):
        """
        Manually confirm a payment (for development/manual flow).
        In production, this would be done via webhook.
        """
        payment_log_id = request.data.get('payment_log_id')
        transaction_id = request.data.get('transaction_id', '')
        
        try:
            payment_log = PaymentLog.objects.get(
                id=payment_log_id,
                merchant=request.user.get_merchant(),
                status=PaymentLog.Status.PENDING
            )
        except PaymentLog.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Payment not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update payment status
        payment_log.status = PaymentLog.Status.SUCCESS
        payment_log.gateway_transaction_id = transaction_id
        payment_log.completed_at = timezone.now()
        payment_log.save()
        
        # Update wallet balance
        wallet, _ = MerchantWallet.objects.get_or_create(
            merchant=request.user.get_merchant()
        )
        wallet.total_received += payment_log.amount
        wallet.save()
        
        return Response({
            'success': True,
            'message': 'Payment confirmed',
            'message_bn': 'পেমেন্ট নিশ্চিত হয়েছে',
            'payment': PaymentLogSerializer(payment_log).data
        })


class PaymentWebhookView(APIView):
    """
    Webhook endpoint for payment gateway callbacks.
    This is a stub for development.
    """
    
    permission_classes = [AllowAny]  # Webhooks are authenticated differently
    
    def post(self, request, gateway):
        """Handle payment webhook from gateway."""
        
        # In production, verify webhook signature here
        print(f"[DEV] Webhook received from {gateway}: {request.data}")
        
        serializer = PaymentWebhookSerializer(data={
            'gateway': gateway,
            **request.data
        })
        
        if not serializer.is_valid():
            return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Find the payment log
        try:
            payment_log = PaymentLog.objects.get(
                gateway=gateway,
                qr_code_id=data.get('reference', ''),
                status=PaymentLog.Status.PENDING
            )
        except PaymentLog.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update payment status
        if data['status'] == 'success':
            payment_log.status = PaymentLog.Status.SUCCESS
            payment_log.completed_at = timezone.now()
            
            # Update wallet
            wallet, _ = MerchantWallet.objects.get_or_create(merchant=payment_log.merchant)
            wallet.total_received += payment_log.amount
            wallet.save()
        else:
            payment_log.status = PaymentLog.Status.FAILED
        
        payment_log.gateway_transaction_id = data['transaction_id']
        payment_log.sender_number = data['sender']
        payment_log.webhook_data = request.data
        payment_log.save()
        
        return Response({'success': True})
