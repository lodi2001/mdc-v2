"""
URL configuration for MDC Transaction Tracking System.

Main URL routing for the backend API with versioning and proper organization.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def api_root(request):
    """API root endpoint with version information."""
    return JsonResponse({
        'message': 'MDC Transaction Tracking System API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'users': '/api/v1/users/',
            'transactions': '/api/v1/transactions/',
            'attachments': '/api/v1/attachments/',
            'notifications': '/api/v1/notifications/',
            'dashboard': '/api/v1/dashboard/',
            'system': '/api/v1/system/',
            'audit': '/api/v1/audit/',
            'reports': '/api/v1/reports/',
            'workflows': '/api/v1/workflows/',
            'admin': '/admin/',
            'docs': '/api/docs/',
        },
        'authentication': {
            'login': '/api/v1/auth/login/',
            'refresh': '/api/v1/auth/refresh/',
            'logout': '/api/v1/auth/logout/',
        },
        'documentation': {
            'swagger': '/api/docs/swagger/',
            'redoc': '/api/docs/redoc/',
        }
    })


urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API root
    path('api/', api_root, name='api_root'),
    path('', api_root, name='root'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/transactions/', include('transactions.urls')),
    path('api/v1/attachments/', include('attachments.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/system/', include('system_settings.urls')),
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/workflows/', include('workflows.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-alt'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
