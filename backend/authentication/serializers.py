"""
Authentication serializers for the MDC Transaction Tracking System.

This module contains serializers for user authentication, registration,
and password management with proper validation and security.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User, PasswordResetToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with user information and role checking.
    """

    def validate(self, attrs):
        # Since our User model uses email as USERNAME_FIELD,
        # we need to handle the authentication properly
        # The view already maps email to username for us

        data = super().validate(attrs)
        
        user = self.user
        
        # Check if user account is active
        if not user.is_active_user:
            if user.status == 'pending':
                raise serializers.ValidationError(
                    _('Your account is pending approval. Please contact an administrator.')
                )
            elif user.status == 'suspended':
                raise serializers.ValidationError(
                    _('Your account has been suspended. Please contact an administrator.')
                )
            else:
                raise serializers.ValidationError(
                    _('Your account is inactive. Please contact an administrator.')
                )
        
        # Add custom claims to token
        data.update({
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.get_full_name(),
                'role': user.role,
                'language_preference': user.language_preference,
                'is_admin': user.is_admin,
                'is_editor': user.is_editor,
                'is_client': user.is_client,
                'can_comment': user.can_comment,
            }
        })
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with validation.
    """
    
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'phone_number', 'company_name', 'national_id',
            'language_preference', 'password', 'password_confirm'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate registration data."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': _('Passwords do not match.')
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create new user account."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Create user with pending status
        user = User.objects.create_user(
            password=password,
            status='pending',  # Requires admin approval
            **validated_data
        )
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change functionality.
    """
    
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(_('Current password is incorrect.'))
        return value
    
    def validate(self, attrs):
        """Validate password change data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': _('New passwords do not match.')
            })
        
        return attrs
    
    def save(self):
        """Update user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    """
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists in system."""
        try:
            user = User.objects.get(email=value, is_active=True)
            self.user = user
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass
        
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """
    
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_token(self, value):
        """Validate reset token."""
        try:
            reset_token = PasswordResetToken.objects.get(
                token=value,
                used=False
            )
            if reset_token.is_expired:
                raise serializers.ValidationError(_('Reset token has expired.'))
            
            self.reset_token = reset_token
            return value
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError(_('Invalid or expired reset token.'))
    
    def validate(self, attrs):
        """Validate password reset data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': _('Passwords do not match.')
            })
        
        return attrs
    
    def save(self):
        """Reset user password."""
        user = self.reset_token.user
        user.set_password(self.validated_data['new_password'])
        user.save()
        
        # Mark token as used
        self.reset_token.use_token()
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information.
    """
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'display_name', 'phone_number', 'company_name',
            'national_id', 'role', 'status', 'language_preference',
            'email_verified', 'is_google_auth', 'created_at',
            'last_login', 'is_admin', 'is_editor', 'is_client'
        ]
        read_only_fields = [
            'id', 'email', 'role', 'status', 'email_verified',
            'is_google_auth', 'created_at', 'last_login',
            'is_admin', 'is_editor', 'is_client'
        ]


class GoogleAuthSerializer(serializers.Serializer):
    """
    Serializer for Google OAuth authentication.
    """
    
    google_token = serializers.CharField()
    
    def validate_google_token(self, value):
        """
        Validate Google OAuth token and extract user information.
        """
        try:
            # Import Google OAuth libraries
            from google.oauth2 import id_token
            from google.auth.transport import requests
            from django.conf import settings
            
            # Get Google client ID from settings
            google_client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
            if not google_client_id:
                raise serializers.ValidationError(
                    "Google OAuth is not properly configured on the server."
                )
            
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                value, requests.Request(), google_client_id
            )
            
            # Verify that the token was issued by Google
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise serializers.ValidationError("Invalid token issuer.")
            
            # Extract user information from the token
            self.google_user_info = {
                'email': idinfo.get('email'),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'google_id': idinfo.get('sub'),
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False),
            }
            
            # Validate required fields
            if not self.google_user_info['email']:
                raise serializers.ValidationError("Google token does not contain email.")
            
            if not self.google_user_info['google_id']:
                raise serializers.ValidationError("Google token does not contain user ID.")
            
            return value
            
        except ValueError as e:
            # Invalid token
            raise serializers.ValidationError(f"Invalid Google token: {str(e)}")
        except ImportError:
            # Google OAuth library not installed - fallback for development
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Google OAuth library not installed, using development mode")
            
            # Development/testing mode - parse a simple JWT-like structure
            # This should NEVER be used in production
            if hasattr(settings, 'DEBUG') and settings.DEBUG:
                # Mock user info for development
                self.google_user_info = {
                    'email': 'dev.user@example.com',
                    'first_name': 'Dev',
                    'last_name': 'User',
                    'google_id': f'dev_{hash(value) % 1000000}',
                    'name': 'Dev User',
                    'picture': '',
                    'email_verified': True,
                }
                return value
            else:
                raise serializers.ValidationError(
                    "Google OAuth library not available on server."
                )
        except Exception as e:
            # Handle any other exceptions
            raise serializers.ValidationError(f"Token validation failed: {str(e)}")
    
    def create_or_get_user(self):
        """Create or get user from Google OAuth information with profile sync."""
        email = self.google_user_info['email']
        
        try:
            # Try to find existing user by email
            user = User.objects.get(email=email)
            
            # Sync profile information from Google
            updated_fields = []
            
            # Update Google auth information if not set
            if not user.is_google_auth:
                user.is_google_auth = True
                updated_fields.append('is_google_auth')
            
            if not user.google_id:
                user.google_id = self.google_user_info['google_id']
                updated_fields.append('google_id')
            
            # Always verify email for Google users
            if not user.email_verified:
                user.email_verified = True
                updated_fields.append('email_verified')
            
            # Sync profile data if user allows it or if fields are empty
            if not user.first_name and self.google_user_info['first_name']:
                user.first_name = self.google_user_info['first_name']
                updated_fields.append('first_name')
            
            if not user.last_name and self.google_user_info['last_name']:
                user.last_name = self.google_user_info['last_name']
                updated_fields.append('last_name')
            
            # Update profile picture URL if available and not set
            if (hasattr(user, 'profile_picture_url') and 
                not user.profile_picture_url and 
                self.google_user_info.get('picture')):
                user.profile_picture_url = self.google_user_info['picture']
                updated_fields.append('profile_picture_url')
            
            # Save changes if any updates were made
            if updated_fields:
                user.save(update_fields=updated_fields)
                
                # Log profile sync
                from audit.models import AuditLog
                AuditLog.objects.create(
                    user=user,
                    action='google_profile_sync',
                    table_name='users_user',
                    object_id=user.id,
                    details={
                        'updated_fields': updated_fields,
                        'google_profile_data': {
                            'name': self.google_user_info.get('name'),
                            'email_verified': self.google_user_info.get('email_verified'),
                        }
                    }
                )
            
            return user
            
        except User.DoesNotExist:
            # Create new user from Google info
            # Generate unique username from email
            username = email.split('@')[0]
            counter = 1
            original_username = username
            
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                email=email,
                username=username,
                first_name=self.google_user_info['first_name'],
                last_name=self.google_user_info['last_name'],
                google_id=self.google_user_info['google_id'],
                is_google_auth=True,
                email_verified=self.google_user_info.get('email_verified', True),
                status='active',  # Google users are auto-activated
                role='client',  # Default role for new Google users
            )
            
            # Set profile picture if available
            if (hasattr(user, 'profile_picture_url') and 
                self.google_user_info.get('picture')):
                user.profile_picture_url = self.google_user_info['picture']
                user.save(update_fields=['profile_picture_url'])
            
            # Log user creation via Google OAuth
            from audit.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action='user_created_via_google',
                table_name='users_user',
                object_id=user.id,
                details={
                    'google_profile_data': {
                        'name': self.google_user_info.get('name'),
                        'email_verified': self.google_user_info.get('email_verified'),
                        'picture_url': self.google_user_info.get('picture'),
                    },
                    'auto_assigned_role': 'client'
                }
            )
            
            return user