"""
User models for the MDC Transaction Tracking System.

This module contains the User model and related functionality for managing
user accounts, roles, and permissions according to the system architecture.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.conf import settings


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    
    Supports three-tier role system: Admin, Editor, Client
    with proper user status management and Google OAuth integration.
    """
    
    ROLE_CHOICES = settings.USER_ROLES
    STATUS_CHOICES = settings.USER_STATUSES
    LANGUAGE_CHOICES = settings.LANGUAGES
    
    # Override email to be unique and required
    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('Required. Must be a valid email address.'),
        error_messages={
            'unique': _("A user with that email already exists."),
        },
    )
    
    # Additional required fields
    phone_number = models.CharField(
        _('phone number'),
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message=_('Phone number must be entered in the format: "+999999999". Up to 15 digits allowed.')
            )
        ],
        blank=True,
        help_text=_('Contact phone number in international format')
    )
    
    company_name = models.CharField(
        _('company name'),
        max_length=255,
        blank=True,
        help_text=_('Company or organization name')
    )
    
    national_id = models.CharField(
        _('national ID'),
        max_length=50,
        blank=True,
        help_text=_('National ID or commercial registration number')
    )
    
    # Role and status management
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=ROLE_CHOICES,
        default='client',
        help_text=_('User role determines access permissions')
    )
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('User account status')
    )
    
    # Localization
    language_preference = models.CharField(
        _('language preference'),
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='en',
        help_text=_('Preferred language for interface and notifications')
    )
    
    # Google OAuth integration
    google_id = models.CharField(
        _('Google ID'),
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text=_('Google OAuth unique identifier')
    )
    
    is_google_auth = models.BooleanField(
        _('is Google authenticated'),
        default=False,
        help_text=_('Whether user registered via Google OAuth')
    )
    
    profile_picture_url = models.URLField(
        _('profile picture URL'),
        max_length=500,
        blank=True,
        null=True,
        help_text=_('URL to user profile picture from Google or other sources')
    )
    
    # Email verification
    email_verified = models.BooleanField(
        _('email verified'),
        default=False,
        help_text=_('Whether user email has been verified')
    )

    # Comment permission
    can_comment = models.BooleanField(
        _('can comment'),
        default=False,
        help_text=_('Whether client user can add comments to transactions')
    )
    
    # Approval workflow
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        verbose_name=_('created by'),
        help_text=_('Admin user who created this account')
    )
    
    approved_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_users',
        verbose_name=_('approved by'),
        help_text=_('Admin user who approved this account')
    )
    
    approved_at = models.DateTimeField(
        _('approved at'),
        null=True,
        blank=True,
        help_text=_('Timestamp when account was approved')
    )
    
    # Additional timestamps
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
            models.Index(fields=['google_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        """Return the full name of the user."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.username

    @property
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == 'admin'
    
    @property
    def is_editor(self):
        """Check if user has editor role."""
        return self.role == 'editor'
    
    @property
    def is_client(self):
        """Check if user has client role."""
        return self.role == 'client'
    
    @property
    def is_active_user(self):
        """Check if user account is active."""
        return self.status == 'active' and self.is_active
    
    @property
    def is_pending_approval(self):
        """Check if user is pending approval."""
        return self.status == 'pending'
    
    def get_display_name(self):
        """Get user's display name."""
        full_name = self.get_full_name()
        return full_name if full_name else self.email
    
    def can_access_transaction(self, transaction):
        """
        Check if user can access a specific transaction based on role.
        
        Args:
            transaction: Transaction instance
            
        Returns:
            bool: True if user can access transaction
        """
        if self.is_admin:
            return True
        elif self.is_editor:
            return (transaction.assigned_to == self or 
                   transaction.created_by == self)
        elif self.is_client:
            return transaction.client == self
        return False
    
    def can_edit_transaction(self, transaction):
        """
        Check if user can edit a specific transaction.
        
        Args:
            transaction: Transaction instance
            
        Returns:
            bool: True if user can edit transaction
        """
        if self.is_admin:
            return True
        elif self.is_editor:
            return transaction.assigned_to == self
        return False
    
    def activate(self, approved_by_user):
        """
        Activate user account (approve registration).
        
        Args:
            approved_by_user: User instance who is approving
        """
        from django.utils import timezone
        
        self.status = 'active'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.email_verified = True
        self.save()
    
    def deactivate(self, reason=None):
        """
        Deactivate user account.
        
        Args:
            reason: Optional reason for deactivation
        """
        self.status = 'inactive'
        self.is_active = False
        self.save()
    
    def suspend(self, reason=None):
        """
        Suspend user account.
        
        Args:
            reason: Optional reason for suspension
        """
        self.status = 'suspended'
        self.is_active = False
        self.save()


class EmailVerificationToken(models.Model):
    """
    Email verification tokens for account activation.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_tokens',
        verbose_name=_('user')
    )
    
    token = models.CharField(
        _('token'),
        max_length=64,
        unique=True,
        help_text=_('Unique token for email verification')
    )
    
    expires_at = models.DateTimeField(
        _('expires at'),
        help_text=_('Token expiration timestamp')
    )
    
    used = models.BooleanField(
        _('used'),
        default=False,
        help_text=_('Whether token has been used')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    used_at = models.DateTimeField(
        _('used at'),
        null=True,
        blank=True,
        help_text=_('Timestamp when token was used')
    )
    
    class Meta:
        verbose_name = _('Email Verification Token')
        verbose_name_plural = _('Email Verification Tokens')
        db_table = 'email_verification_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Email verification for {self.user.email}"
    
    @property
    def is_expired(self):
        """Check if token is expired."""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if token is valid (not used and not expired)."""
        return not self.used and not self.is_expired
    
    def use_token(self):
        """Mark token as used and verify email."""
        from django.utils import timezone
        self.used = True
        self.used_at = timezone.now()
        self.save()
        
        # Mark user's email as verified
        self.user.email_verified = True
        self.user.save()


class PasswordResetToken(models.Model):
    """
    Password reset tokens for secure password reset workflow.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        verbose_name=_('user')
    )
    
    token = models.CharField(
        _('token'),
        max_length=64,
        unique=True,
        help_text=_('Unique token for password reset')
    )
    
    expires_at = models.DateTimeField(
        _('expires at'),
        help_text=_('Token expiration timestamp')
    )
    
    used = models.BooleanField(
        _('used'),
        default=False,
        help_text=_('Whether token has been used')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    used_at = models.DateTimeField(
        _('used at'),
        null=True,
        blank=True,
        help_text=_('Timestamp when token was used')
    )
    
    class Meta:
        verbose_name = _('Password Reset Token')
        verbose_name_plural = _('Password Reset Tokens')
        db_table = 'password_reset_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    @property
    def is_expired(self):
        """Check if token is expired."""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if token is valid (not used and not expired)."""
        return not self.used and not self.is_expired
    
    def use_token(self):
        """Mark token as used."""
        from django.utils import timezone
        self.used = True
        self.used_at = timezone.now()
        self.save()

