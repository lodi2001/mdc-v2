"""
Audit models for the MDC Transaction Tracking System.

This module contains the AuditLog model for tracking all system activities
and changes for compliance, security, and debugging purposes.
"""

import json
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from users.models import User


class AuditLog(models.Model):
    """
    Comprehensive audit logging for all system activities.
    
    Tracks user actions, data changes, and system events with
    detailed context information for security and compliance.
    """
    
    ACTION_CHOICES = [
        ('create', _('Create')),
        ('update', _('Update')),
        ('delete', _('Delete')),
        ('login', _('Login')),
        ('logout', _('Logout')),
        ('login_failed', _('Login Failed')),
        ('password_change', _('Password Change')),
        ('password_reset', _('Password Reset')),
        ('status_change', _('Status Change')),
        ('file_upload', _('File Upload')),
        ('file_download', _('File Download')),
        ('file_delete', _('File Delete')),
        ('export', _('Export')),
        ('import', _('Import')),
        ('permission_denied', _('Permission Denied')),
        ('view', _('View')),
        ('search', _('Search')),
        ('other', _('Other')),
    ]
    
    # User who performed the action
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_('user'),
        help_text=_('User who performed this action')
    )
    
    # Action information
    action = models.CharField(
        _('action'),
        max_length=50,
        choices=ACTION_CHOICES,
        help_text=_('Type of action performed')
    )
    
    # Target object (generic foreign key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('content type')
    )
    
    object_id = models.PositiveIntegerField(
        _('object ID'),
        null=True,
        blank=True
    )
    
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Traditional table/record reference (backup)
    table_name = models.CharField(
        _('table name'),
        max_length=50,
        help_text=_('Database table name')
    )
    
    record_id = models.PositiveIntegerField(
        _('record ID'),
        null=True,
        blank=True,
        help_text=_('Primary key of the affected record')
    )
    
    # Change details (JSON format)
    old_values = models.JSONField(
        _('old values'),
        null=True,
        blank=True,
        help_text=_('Values before the change (JSON format)')
    )
    
    new_values = models.JSONField(
        _('new values'),
        null=True,
        blank=True,
        help_text=_('Values after the change (JSON format)')
    )
    
    # Additional context
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Human-readable description of the action')
    )
    
    # Request information
    ip_address = models.GenericIPAddressField(
        _('IP address'),
        null=True,
        blank=True,
        help_text=_('IP address from which the action was performed')
    )
    
    user_agent = models.TextField(
        _('user agent'),
        blank=True,
        help_text=_('Browser user agent string')
    )
    
    session_id = models.CharField(
        _('session ID'),
        max_length=255,
        null=True,
        blank=True,
        help_text=_('Session identifier')
    )
    
    # Request method and path
    request_method = models.CharField(
        _('request method'),
        max_length=10,
        blank=True,
        help_text=_('HTTP request method (GET, POST, etc.)')
    )
    
    request_path = models.CharField(
        _('request path'),
        max_length=500,
        blank=True,
        help_text=_('Request URL path')
    )
    
    # Response information
    response_status = models.PositiveIntegerField(
        _('response status'),
        null=True,
        blank=True,
        help_text=_('HTTP response status code')
    )
    
    # Timing
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        db_index=True
    )
    
    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['table_name']),
            models.Index(fields=['created_at']),
            models.Index(fields=['table_name', 'record_id']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['content_type']),
        ]
    
    def __str__(self):
        user_name = self.user.get_display_name() if self.user else 'Anonymous'
        return f"{user_name} - {self.get_action_display()} - {self.table_name}"
    
    @property
    def user_display_name(self):
        """Get display name for the user."""
        return self.user.get_display_name() if self.user else 'Anonymous'
    
    @property
    def formatted_changes(self):
        """Get formatted description of changes."""
        if not self.old_values and not self.new_values:
            return self.description or f"{self.get_action_display()} action"
        
        changes = []
        
        if self.action == 'create' and self.new_values:
            changes.append("Created with:")
            for field, value in self.new_values.items():
                changes.append(f"  {field}: {value}")
        
        elif self.action == 'update' and self.old_values and self.new_values:
            changes.append("Changed:")
            for field, new_value in self.new_values.items():
                old_value = self.old_values.get(field, 'N/A')
                if old_value != new_value:
                    changes.append(f"  {field}: {old_value} → {new_value}")
        
        elif self.action == 'delete' and self.old_values:
            changes.append("Deleted:")
            for field, value in self.old_values.items():
                changes.append(f"  {field}: {value}")
        
        return '\n'.join(changes) if changes else self.description or 'No details available'
    
    @property
    def is_security_relevant(self):
        """Check if this log entry is security-relevant."""
        security_actions = [
            'login_failed', 'permission_denied', 'password_change',
            'password_reset', 'delete'
        ]
        return self.action in security_actions
    
    @classmethod
    def log_action(cls, user, action, table_name, record_id=None, old_values=None, 
                   new_values=None, description=None, request=None, content_object=None):
        """
        Create an audit log entry.
        
        Args:
            user: User who performed the action
            action: Action type (from ACTION_CHOICES)
            table_name: Database table name
            record_id: Primary key of affected record
            old_values: Dict of old values
            new_values: Dict of new values
            description: Human-readable description
            request: Django request object for context
            content_object: Django model instance
            
        Returns:
            AuditLog: Created audit log instance
        """
        log_data = {
            'user': user,
            'action': action,
            'table_name': table_name,
            'record_id': record_id,
            'old_values': old_values,
            'new_values': new_values,
            'description': description,
        }
        
        # Add content object if provided
        if content_object:
            log_data['content_object'] = content_object
        
        # Extract request information if available
        if request:
            log_data.update({
                'ip_address': cls._get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'session_id': request.session.session_key if hasattr(request, 'session') and request.session.session_key else None,
                'request_method': request.method,
                'request_path': request.path,
            })
        
        return cls.objects.create(**log_data)
    
    @classmethod
    def log_login(cls, user, request=None, success=True):
        """Log user login attempt."""
        action = 'login' if success else 'login_failed'
        description = f"User {'successfully' if success else 'failed to'} log in"
        
        return cls.log_action(
            user=user,
            action=action,
            table_name='users',
            record_id=user.id if user else None,
            description=description,
            request=request
        )
    
    @classmethod
    def log_logout(cls, user, request=None):
        """Log user logout."""
        return cls.log_action(
            user=user,
            action='logout',
            table_name='users',
            record_id=user.id,
            description="User logged out",
            request=request
        )
    
    @classmethod
    def log_model_change(cls, user, instance, action, old_values=None, new_values=None, request=None):
        """
        Log changes to model instances.
        
        Args:
            user: User who made the change
            instance: Model instance that was changed
            action: Type of change ('create', 'update', 'delete')
            old_values: Previous values (for updates)
            new_values: New values (for creates/updates)
            request: Django request object
        """
        table_name = instance._meta.db_table
        record_id = instance.pk
        
        # Generate description
        model_name = instance._meta.verbose_name
        descriptions = {
            'create': f"Created {model_name}: {str(instance)}",
            'update': f"Updated {model_name}: {str(instance)}",
            'delete': f"Deleted {model_name}: {str(instance)}",
        }
        
        return cls.log_action(
            user=user,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            description=descriptions.get(action, f"{action.title()} {model_name}"),
            request=request,
            content_object=instance
        )
    
    @classmethod
    def log_file_action(cls, user, attachment, action, request=None):
        """Log file-related actions."""
        descriptions = {
            'file_upload': f"Uploaded file: {attachment.original_filename}",
            'file_download': f"Downloaded file: {attachment.original_filename}",
            'file_delete': f"Deleted file: {attachment.original_filename}",
        }
        
        return cls.log_action(
            user=user,
            action=action,
            table_name='attachments',
            record_id=attachment.id,
            description=descriptions.get(action, f"{action} file"),
            new_values={
                'filename': attachment.original_filename,
                'transaction_id': attachment.transaction.transaction_id,
                'file_size': attachment.file_size,
            },
            request=request,
            content_object=attachment
        )
    
    @classmethod
    def log_permission_denied(cls, user, resource, action, request=None):
        """Log permission denied events."""
        description = f"Permission denied: {user.get_display_name() if user else 'Anonymous'} tried to {action} {resource}"
        
        return cls.log_action(
            user=user,
            action='permission_denied',
            table_name='security',
            description=description,
            request=request
        )
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @classmethod
    def cleanup_old_logs(cls, days=365):
        """
        Clean up old audit logs (default: keep 1 year).
        
        Args:
            days: Number of days to keep logs
        """
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count = cls.objects.filter(created_at__lt=cutoff_date).delete()[0]
        
        return deleted_count
