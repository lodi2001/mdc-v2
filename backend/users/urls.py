"""
URL configuration for Users app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSet
router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='user')

app_name = 'users'

urlpatterns = [
    # User management endpoints (must come before router URLs to avoid conflicts)
    path('pending/', views.PendingUsersView.as_view(), name='pending-users'),
    path('approve/', views.ApproveUserView.as_view(), name='approve-user'),
    path('bulk-operations/', views.BulkUserOperationsView.as_view(), name='bulk-operations'),
    path('clients/', views.ClientListView.as_view(), name='client-list'),

    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),

    # Password management
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    path('reset-password/', views.PasswordResetRequestView.as_view(), name='reset-password'),
    path('reset-password/confirm/', views.PasswordResetConfirmView.as_view(), name='reset-password-confirm'),

    # Include router URLs (must come last to catch remaining patterns)
    path('', include(router.urls)),

    # System settings - removed (now handled by system_settings app)
]