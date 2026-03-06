"""
Transaction serializers.
"""
from rest_framework import serializers
from .models import Transaction, TransactionItem
from apps.contacts.serializers import ContactListSerializer


class TransactionItemSerializer(serializers.ModelSerializer):
    """Serializer for transaction line items."""
    
    class Meta:
        model = TransactionItem
        fields = ['id', 'product', 'name', 'quantity', 'unit', 'unit_price', 'discount', 'total']
        read_only_fields = ['id', 'total']


class TransactionSerializer(serializers.ModelSerializer):
    """Full transaction serializer."""
    
    items = TransactionItemSerializer(many=True, required=False)
    contact_details = ContactListSerializer(source='contact', read_only=True)
    due_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'reference_number', 'contact', 'contact_details',
            'subtotal', 'discount', 'tax', 'total_amount', 'paid_amount', 'due_amount',
            'payment_mode', 'payment_reference', 'category', 'notes', 'attachment',
            'transaction_date', 'created_at', 'updated_at', 'created_by',
            'local_id', 'synced_at', 'items'
        ]
        read_only_fields = ['id', 'reference_number', 'created_at', 'updated_at', 'created_by']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        
        validated_data['merchant'] = request.user.get_merchant()
        validated_data['created_by'] = request.user
        
        transaction = Transaction.objects.create(**validated_data)
        
        # Create items
        for item_data in items_data:
            TransactionItem.objects.create(transaction=transaction, **item_data)
        
        return transaction
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update transaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                TransactionItem.objects.create(transaction=instance, **item_data)
        
        return instance


class TransactionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for transaction lists."""
    
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'reference_number', 'contact', 'contact_name',
            'total_amount', 'paid_amount', 'payment_mode', 'transaction_date', 'created_at'
        ]


class DailySummarySerializer(serializers.Serializer):
    """Serializer for daily summary report."""
    
    date = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_purchases = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_received = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_cash_flow = serializers.DecimalField(max_digits=15, decimal_places=2)
    transaction_count = serializers.IntegerField()