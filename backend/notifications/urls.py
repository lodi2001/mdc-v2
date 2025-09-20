"""
URL configuration for Notifications API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

# Create router for ViewSets
router = DefaultRouter()
router.register(r'templates', views.EmailTemplateViewSet)
router.register(r'email-notifications', views.EmailNotificationViewSet)
router.register(r'preferences', views.NotificationPreferenceViewSet)
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # ViewSet URLs
    path('', include(router.urls)),
    
    # Individual notification sending
    path('send/', views.NotificationSendView.as_view(), name='send-notification'),
    
    # Bulk notification sending
    path('send/bulk/', views.BulkNotificationSendView.as_view(), name='bulk-send-notifications'),
    
    # System health and monitoring
    path('health/', views.NotificationHealthView.as_view(), name='notification-health'),
    path('queue/', views.NotificationQueueView.as_view(), name='notification-queue'),
]