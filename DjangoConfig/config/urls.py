"""
URL configuration for TakaTracker project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def welcome(request):
    """Root URL welcome view."""
    return JsonResponse({
        'name': 'TakaTracker API',
        'name_bn': 'টাকাট্র্যাকার API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'admin': '/admin/',
            'health': '/api/health/',
            'auth': '/api/v1/auth/',
            'contacts': '/api/v1/contacts/',
            'transactions': '/api/v1/transactions/',
            'inventory': '/api/v1/inventory/',
            'payments': '/api/v1/payments/',
            'sync': '/api/v1/sync/',
        }
    })

def health_check(request):
    """Health check endpoint for Railway/deployment monitoring."""
    return JsonResponse({
        'status': 'healthy',
        'message': 'TakaTracker API is running',
        'message_bn': 'টাকাট্র্যাকার API চালু আছে'
    })


urlpatterns = [
    # Root welcome
    path('', welcome, name='welcome'),
    
    path('admin/', admin.site.urls),
    
    # Health check for Railway
    path('api/health/', health_check, name='health_check'),
    
    # API endpoints
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/contacts/', include('apps.contacts.urls')),
    path('api/v1/transactions/', include('apps.transactions.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/sync/', include('apps.sync.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
