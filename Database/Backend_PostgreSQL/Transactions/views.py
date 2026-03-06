"""
Transaction views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Transaction
from .serializers import (
    TransactionSerializer,
    TransactionListSerializer,
    DailySummarySerializer,
)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TransactionListSerializer
        return TransactionSerializer
    
    def get_queryset(self):
        merchant = self.request.user.get_merchant()
        queryset = Transaction.objects.filter(merchant=merchant, is_deleted=False)
        
        # Filter by type
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        # Filter by contact
        contact_id = self.request.query_params.get('contact')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        
        return queryset.order_by('-transaction_date', '-created_at')
    
    def perform_destroy(self, instance):
        """Soft delete for sync support."""
        instance.is_deleted = True
        instance.save()
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's transactions and summary (আজকের হিসাব)."""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(transaction_date=today)
        
        summary = self._get_summary(queryset)
        
        return Response({
            'success': True,
            'date': today,
            'summary': summary,
            'transactions': TransactionListSerializer(queryset[:20], many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary for date range."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date()
        if not end_date:
            end_date = start_date
        
        queryset = self.get_queryset().filter(
            transaction_date__gte=start_date,
            transaction_date__lte=end_date
        )
        
        summary = self._get_summary(queryset)
        
        return Response({
            'success': True,
            'start_date': start_date,
            'end_date': end_date,
            'summary': summary
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard data (ড্যাশবোর্ড)."""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        merchant = request.user.get_merchant()
        base_qs = Transaction.objects.filter(merchant=merchant, is_deleted=False)
        
        # Today's summary
        today_qs = base_qs.filter(transaction_date=today)
        today_summary = self._get_summary(today_qs)
        
        # This week
        week_qs = base_qs.filter(transaction_date__gte=week_ago)
        week_summary = self._get_summary(week_qs)
        
        # This month
        month_qs = base_qs.filter(transaction_date__gte=month_ago)
        month_summary = self._get_summary(month_qs)
        
        # Total dues
        from apps.contacts.models import Contact
        contacts = Contact.objects.filter(merchant=merchant, is_deleted=False)
        total_receivable = contacts.filter(balance__gt=0).aggregate(
            total=Sum('balance'))['total'] or 0
        total_payable = abs(contacts.filter(balance__lt=0).aggregate(
            total=Sum('balance'))['total'] or 0)
        
        # Low stock products
        from apps.inventory.models import Product
        low_stock_count = Product.objects.filter(
            merchant=merchant,
            is_deleted=False,
            is_active=True,
            is_service=False,
            stock_quantity__lte=models.F('low_stock_threshold')
        ).count() if hasattr(models, 'F') else 0
        
        return Response({
            'success': True,
            'today': today_summary,
            'this_week': week_summary,
            'this_month': month_summary,
            'dues': {
                'receivable': total_receivable,  # পাওনা
                'payable': total_payable,  # দেনা
            },
            'low_stock_count': low_stock_count,
            'recent_transactions': TransactionListSerializer(
                base_qs.order_by('-created_at')[:5], many=True
            ).data
        })
    
    def _get_summary(self, queryset):
        """Calculate summary for a queryset."""
        aggregates = queryset.aggregate(
            total_sales=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.SALE)),
            total_purchases=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.PURCHASE)),
            total_expenses=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.EXPENSE)),
            total_income=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.INCOME)),
            total_received=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.PAYMENT_IN)),
            total_paid=Sum('total_amount', filter=Q(transaction_type=Transaction.TransactionType.PAYMENT_OUT)),
            count=Count('id')
        )
        
        sales = aggregates['total_sales'] or Decimal('0')
        purchases = aggregates['total_purchases'] or Decimal('0')
        expenses = aggregates['total_expenses'] or Decimal('0')
        income = aggregates['total_income'] or Decimal('0')
        received = aggregates['total_received'] or Decimal('0')
        paid = aggregates['total_paid'] or Decimal('0')
        
        return {
            'total_sales': sales,  # মোট বিক্রয়
            'total_purchases': purchases,  # মোট ক্রয়
            'total_expenses': expenses,  # মোট খরচ
            'total_income': income,  # অন্যান্য আয়
            'total_received': received,  # মোট পেলাম
            'total_paid': paid,  # মোট দিলাম
            'gross_profit': sales - purchases,  # মোট লাভ
            'net_cash_flow': (sales + income + received) - (purchases + expenses + paid),
            'transaction_count': aggregates['count']
        }


# Import models at module level for F expression
from django.db import models