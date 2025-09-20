"""
URL configuration for Audit API
"""

from django.urls import path
from django.http import JsonResponse

app_name = 'audit'

def audit_placeholder(request):
    """Placeholder for audit endpoints"""
    return JsonResponse({
        'message': 'Audit API endpoints will be implemented in future updates',
        'endpoints': {
            'logs': 'Coming soon',
            'reports': 'Coming soon',
            'activity': 'Coming soon'
        }
    })

urlpatterns = [
    path('', audit_placeholder, name='audit-placeholder'),
]