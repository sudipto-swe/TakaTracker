"""
Development settings for TakaTracker project.
Uses SQLite for easy local testing without PostgreSQL.
"""
import os
from .base import *

DEBUG = True

# Database — PostgreSQL (local)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'takatracker',
        'USER': 'takatracker',
        'PASSWORD': 'takatracker_dev_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# CORS - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Use local memory cache instead of Redis in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Add browsable API in development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append(
    'rest_framework.renderers.BrowsableAPIRenderer'
)

# Django Extensions for development
INSTALLED_APPS += ['django_extensions']

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
