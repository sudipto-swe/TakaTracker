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
