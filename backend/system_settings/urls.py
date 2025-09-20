"""
URL configuration for System Settings API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'system_settings'

# Create router for ViewSets
router = DefaultRouter()
router.register(r'settings', views.SystemSettingViewSet)
router.register(r'maintenance', views.SystemMaintenanceModeViewSet)
router.register(r'configurations', views.SystemConfigurationViewSet)
router.register(r'logs', views.SystemLogViewSet)

urlpatterns = [
    # ViewSet URLs
    path('', include(router.urls)),
    
    # System status and health
    path('health/', views.SystemHealthView.as_view(), name='system-health'),
    path('status/', views.SystemStatusView.as_view(), name='system-status'),
    path('info/', views.SystemInfoView.as_view(), name='system-info'),
]