"""
Authentication views for the MDC Transaction Tracking System.

This module contains API views for user authentication, registration,
and password management with proper security and audit logging.
"""

import secrets
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import login, logout
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User, PasswordResetToken, EmailVerificationToken
from audit.models import AuditLog
from notifications.models import EmailNotification, NotificationPreference
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserProfileSerializer,
    GoogleAuthSerializer
)


class AuthRateThrottle(AnonRateThrottle):
    """Custom rate throttle for authentication endpoints."""
    scope = 'auth'


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view with audit logging and rate limiting.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]
    
    def post(self, request, *args, **kwargs):
        # Handle both email and username fields since our User model uses email as USERNAME_FIELD
        data = request.data.copy()

        # If only email is provided, copy it to username field (which JWT expects)
        if 'email' in data and 'username' not in data:
            data['username'] = data['email']
        # If username looks like an email, also set it as email
        elif 'username' in data and '@' in data.get('username', '') and 'email' not in data:
            data['email'] = data['username']

        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.user

            # Log successful login
            AuditLog.log_login(user, request, success=True)

            return Response(serializer.validated_data, status=status.HTTP_200_OK)

        except Exception as e:
            # Log failed login attempt
            email = request.data.get('email', '') or request.data.get('username', '')
            try:
                user = User.objects.get(email=email) if email else None
            except User.DoesNotExist:
                user = None

            AuditLog.log_login(user, request, success=False)

            # Return generic error for security
            return Response({
                'detail': _('Invalid credentials.')
            }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def register(request):
    """
    User registration endpoint with admin approval workflow.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Log user registration
        AuditLog.log_model_change(
            user=None,  # Anonymous registration
            instance=user,
            action='create',
            new_values={
                'email': user.email,
                'name': user.get_full_name(),
                'role': user.role,
                'status': user.status
            },
            request=request
        )
        
        # Create default notification preferences
        NotificationPreference.create_defaults_for_user(user)
        
        # Generate email verification token
        verification_token = hashlib.sha256(
            f"{user.id}{user.email}{timezone.now().timestamp()}{secrets.token_urlsafe(32)}".encode()
        ).hexdigest()
        
        EmailVerificationToken.objects.create(
            user=user,
            token=verification_token,
            expires_at=timezone.now() + timedelta(hours=48)  # 48 hours to verify
        )
        
        # Send verification email
        try:
            EmailNotification.create_from_template(
                template_name='email_verification',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'verification_url': f"{settings.MDC_SETTINGS['FRONTEND_URL']}/verify-email?token={verification_token}",
                    'company_name': user.company_name or 'N/A',
                    'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL'],
                },
                user=user,
                language=user.language_preference
            )
        except Exception as e:
            # Don't fail registration if email fails
            import logging
            logger = logging.getLogger('mdc_backend.auth')
            logger.warning(f"Failed to send verification email to {user.email}: {e}")
        
        # Notify admins about new registration
        admin_users = User.objects.filter(role='admin', is_active=True)
        for admin in admin_users:
            try:
                EmailNotification.create_from_template(
                    template_name='new_user_registration',
                    recipient_email=admin.email,
                    context={
                        'admin_name': admin.get_full_name(),
                        'new_user_name': user.get_full_name(),
                        'new_user_email': user.email,
                        'new_user_company': user.company_name or 'N/A',
                        'approval_url': f"{settings.MDC_SETTINGS['FRONTEND_URL']}/admin/users/pending",
                    },
                    user=admin,
                    language=admin.language_preference
                )
            except Exception as e:
                import logging
                logger = logging.getLogger('mdc_backend.auth')
                logger.warning(f"Failed to send admin notification email to {admin.email}: {e}")
        
        return Response({
            'message': _('Registration successful. Your account is pending approval.'),
            'user_id': user.id,
            'status': user.status
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Password change endpoint for authenticated users.
    """
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Log password change
        AuditLog.log_action(
            user=user,
            action='password_change',
            table_name='users',
            record_id=user.id,
            description='User changed password',
            request=request
        )
        
        # Send confirmation email
        try:
            EmailNotification.create_from_template(
                template_name='password_changed',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'change_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                },
                user=user,
                language=user.language_preference
            )
        except Exception:
            pass  # Don't fail the operation if email fails
        
        return Response({
            'message': _('Password changed successfully.')
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def verify_email(request):
    """
    Email verification endpoint.
    """
    token = request.data.get('token')
    
    if not token:
        return Response({
            'detail': _('Verification token is required.')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        verification_token = EmailVerificationToken.objects.get(token=token)
        
        if not verification_token.is_valid:
            if verification_token.used:
                return Response({
                    'detail': _('This verification link has already been used.')
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'detail': _('This verification link has expired.')
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark token as used and verify email
        verification_token.use_token()
        user = verification_token.user
        
        # Log email verification
        AuditLog.log_action(
            user=user,
            action='email_verified',
            table_name='users',
            record_id=user.id,
            description='Email address verified',
            request=request
        )
        
        # Send confirmation email
        try:
            EmailNotification.create_from_template(
                template_name='email_verified',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL'],
                },
                user=user,
                language=user.language_preference
            )
        except Exception:
            pass  # Don't fail if email fails
        
        return Response({
            'message': _('Email verified successfully.'),
            'email_verified': True,
            'user_status': user.status
        }, status=status.HTTP_200_OK)
        
    except EmailVerificationToken.DoesNotExist:
        return Response({
            'detail': _('Invalid verification token.')
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def resend_verification_email(request):
    """
    Resend email verification link.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'detail': _('Email is required.')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Check if already verified
        if user.email_verified:
            return Response({
                'message': _('Email is already verified.')
            }, status=status.HTTP_200_OK)
        
        # Invalidate old tokens
        EmailVerificationToken.objects.filter(
            user=user,
            used=False
        ).update(used=True)
        
        # Generate new verification token
        verification_token = hashlib.sha256(
            f"{user.id}{user.email}{timezone.now().timestamp()}{secrets.token_urlsafe(32)}".encode()
        ).hexdigest()
        
        EmailVerificationToken.objects.create(
            user=user,
            token=verification_token,
            expires_at=timezone.now() + timedelta(hours=48)
        )
        
        # Send verification email
        try:
            EmailNotification.create_from_template(
                template_name='email_verification',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'verification_url': f"{settings.MDC_SETTINGS['FRONTEND_URL']}/verify-email?token={verification_token}",
                    'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL'],
                },
                user=user,
                language=user.language_preference
            )
        except Exception:
            pass
        
    except User.DoesNotExist:
        pass  # Don't reveal if email exists
    
    # Always return success for security
    return Response({
        'message': _('If the email exists and is unverified, a new verification link has been sent.')
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def password_reset_request(request):
    """
    Password reset request endpoint.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generate reset token
            token = hashlib.sha256(
                f"{user.id}{user.email}{timezone.now().timestamp()}{secrets.token_urlsafe(32)}".encode()
            ).hexdigest()
            
            # Create reset token record
            reset_token = PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(
                    seconds=settings.MDC_SETTINGS['PASSWORD_RESET_TIMEOUT']
                )
            )
            
            # Send reset email
            EmailNotification.create_from_template(
                template_name='password_reset',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'reset_url': f"{settings.MDC_SETTINGS['FRONTEND_URL']}/reset-password?token={token}",
                    'expiry_hours': settings.MDC_SETTINGS['PASSWORD_RESET_TIMEOUT'] // 3600,
                },
                user=user,
                language=user.language_preference
            )
            
            # Log password reset request
            AuditLog.log_action(
                user=user,
                action='password_reset',
                table_name='users',
                record_id=user.id,
                description='Password reset requested',
                request=request
            )
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            pass
        
        # Always return success message for security
        return Response({
            'message': _('If the email address exists, a password reset link has been sent.')
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def password_reset_confirm(request):
    """
    Password reset confirmation endpoint.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Log password reset completion
        AuditLog.log_action(
            user=user,
            action='password_reset',
            table_name='users',
            record_id=user.id,
            description='Password reset completed',
            request=request
        )
        
        # Send confirmation email
        try:
            EmailNotification.create_from_template(
                template_name='password_reset_complete',
                recipient_email=user.email,
                context={
                    'user_name': user.get_full_name(),
                    'reset_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                },
                user=user,
                language=user.language_preference
            )
        except Exception:
            pass
        
        return Response({
            'message': _('Password reset successful. You can now log in with your new password.')
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    """
    User profile endpoint for viewing and updating profile information.
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Track changes for audit log
            old_values = {
                field: getattr(user, field) 
                for field in serializer.validated_data.keys()
            }
            
            user = serializer.save()
            
            # Log profile update
            AuditLog.log_model_change(
                user=user,
                instance=user,
                action='update',
                old_values=old_values,
                new_values=serializer.validated_data,
                request=request
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
def google_auth(request):
    """
    Google OAuth authentication endpoint.
    """
    serializer = GoogleAuthSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.create_or_get_user()
            
            # Check if user account is active
            if not user.is_active_user:
                if user.status == 'pending':
                    return Response({
                        'detail': _('Your account is pending approval.')
                    }, status=status.HTTP_403_FORBIDDEN)
                elif user.status == 'suspended':
                    return Response({
                        'detail': _('Your account has been suspended.')
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    return Response({
                        'detail': _('Your account is inactive.')
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Log successful login
            AuditLog.log_login(user, request, success=True)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.get_full_name(),
                    'role': user.role,
                    'language_preference': user.language_preference,
                    'is_admin': user.is_admin,
                    'is_editor': user.is_editor,
                    'is_client': user.is_client,
                }
            })
            
        except Exception as e:
            # Log failed login attempt
            AuditLog.log_action(
                user=None,
                action='login_failed',
                table_name='users',
                description=f'Google OAuth login failed: {str(e)}',
                request=request
            )
            
            return Response({
                'detail': _('Google authentication failed.')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    User logout endpoint with token blacklisting.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Log logout
        AuditLog.log_logout(request.user, request)
        
        return Response({
            'message': _('Successfully logged out.')
        }, status=status.HTTP_200_OK)
        
    except Exception:
        return Response({
            'message': _('Successfully logged out.')
        }, status=status.HTTP_200_OK)
