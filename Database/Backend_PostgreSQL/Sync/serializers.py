"""
Sync serializers for offline data synchronization.
"""
from rest_framework import serializers
from apps.contacts.models import Contact
from apps.transactions.models import Transaction, TransactionItem
from apps.inventory.models import Product


class SyncContactSerializer(serializers.ModelSerializer):
    """Serializer for syncing contacts."""
    
    class Meta:
        model = Contact
        exclude = ['merchant']


class SyncTransactionItemSerializer(serializers.ModelSerializer):
    """Serializer for syncing transaction items."""
    
    class Meta:
        model = TransactionItem
        exclude = ['transaction']


class SyncTransactionSerializer(serializers.ModelSerializer):
    """Serializer for syncing transactions."""
    
    items = SyncTransactionItemSerializer(many=True, required=False)
    
    class Meta:
        model = Transaction
        exclude = ['merchant', 'created_by']


class SyncProductSerializer(serializers.ModelSerializer):
    """Serializer for syncing products."""
    
    class Meta:
        model = Product
        exclude = ['merchant']


class SyncPullRequestSerializer(serializers.Serializer):
    """Request serializer for pulling data from server."""
    
    last_sync_at = serializers.DateTimeField(required=False, allow_null=True)
    models = serializers.ListField(
        child=serializers.ChoiceField(choices=['contacts', 'transactions', 'products']),
        required=False
    )


class SyncPushRequestSerializer(serializers.Serializer):
    """Request serializer for pushing data to server."""
    
    contacts = SyncContactSerializer(many=True, required=False)
    transactions = SyncTransactionSerializer(many=True, required=False)
    products = SyncProductSerializer(many=True, required=False)


class SyncConflictSerializer(serializers.Serializer):
    """Serializer for sync conflicts."""
    
    model = serializers.CharField()
    local_id = serializers.CharField()
    server_data = serializers.DictField()
    client_data = serializers.DictField()
    conflict_type = serializers.ChoiceField(choices=['update', 'delete'])
