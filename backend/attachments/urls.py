"""
URL configuration for Attachments app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSet
router = DefaultRouter()
router.register(r'attachments', views.AttachmentViewSet, basename='attachment')

app_name = 'attachments'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # File upload
    path('upload/', views.AttachmentUploadView.as_view(), name='attachment-upload'),
    
    # File download
    path('attachments/<int:pk>/download/', views.AttachmentDownloadView.as_view(), name='attachment-download'),
    
    # File deletion
    path('attachments/<int:pk>/delete/', views.AttachmentDeleteView.as_view(), name='attachment-delete'),
    
    # Bulk operations
    path('bulk-operations/', views.BulkAttachmentOperationsView.as_view(), name='bulk-operations'),
    
    # File validation
    path('validate/', views.FileValidationView.as_view(), name='file-validation'),
]