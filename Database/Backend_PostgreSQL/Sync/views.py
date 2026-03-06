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


class SyncPushView(APIView):
    """
    Push data to server (সার্ভারে ডাটা পাঠান).
    Uses last-write-wins for conflict resolution.
    """
    
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = SyncPushRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        merchant = request.user.get_merchant()
        conflicts = []
        synced = {'contacts': 0, 'transactions': 0, 'products': 0}
        
        # Sync contacts
        for contact_data in serializer.validated_data.get('contacts', []):
            result = self._sync_contact(merchant, contact_data)
            if result.get('conflict'):
                conflicts.append(result['conflict'])
            else:
                synced['contacts'] += 1
        
        # Sync transactions
        for transaction_data in serializer.validated_data.get('transactions', []):
            result = self._sync_transaction(merchant, request.user, transaction_data)
            if result.get('conflict'):
                conflicts.append(result['conflict'])
            else:
                synced['transactions'] += 1
        
        # Sync products
        for product_data in serializer.validated_data.get('products', []):
            result = self._sync_product(merchant, product_data)
            if result.get('conflict'):
                conflicts.append(result['conflict'])
            else:
                synced['products'] += 1
        
        # Update user's last sync time
        request.user.last_sync_at = timezone.now()
        request.user.save(update_fields=['last_sync_at'])
        
        return Response({
            'success': True,
            'synced_at': timezone.now(),
            'synced': synced,
            'conflicts': conflicts,
            'conflict_count': len(conflicts)
        })
    
    def _sync_contact(self, merchant, data):
        """Sync a single contact using last-write-wins."""
        local_id = data.get('local_id')
        server_id = data.get('id')
        
        existing = None
        if server_id:
            try:
                existing = Contact.objects.get(id=server_id, merchant=merchant)
            except Contact.DoesNotExist:
                pass
        elif local_id:
            existing = Contact.objects.filter(merchant=merchant, local_id=local_id).first()
        
        if existing:
            # Check for conflict (server modified after client's version)
            client_updated = data.get('updated_at')
            if client_updated and existing.updated_at > client_updated:
                # Server has newer data - last-write-wins (server wins)
                # Return conflict for client to handle
                return {
                    'conflict': {
                        'model': 'contact',
                        'local_id': local_id,
                        'server_data': SyncContactSerializer(existing).data,
                        'client_data': data,
                        'conflict_type': 'update'
                    }
                }
            
            # Update existing
            for key, value in data.items():
                if key not in ['id', 'merchant', 'created_at']:
                    setattr(existing, key, value)
            existing.synced_at = timezone.now()
            existing.save()
        else:
            # Create new
            data.pop('id', None)
            data['merchant'] = merchant
            data['synced_at'] = timezone.now()
            Contact.objects.create(**data)
        
        return {'success': True}
    
    def _sync_transaction(self, merchant, user, data):
        """Sync a single transaction using last-write-wins."""
        local_id = data.get('local_id')
        server_id = data.get('id')
        items_data = data.pop('items', [])
        
        existing = None
        if server_id:
            try:
                existing = Transaction.objects.get(id=server_id, merchant=merchant)
            except Transaction.DoesNotExist:
                pass
        elif local_id:
            existing = Transaction.objects.filter(merchant=merchant, local_id=local_id).first()
        
        if existing:
            client_updated = data.get('updated_at')
            if client_updated and existing.updated_at > client_updated:
                return {
                    'conflict': {
                        'model': 'transaction',
                        'local_id': local_id,
                        'server_data': SyncTransactionSerializer(existing).data,
                        'client_data': data,
                        'conflict_type': 'update'
                    }
                }
            
            for key, value in data.items():
                if key not in ['id', 'merchant', 'created_by', 'created_at']:
                    setattr(existing, key, value)
            existing.synced_at = timezone.now()
            existing.save()
            
            # Update items
            existing.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                TransactionItem.objects.create(transaction=existing, **item_data)
        else:
            data.pop('id', None)
            data['merchant'] = merchant
            data['created_by'] = user
            data['synced_at'] = timezone.now()
            txn = Transaction.objects.create(**data)
            
            for item_data in items_data:
                item_data.pop('id', None)
                TransactionItem.objects.create(transaction=txn, **item_data)
        
        return {'success': True}
    
    def _sync_product(self, merchant, data):
        """Sync a single product using last-write-wins."""
        local_id = data.get('local_id')
        server_id = data.get('id')
        
        existing = None
        if server_id:
            try:
                existing = Product.objects.get(id=server_id, merchant=merchant)
            except Product.DoesNotExist:
                pass
        elif local_id:
            existing = Product.objects.filter(merchant=merchant, local_id=local_id).first()
        
        if existing:
            client_updated = data.get('updated_at')
            if client_updated and existing.updated_at > client_updated:
                return {
                    'conflict': {
                        'model': 'product',
                        'local_id': local_id,
                        'server_data': SyncProductSerializer(existing).data,
                        'client_data': data,
                        'conflict_type': 'update'
                    }
                }
            
            for key, value in data.items():
                if key not in ['id', 'merchant', 'created_at']:
                    setattr(existing, key, value)
            existing.synced_at = timezone.now()
            existing.save()
        else:
            data.pop('id', None)
            data['merchant'] = merchant
            data['synced_at'] = timezone.now()
            Product.objects.create(**data)
        
        return {'success': True}


class SyncStatusView(APIView):
    """Get sync status for the current user."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        merchant = request.user.get_merchant()
        
        return Response({
            'success': True,
            'last_sync_at': request.user.last_sync_at,
            'counts': {
                'contacts': Contact.objects.filter(merchant=merchant, is_deleted=False).count(),
                'transactions': Transaction.objects.filter(merchant=merchant, is_deleted=False).count(),
                'products': Product.objects.filter(merchant=merchant, is_deleted=False).count(),
            }
        })
