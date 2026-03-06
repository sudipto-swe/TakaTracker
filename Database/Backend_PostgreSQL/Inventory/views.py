"""
Inventory views.
""" 
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F

from .models import Product, StockAdjustment
from .serializers import ProductSerializer, ProductListSerializer, StockAdjustmentSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products (পণ্য)."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        merchant = self.request.user.get_merchant()
        queryset = Product.objects.filter(merchant=merchant, is_deleted=False)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'low':
            queryset = queryset.filter(
                stock_quantity__lte=F('low_stock_threshold'),
                stock_quantity__gt=0,
                is_service=False
            )
        elif stock_status == 'out':
            queryset = queryset.filter(stock_quantity__lte=0, is_service=False)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(sku__icontains=search) |
                Q(barcode__icontains=search)
            )
        
        return queryset.order_by('name')
    
    def perform_destroy(self, instance):
        """Soft delete for sync support."""
        instance.is_deleted = True
        instance.save()
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock (স্টক কম)."""
        queryset = self.get_queryset().filter(
            stock_quantity__lte=F('low_stock_threshold'),
            is_service=False,
            is_active=True
        ).order_by('stock_quantity')
        
        return Response({
            'success': True,
            'products': ProductListSerializer(queryset, many=True).data,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get unique product categories."""
        merchant = request.user.get_merchant()
        categories = Product.objects.filter(
            merchant=merchant,
            is_deleted=False
        ).exclude(category='').values_list('category', flat=True).distinct()
        
        return Response({
            'success': True,
            'categories': list(categories)
        })
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Manually adjust product stock (স্টক সমন্বয়)."""
        product = self.get_object()
        
        serializer = StockAdjustmentSerializer(
            data={'product': product.id, **request.data},
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        adjustment = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Stock adjusted',
            'message_bn': 'স্টক সমন্বয় হয়েছে',
            'adjustment': serializer.data,
            'new_stock': product.stock_quantity
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get stock adjustment history for a product."""
        product = self.get_object()
        adjustments = StockAdjustment.objects.filter(product=product).order_by('-created_at')[:20]
        
        return Response({
            'success': True,
            'product': ProductSerializer(product).data,
            'adjustments': StockAdjustmentSerializer(adjustments, many=True).data
        })
