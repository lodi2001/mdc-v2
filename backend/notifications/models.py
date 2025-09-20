"""
Notification models for the MDC Transaction Tracking System.

This module contains models for managing email templates and notifications
with multi-language support and delivery tracking.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.template import Template, Context
from django.conf import settings
from users.models import User
from transactions.models import Transaction


class EmailTemplate(models.Model):
    """
    Email templates for system notifications with multi-language support.
    
    Templates support variable substitution and can be customized
    for different notification types and languages.
    """
    
    LANGUAGE_CHOICES = settings.LANGUAGES
    
    name = models.CharField(
        _('name'),
        max_length=100,
        unique=True,
        help_text=_('Unique identifier for the template')
    )
    
    subject = models.CharField(
        _('subject'),
        max_length=255,
        help_text=_('Email subject line (supports variables)')
    )
    
    body_html = models.TextField(
        _('HTML body'),
        help_text=_('HTML version of the email (supports variables)')
    )
    
    body_text = models.TextField(
        _('text body'),
        help_text=_('Plain text version of the email (supports variables)')
    )
    
    variables = models.JSONField(
        _('variables'),
        default=dict,
        blank=True,
        help_text=_('Available template variables and their descriptions')
    )
    
    language = models.CharField(
        _('language'),
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='en',
        help_text=_('Template language')
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this template is active')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_email_templates',
        verbose_name=_('created by')
    )
    
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_email_templates',
        verbose_name=_('updated by')
    )
    
    class Meta:
        verbose_name = _('Email Template')
        verbose_name_plural = _('Email Templates')
        db_table = 'email_templates'
        unique_together = [['name', 'language']]
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['language']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_language_display()})"
    
    def render(self, context_dict):
        """
        Render template with provided context.
        
        Args:
            context_dict: Dictionary of variables for template
            
        Returns:
            dict: Rendered subject, html_body, and text_body
        """
        context = Context(context_dict)
        
        return {
            'subject': Template(self.subject).render(context),
            'html_body': Template(self.body_html).render(context),
            'text_body': Template(self.body_text).render(context),
        }
    
    @classmethod
    def get_template(cls, name, language='en'):
        """
        Get template by name and language with fallback to English.
        
        Args:
            name: Template name
            language: Preferred language
            
        Returns:
            EmailTemplate: Template instance or None
        """
        try:
            return cls.objects.get(name=name, language=language, is_active=True)
        except cls.DoesNotExist:
            # Fallback to English if preferred language not found
            if language != 'en':
                try:
                    return cls.objects.get(name=name, language='en', is_active=True)
                except cls.DoesNotExist:
                    pass
        return None


class EmailNotification(models.Model):
    """
    Email notification instances with delivery tracking.
    
    Tracks individual email notifications sent by the system
    with delivery status and error information.
    """
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('failed', _('Failed')),
        ('bounced', _('Bounced')),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_notifications',
        verbose_name=_('user'),
        help_text=_('User to whom this notification was sent')
    )
    
    template_name = models.CharField(
        _('template name'),
        max_length=100,
        help_text=_('Name of the email template used')
    )
    
    recipient_email = models.EmailField(
        _('recipient email'),
        help_text=_('Email address of the recipient')
    )
    
    subject = models.CharField(
        _('subject'),
        max_length=255,
        help_text=_('Rendered email subject')
    )
    
    body_html = models.TextField(
        _('HTML body'),
        blank=True,
        help_text=_('Rendered HTML email body')
    )
    
    body_text = models.TextField(
        _('text body'),
        blank=True,
        help_text=_('Rendered plain text email body')
    )
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('Delivery status of the email')
    )
    
    error_message = models.TextField(
        _('error message'),
        blank=True,
        help_text=_('Error message if delivery failed')
    )
    
    sent_at = models.DateTimeField(
        _('sent at'),
        null=True,
        blank=True,
        help_text=_('Timestamp when email was sent')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    # Related objects
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_notifications',
        verbose_name=_('transaction'),
        help_text=_('Related transaction (if applicable)')
    )
    
    variables = models.JSONField(
        _('variables'),
        default=dict,
        blank=True,
        help_text=_('Template variables used for rendering')
    )
    
    # Retry mechanism
    retry_count = models.PositiveIntegerField(
        _('retry count'),
        default=0,
        help_text=_('Number of delivery attempts')
    )
    
    max_retries = models.PositiveIntegerField(
        _('max retries'),
        default=3,
        help_text=_('Maximum number of retry attempts')
    )
    
    next_retry_at = models.DateTimeField(
        _('next retry at'),
        null=True,
        blank=True,
        help_text=_('Next retry attempt timestamp')
    )
    
    class Meta:
        verbose_name = _('Email Notification')
        verbose_name_plural = _('Email Notifications')
        db_table = 'email_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['template_name']),
            models.Index(fields=['transaction']),
            models.Index(fields=['next_retry_at']),
        ]
    
    def __str__(self):
        return f"{self.template_name} to {self.recipient_email}"
    
    @property
    def can_retry(self):
        """Check if notification can be retried."""
        return (self.status == 'failed' and 
                self.retry_count < self.max_retries)
    
    def mark_sent(self):
        """Mark notification as successfully sent."""
        from django.utils import timezone
        
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.error_message = ''
        self.save()
    
    def mark_failed(self, error_message, schedule_retry=True):
        """
        Mark notification as failed.
        
        Args:
            error_message: Error description
            schedule_retry: Whether to schedule a retry
        """
        from django.utils import timezone
        from datetime import timedelta
        
        self.status = 'failed'
        self.error_message = error_message
        self.retry_count += 1
        
        if schedule_retry and self.can_retry:
            # Schedule retry with exponential backoff
            delay_minutes = 5 * (2 ** (self.retry_count - 1))  # 5, 10, 20 minutes
            self.next_retry_at = timezone.now() + timedelta(minutes=delay_minutes)
        else:
            self.next_retry_at = None
        
        self.save()
    
    @classmethod
    def create_from_template(cls, template_name, recipient_email, context, 
                           user=None, transaction=None, language='en'):
        """
        Create notification from template.
        
        Args:
            template_name: Name of the email template
            recipient_email: Recipient's email address
            context: Template variables
            user: User instance (optional)
            transaction: Transaction instance (optional)
            language: Preferred language
            
        Returns:
            EmailNotification: Created notification instance
        """
        template = EmailTemplate.get_template(template_name, language)
        if not template:
            raise ValueError(f"Email template '{template_name}' not found")
        
        rendered = template.render(context)
        
        return cls.objects.create(
            user=user,
            template_name=template_name,
            recipient_email=recipient_email,
            subject=rendered['subject'],
            body_html=rendered['html_body'],
            body_text=rendered['text_body'],
            transaction=transaction,
            variables=context
        )
    
    @classmethod
    def get_pending_notifications(cls):
        """Get notifications pending delivery."""
        return cls.objects.filter(status='pending')
    
    @classmethod
    def get_retry_notifications(cls):
        """Get notifications ready for retry."""
        from django.utils import timezone
        
        return cls.objects.filter(
            status='failed',
            retry_count__lt=models.F('max_retries'),
            next_retry_at__lte=timezone.now()
        )


class NotificationPreference(models.Model):
    """
    User notification preferences.
    
    Allows users to control which types of notifications
    they want to receive via email.
    """
    
    NOTIFICATION_TYPES = [
        ('transaction_created', _('Transaction Created')),
        ('transaction_updated', _('Transaction Updated')),
        ('status_changed', _('Status Changed')),
        ('assignment_changed', _('Assignment Changed')),
        ('comment_added', _('Comment Added')),
        ('file_uploaded', _('File Uploaded')),
        ('due_date_reminder', _('Due Date Reminder')),
        ('overdue_alert', _('Overdue Alert')),
        ('welcome', _('Welcome Email')),
        ('password_reset', _('Password Reset')),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name=_('user')
    )
    
    notification_type = models.CharField(
        _('notification type'),
        max_length=50,
        choices=NOTIFICATION_TYPES,
        help_text=_('Type of notification')
    )
    
    email_enabled = models.BooleanField(
        _('email enabled'),
        default=True,
        help_text=_('Whether to send email notifications')
    )
    
    # Future: in-app notifications, SMS, etc.
    in_app_enabled = models.BooleanField(
        _('in-app enabled'),
        default=True,
        help_text=_('Whether to show in-app notifications')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    class Meta:
        verbose_name = _('Notification Preference')
        verbose_name_plural = _('Notification Preferences')
        db_table = 'notification_preferences'
        unique_together = [['user', 'notification_type']]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.user.get_display_name()} - {self.get_notification_type_display()}"
    
    @classmethod
    def is_enabled(cls, user, notification_type, channel='email'):
        """
        Check if notification is enabled for user.
        
        Args:
            user: User instance
            notification_type: Type of notification
            channel: Notification channel ('email', 'in_app')
            
        Returns:
            bool: True if enabled (default to True if not set)
        """
        try:
            pref = cls.objects.get(user=user, notification_type=notification_type)
            if channel == 'email':
                return pref.email_enabled
            elif channel == 'in_app':
                return pref.in_app_enabled
        except cls.DoesNotExist:
            # Default to enabled if no preference set
            return True
        
        return False
    
    @classmethod
    def create_defaults_for_user(cls, user):
        """Create default notification preferences for a user."""
        defaults = []
        for notification_type, _ in cls.NOTIFICATION_TYPES:
            defaults.append(cls(
                user=user,
                notification_type=notification_type,
                email_enabled=True,
                in_app_enabled=True
            ))
        
        cls.objects.bulk_create(defaults, ignore_conflicts=True)


class Notification(models.Model):
    """
    In-app notifications for users.
    
    These are displayed in the notification page and header dropdown.
    """
    
    TYPE_CHOICES = [
        ('transaction', _('Transaction')),
        ('system', _('System')),
        ('user', _('User')),
        ('report', _('Report')),
    ]
    
    CATEGORY_CHOICES = [
        ('info', _('Information')),
        ('success', _('Success')),
        ('warning', _('Warning')),
        ('danger', _('Danger')),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('user'),
        help_text=_('User who receives this notification')
    )
    
    title = models.CharField(
        _('title'),
        max_length=200,
        help_text=_('Notification title')
    )
    
    message = models.TextField(
        _('message'),
        help_text=_('Notification message content')
    )
    
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=TYPE_CHOICES,
        default='system',
        help_text=_('Type of notification')
    )
    
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='info',
        help_text=_('Category/severity of notification')
    )
    
    is_read = models.BooleanField(
        _('is read'),
        default=False,
        help_text=_('Whether notification has been read')
    )
    
    read_at = models.DateTimeField(
        _('read at'),
        null=True,
        blank=True,
        help_text=_('Timestamp when notification was read')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    # Optional related transaction
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name=_('transaction'),
        help_text=_('Related transaction (if applicable)')
    )
    
    # Action link
    action_link = models.CharField(
        _('action link'),
        max_length=255,
        blank=True,
        help_text=_('Optional link for notification action')
    )
    
    # Additional data
    metadata = models.JSONField(
        _('metadata'),
        default=dict,
        blank=True,
        help_text=_('Additional notification data')
    )
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.get_display_name()}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    @classmethod
    def create_for_user(cls, user, title, message, type='system', category='info', 
                       transaction=None, action_link='', metadata=None):
        """
        Create a notification for a user.
        
        Args:
            user: User instance
            title: Notification title
            message: Notification message
            type: Notification type
            category: Notification category
            transaction: Related transaction (optional)
            action_link: Action link (optional)
            metadata: Additional data (optional)
            
        Returns:
            Notification: Created notification instance
        """
        return cls.objects.create(
            user=user,
            title=title,
            message=message,
            type=type,
            category=category,
            transaction=transaction,
            action_link=action_link,
            metadata=metadata or {}
        )
    
    @classmethod
    def create_bulk(cls, users, title, message, **kwargs):
        """
        Create notifications for multiple users.
        
        Args:
            users: List of User instances
            title: Notification title
            message: Notification message
            **kwargs: Additional notification fields
            
        Returns:
            list: Created notification instances
        """
        notifications = [
            cls(
                user=user,
                title=title,
                message=message,
                **kwargs
            )
            for user in users
        ]
        
        return cls.objects.bulk_create(notifications)
    
    @classmethod
    def get_unread_count(cls, user):
        """Get count of unread notifications for a user."""
        return cls.objects.filter(user=user, is_read=False).count()
    
    @classmethod
    def mark_all_as_read(cls, user):
        """Mark all notifications as read for a user."""
        from django.utils import timezone
        
        cls.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
    
    @classmethod
    def clear_all(cls, user):
        """Clear all notifications for a user."""
        cls.objects.filter(user=user).delete()
