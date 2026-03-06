"""
Payment serializers.
""" 
from rest_framework import serializers
from .models import PaymentLog, MerchantWallet


class PaymentLogSerializer(serializers.ModelSerializer):
    """Serializer for payment logs."""
    
    class Meta:
        model = PaymentLog
        fields = [
            'id', 'transaction', 'gateway', 'amount', 'currency',
            'gateway_transaction_id', 'gateway_reference',
            'sender_number', 'receiver_number', 'qr_code_id',
            'status', 'status_message', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class MerchantWalletSerializer(serializers.ModelSerializer):
    """Serializer for merchant wallet."""
    
    balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = MerchantWallet
        fields = [
            'total_received', 'total_sent', 'balance',
            'bkash_number', 'nagad_number', 'rocket_number',
            'merchant_qr_id', 'updated_at'
        ]
        read_only_fields = ['total_received', 'total_sent', 'balance', 'updated_at']


class QRPaymentRequestSerializer(serializers.Serializer):
    """Serializer for QR payment requests."""
    
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    gateway = serializers.ChoiceField(choices=['bkash', 'nagad', 'rocket'])
    reference = serializers.CharField(max_length=100, required=False)


class PaymentWebhookSerializer(serializers.Serializer):
    """Serializer for payment webhook data."""
    
    gateway = serializers.ChoiceField(choices=['bkash', 'nagad', 'rocket'])
    transaction_id = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    sender = serializers.CharField(max_length=20)
    status = serializers.ChoiceField(choices=['success', 'failed', 'cancelled'])
    reference = serializers.CharField(max_length=100, required=False)
