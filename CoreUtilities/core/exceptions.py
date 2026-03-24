"""
Custom exception handler for consistent API error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format.
    """
    response = exception_handler(exc, context)
    
    if response is None:
        return Response({
            'success': False,
            'error': {
                'code': 'server_error',
                'message': 'An unexpected error occurred.',
                'message_bn': 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Standardize error response format
    error_data = {
        'success': False,
        'error': {
            'code': getattr(exc, 'default_code', 'error'),
            'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            'details': response.data if isinstance(response.data, dict) else {'message': response.data}
        }
    }
    
    response.data = error_data
    return response


class APIException(Exception):
    """Base API exception with Bengali support."""
    
    def __init__(self, message, message_bn=None, code='error', status_code=400):
        self.message = message
        self.message_bn = message_bn or message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class ValidationError(APIException):
    """Validation error."""
    
    def __init__(self, message, message_bn=None, field=None):
        super().__init__(
            message=message,
            message_bn=message_bn,
            code='validation_error',
            status_code=400
        )
        self.field = field


class NotFoundError(APIException):
    """Resource not found error."""
    
    def __init__(self, resource='Resource', message_bn=None):
        super().__init__(
            message=f'{resource} not found',
            message_bn=message_bn or f'{resource} পাওয়া যায়নি',
            code='not_found',
            status_code=404
        )
