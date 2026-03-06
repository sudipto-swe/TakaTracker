"""
Contact views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Contact
from .serializers import ContactSerializer, ContactListSerializer


class ContactViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contacts (customers & suppliers)."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ContactListSerializer
        return ContactSerializer
    
    def get_queryset(self):
        merchant = self.request.user.get_merchant()
        queryset = Contact.objects.filter(merchant=merchant, is_deleted=False)
        
        # Filter by type
        contact_type = self.request.query_params.get('type')
        if contact_type:
            queryset = queryset.filter(contact_type=contact_type)
        
        # Filter by balance status
        has_dues = self.request.query_params.get('has_dues')
        if has_dues == 'true':
            queryset = queryset.exclude(balance=0)
        elif has_dues == 'receivable':
            queryset = queryset.filter(balance__gt=0)
        elif has_dues == 'payable':
            queryset = queryset.filter(balance__lt=0)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(phone__icontains=search)
            )
        
        return queryset.order_by('name')
    
    def perform_destroy(self, instance):
        """Soft delete for sync support."""
        instance.is_deleted = True
        instance.save()
    
    @action(detail=False, methods=['get'])
    def customers(self, request):
        """Get customers only (গ্রাহক)."""
        queryset = self.get_queryset().filter(
            contact_type__in=[Contact.ContactType.CUSTOMER, Contact.ContactType.BOTH]
        )
        serializer = ContactListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'customers': serializer.data,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def suppliers(self, request):
        """Get suppliers only (সরবরাহকারী)."""
        queryset = self.get_queryset().filter(
            contact_type__in=[Contact.ContactType.SUPPLIER, Contact.ContactType.BOTH]
        )
        serializer = ContactListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'suppliers': serializer.data,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def dues(self, request):
        """Get contacts with outstanding dues (বাকি তালিকা)."""
        queryset = self.get_queryset().exclude(balance=0).order_by('-balance')
        
        receivables = queryset.filter(balance__gt=0)  # পাওনা
        payables = queryset.filter(balance__lt=0)  # দেনা
        
        return Response({
            'success': True,
            'receivables': {
                'contacts': ContactListSerializer(receivables, many=True).data,
                'total': sum(c.balance for c in receivables)
            },
            'payables': {
                'contacts': ContactListSerializer(payables, many=True).data,
                'total': abs(sum(c.balance for c in payables))
            }
        })
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get transactions for a specific contact."""
        contact = self.get_object()
        from apps.transactions.models import Transaction
        from apps.transactions.serializers import TransactionListSerializer
        
        transactions = Transaction.objects.filter(
            contact=contact,
            is_deleted=False
        ).order_by('-transaction_date', '-created_at')[:50]
        
        return Response({
            'success': True,
            'contact': ContactSerializer(contact).data,
            'transactions': TransactionListSerializer(transactions, many=True).data
        })