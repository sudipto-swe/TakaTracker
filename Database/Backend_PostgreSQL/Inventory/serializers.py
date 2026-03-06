"""
Inventory serializers.
"""
from rest_framework import serializers
from .models import Product, StockAdjustment


class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer."""
    
    stock_status = serializers.CharField(read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'description', 'category',
            'purchase_price', 'selling_price', 'wholesale_price',
            'stock_quantity', 'unit', 'low_stock_threshold', 'stock_status',
            'profit_margin', 'image', 'is_active', 'is_service',
            'created_at', 'updated_at', 'local_id', 'synced_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['merchant'] = self.context['request'].user.get_merchant()
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists."""
    
    stock_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'selling_price', 'stock_quantity',
            'unit', 'stock_status', 'is_active', 'image'
        ]


class StockAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for stock adjustments."""
    
    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'product', 'adjustment_type', 'quantity',
            'previous_quantity', 'new_quantity', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'previous_quantity', 'new_quantity', 'created_at']
    
    def create(self, validated_data):
        product = validated_data['product']
        quantity = validated_data['quantity']
        adjustment_type = validated_data['adjustment_type']
        
        validated_data['previous_quantity'] = product.stock_quantity
        validated_data['created_by'] = self.context['request'].user
        
        # Calculate new quantity
        if adjustment_type in [StockAdjustment.AdjustmentType.ADDITION]:
            new_quantity = product.stock_quantity + quantity
        else:
            new_quantity = product.stock_quantity - quantity
        
        validated_data['new_quantity'] = new_quantity
        
        # Update product stock
        product.stock_quantity = new_quantity
        product.save(update_fields=['stock_quantity', 'updated_at'])
        
        return super().create(validated_data)
