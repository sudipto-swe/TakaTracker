"""
Sync views for offline data synchronization.
Implements last-write-wins conflict resolution with optional manual resolution.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction

from apps.contacts.models import Contact
from apps.transactions.models import Transaction, TransactionItem
from apps.inventory.models import Product
from .serializers import (
    SyncContactSerializer,
    SyncTransactionSerializer,
    SyncTransactionItemSerializer,
    SyncProductSerializer,
    SyncPullRequestSerializer,
    SyncPushRequestSerializer,
)

class SyncPullView(APIView):
    """
    Pull data from server (সার্ভার থেকে ডাটা নিন).
    Returns all data modified since last_sync_at.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SyncPullRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        merchant = request.user.get_merchant()
        last_sync = serializer.validated_data.get('last_sync_at')
        models = serializer.validated_data.get('models', ['contacts', 'transactions', 'products'])
        
        response_data = {
            'success': True,
            'synced_at': timezone.now(),
        }
        
        # Pull contacts
        if 'contacts' in models:
            contacts_qs = Contact.objects.filter(merchant=merchant)
            if last_sync:
                contacts_qs = contacts_qs.filter(updated_at__gt=last_sync)
            response_data['contacts'] = SyncContactSerializer(contacts_qs, many=True).data
        
        # Pull transactions
        if 'transactions' in models:
            transactions_qs = Transaction.objects.filter(merchant=merchant)
            if last_sync:
                transactions_qs = transactions_qs.filter(updated_at__gt=last_sync)
            response_data['transactions'] = SyncTransactionSerializer(transactions_qs, many=True).data
        
        # Pull products
        if 'products' in models:
            products_qs = Product.objects.filter(merchant=merchant)
            if last_sync:
                products_qs = products_qs.filter(updated_at__gt=last_sync)
            response_data['products'] = SyncProductSerializer(products_qs, many=True).data
        
        return Response(response_data)

