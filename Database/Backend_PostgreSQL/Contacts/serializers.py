"""
Contact serializers.
"""
from rest_framework import serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    """Full contact serializer."""
    
    due_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'image',
            'contact_type', 'is_active', 'balance', 'due_status',
            'total_sales', 'total_purchases', 'total_received', 'total_paid',
            'credit_limit', 'notes', 'created_at', 'updated_at',
            'local_id', 'synced_at'
        ]
        read_only_fields = ['id', 'balance', 'total_sales', 'total_purchases',
                           'total_received', 'total_paid', 'created_at', 'updated_at']
    
    def get_due_status(self, obj):
        if obj.balance > 0:
            return 'receivable'  # They owe us (পাওনা)
        elif obj.balance < 0:
            return 'payable'  # We owe them (দেনা)
        return 'settled'  # No dues (সমতা)
    
    def create(self, validated_data):
        validated_data['merchant'] = self.context['request'].user.get_merchant()
        return super().create(validated_data)


class ContactListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for contact lists."""
    
    class Meta:
        model = Contact
        fields = ['id', 'name', 'phone', 'contact_type', 'balance', 'is_active']


class ContactSyncSerializer(serializers.ModelSerializer):
    """Serializer for offline sync operations."""
    
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['merchant']