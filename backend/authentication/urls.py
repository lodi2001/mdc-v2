"""
URL configuration for authentication endpoints.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),
    
    # Registration and user management
    path('register/', views.register, name='register'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification_email, name='resend_verification'),
    path('profile/', views.profile, name='profile'),
    
    # Password management
    path('change-password/', views.change_password, name='change_password'),
    path('reset-password/', views.password_reset_request, name='password_reset_request'),
    path('reset-password/confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    
    # OAuth
    path('google/', views.google_auth, name='google_auth'),
]