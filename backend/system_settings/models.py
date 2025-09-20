"""
System Settings models for the MDC Transaction Tracking System.

This module contains models for managing system-wide configuration
and settings that control application behavior.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from users.models import User
import json


class SystemSetting(models.Model):
    """
    System configuration settings with type-safe value storage.
    
    Stores system-wide configuration values that control application
    behavior, with validation and type conversion support.
    """
    
    SETTING_TYPES = [
        ('string', _('String')),
        ('integer', _('Integer')),
        ('float', _('Float')),
        ('boolean', _('Boolean')),
        ('json', _('JSON')),
        ('email', _('Email')),
        ('url', _('URL')),
    ]
    
    CATEGORY_CHOICES = [
        ('general', _('General')),
        ('email', _('Email Settings')),
        ('file_upload', _('File Upload')),
        ('notifications', _('Notifications')),
        ('security', _('Security')),
        ('ui', _('User Interface')),
        ('workflow', _('Workflow')),
        ('integration', _('Integration')),
        ('maintenance', _('Maintenance')),
        ('performance', _('Performance')),
    ]
    
    key = models.CharField(
        _('setting key'),
        max_length=100,
        unique=True,
        help_text=_('Unique identifier for the setting')
    )
    
    name = models.CharField(
        _('display name'),
        max_length=200,
        help_text=_('Human-readable name for the setting')
    )
    
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Detailed description of what this setting controls')
    )
    
    category = models.CharField(
        _('category'),
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='general',
        help_text=_('Setting category for organization')
    )
    
    setting_type = models.CharField(
        _('type'),
        max_length=20,
        choices=SETTING_TYPES,
        default='string',
        help_text=_('Data type of the setting value')
    )
    
    value = models.TextField(
        _('value'),
        help_text=_('Setting value (stored as text, converted based on type)')
    )
    
    default_value = models.TextField(
        _('default value'),
        blank=True,
        help_text=_('Default value for this setting')
    )
    
    is_required = models.BooleanField(
        _('is required'),
        default=False,
        help_text=_('Whether this setting must have a value')
    )
    
    is_editable = models.BooleanField(
        _('is editable'),
        default=True,
        help_text=_('Whether this setting can be modified through the UI')
    )
    
    is_sensitive = models.BooleanField(
        _('is sensitive'),
        default=False,
        help_text=_('Whether this setting contains sensitive information')
    )
    
    validation_rules = models.JSONField(
        _('validation rules'),
        default=dict,
        blank=True,
        help_text=_('JSON object containing validation rules for the value')
    )
    
    help_text = models.TextField(
        _('help text'),
        blank=True,
        help_text=_('Help text displayed to users when editing this setting')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_settings',
        verbose_name=_('updated by')
    )
    
    class Meta:
        verbose_name = _('System Setting')
        verbose_name_plural = _('System Settings')
        db_table = 'system_settings'
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
            models.Index(fields=['is_editable']),
        ]
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.name} ({self.key})"
    
    def clean(self):
        """Validate setting value based on type and rules"""
        super().clean()
        
        if self.is_required and not self.value:
            raise ValidationError(_('This setting is required and cannot be empty'))
        
        try:
            self.get_typed_value()
        except (ValueError, TypeError) as e:
            raise ValidationError(
                _('Invalid value for type %(type)s: %(error)s') % {
                    'type': self.get_setting_type_display(),
                    'error': str(e)
                }
            )
        
        # Apply custom validation rules
        if self.validation_rules:
            self._apply_validation_rules()
    
    def _apply_validation_rules(self):
        """Apply custom validation rules"""
        rules = self.validation_rules
        typed_value = self.get_typed_value()
        
        # String/text validation
        if self.setting_type in ['string', 'email', 'url']:
            if 'min_length' in rules and len(self.value) < rules['min_length']:
                raise ValidationError(
                    _('Value must be at least %(min_length)d characters long') % rules
                )
            if 'max_length' in rules and len(self.value) > rules['max_length']:
                raise ValidationError(
                    _('Value cannot exceed %(max_length)d characters') % rules
                )
        
        # Numeric validation
        if self.setting_type in ['integer', 'float']:
            if 'min_value' in rules and typed_value < rules['min_value']:
                raise ValidationError(
                    _('Value must be at least %(min_value)s') % rules
                )
            if 'max_value' in rules and typed_value > rules['max_value']:
                raise ValidationError(
                    _('Value cannot exceed %(max_value)s') % rules
                )
        
        # Custom validation patterns
        if 'regex' in rules:
            import re
            if not re.match(rules['regex'], str(typed_value)):
                raise ValidationError(
                    _('Value does not match required pattern')
                )
    
    def get_typed_value(self):
        """Convert stored string value to appropriate Python type"""
        if not self.value:
            if self.default_value:
                value = self.default_value
            else:
                return None
        else:
            value = self.value
        
        try:
            if self.setting_type == 'integer':
                return int(value)
            elif self.setting_type == 'float':
                return float(value)
            elif self.setting_type == 'boolean':
                return str(value).lower() in ('true', '1', 'yes', 'on')
            elif self.setting_type == 'json':
                return json.loads(value)
            else:  # string, email, url
                return str(value)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            raise ValueError(f"Cannot convert '{value}' to {self.setting_type}: {e}")
    
    def set_typed_value(self, value):
        """Set value from Python type, converting to string for storage"""
        if self.setting_type == 'json':
            self.value = json.dumps(value, ensure_ascii=False)
        elif self.setting_type == 'boolean':
            self.value = 'true' if value else 'false'
        else:
            self.value = str(value)
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key with optional default"""
        try:
            setting = cls.objects.get(key=key)
            return setting.get_typed_value()
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, user=None):
        """Set a setting value by key"""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={'value': str(value), 'updated_by': user}
        )
        
        if not created:
            setting.set_typed_value(value)
            setting.updated_by = user
            setting.save()
        
        return setting
    
    @classmethod
    def get_category_settings(cls, category):
        """Get all settings for a specific category"""
        settings = cls.objects.filter(category=category)
        return {setting.key: setting.get_typed_value() for setting in settings}


class SystemMaintenanceMode(models.Model):
    """
    System maintenance mode control.
    
    Allows administrators to put the system into maintenance mode
    with custom messages and scheduled maintenance windows.
    """
    
    is_enabled = models.BooleanField(
        _('maintenance mode enabled'),
        default=False,
        help_text=_('Whether the system is currently in maintenance mode')
    )
    
    message = models.TextField(
        _('maintenance message'),
        default='System is currently under maintenance. Please try again later.',
        help_text=_('Message displayed to users during maintenance')
    )
    
    message_ar = models.TextField(
        _('maintenance message (Arabic)'),
        blank=True,
        help_text=_('Arabic translation of the maintenance message')
    )
    
    allowed_ips = models.JSONField(
        _('allowed IP addresses'),
        default=list,
        blank=True,
        help_text=_('List of IP addresses that can access the system during maintenance')
    )
    
    allowed_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='maintenance_access',
        verbose_name=_('allowed users'),
        help_text=_('Users who can access the system during maintenance')
    )
    
    scheduled_start = models.DateTimeField(
        _('scheduled start'),
        null=True,
        blank=True,
        help_text=_('Scheduled start time for maintenance (optional)')
    )
    
    scheduled_end = models.DateTimeField(
        _('scheduled end'),
        null=True,
        blank=True,
        help_text=_('Scheduled end time for maintenance (optional)')
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
        related_name='created_maintenance_modes',
        verbose_name=_('created by')
    )
    
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_maintenance_modes',
        verbose_name=_('updated by')
    )
    
    class Meta:
        verbose_name = _('System Maintenance Mode')
        verbose_name_plural = _('System Maintenance Modes')
        db_table = 'system_maintenance_mode'
        ordering = ['-created_at']
    
    def __str__(self):
        status = 'Enabled' if self.is_enabled else 'Disabled'
        return f"Maintenance Mode - {status}"
    
    def clean(self):
        """Validate maintenance schedule"""
        if self.scheduled_start and self.scheduled_end:
            if self.scheduled_start >= self.scheduled_end:
                raise ValidationError(
                    _('Scheduled end time must be after start time')
                )
    
    @classmethod
    def is_maintenance_active(cls):
        """Check if maintenance mode is currently active"""
        try:
            maintenance = cls.objects.latest('updated_at')
            return maintenance.is_enabled
        except cls.DoesNotExist:
            return False
    
    @classmethod
    def get_maintenance_message(cls, language='en'):
        """Get the current maintenance message"""
        try:
            maintenance = cls.objects.latest('updated_at')
            if language == 'ar' and maintenance.message_ar:
                return maintenance.message_ar
            return maintenance.message
        except cls.DoesNotExist:
            return 'System is currently under maintenance.'
    
    @classmethod
    def can_access_during_maintenance(cls, user=None, ip_address=None):
        """Check if user/IP can access system during maintenance"""
        if not cls.is_maintenance_active():
            return True
        
        try:
            maintenance = cls.objects.latest('updated_at')
            
            # Check allowed users
            if user and user.is_authenticated:
                if maintenance.allowed_users.filter(id=user.id).exists():
                    return True
                # Always allow superusers
                if user.is_superuser:
                    return True
            
            # Check allowed IPs
            if ip_address and ip_address in maintenance.allowed_ips:
                return True
                
            return False
            
        except cls.DoesNotExist:
            return True


class SystemConfiguration(models.Model):
    """
    System configuration profiles for different environments.
    
    Stores configuration templates that can be applied to 
    different deployment environments (dev, staging, production).
    """
    
    ENVIRONMENT_CHOICES = [
        ('development', _('Development')),
        ('staging', _('Staging')),
        ('production', _('Production')),
        ('testing', _('Testing')),
    ]
    
    name = models.CharField(
        _('configuration name'),
        max_length=100,
        help_text=_('Name of this configuration profile')
    )
    
    environment = models.CharField(
        _('environment'),
        max_length=20,
        choices=ENVIRONMENT_CHOICES,
        default='development',
        help_text=_('Target environment for this configuration')
    )
    
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Description of this configuration profile')
    )
    
    configuration = models.JSONField(
        _('configuration data'),
        default=dict,
        help_text=_('Configuration settings as JSON')
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=False,
        help_text=_('Whether this configuration is currently active')
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
        related_name='created_configurations',
        verbose_name=_('created by')
    )
    
    class Meta:
        verbose_name = _('System Configuration')
        verbose_name_plural = _('System Configurations')
        db_table = 'system_configurations'
        unique_together = [['name', 'environment']]
        indexes = [
            models.Index(fields=['environment', 'is_active']),
        ]
        ordering = ['environment', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_environment_display()})"
    
    def activate(self):
        """Activate this configuration (deactivates others in same environment)"""
        # Deactivate other configurations in the same environment
        SystemConfiguration.objects.filter(
            environment=self.environment, is_active=True
        ).update(is_active=False)
        
        # Activate this configuration
        self.is_active = True
        self.save()
    
    @classmethod
    def get_active_configuration(cls, environment):
        """Get the active configuration for an environment"""
        try:
            return cls.objects.get(environment=environment, is_active=True)
        except cls.DoesNotExist:
            return None


class SystemLog(models.Model):
    """
    System-level logging for important events and changes.
    
    Tracks system configuration changes, maintenance events,
    and other administrative actions.
    """
    
    LOG_LEVELS = [
        ('debug', _('Debug')),
        ('info', _('Info')),
        ('warning', _('Warning')),
        ('error', _('Error')),
        ('critical', _('Critical')),
    ]
    
    CATEGORY_CHOICES = [
        ('system', _('System')),
        ('security', _('Security')),
        ('configuration', _('Configuration')),
        ('maintenance', _('Maintenance')),
        ('performance', _('Performance')),
        ('integration', _('Integration')),
    ]
    
    level = models.CharField(
        _('log level'),
        max_length=20,
        choices=LOG_LEVELS,
        default='info',
        help_text=_('Severity level of the log entry')
    )
    
    category = models.CharField(
        _('category'),
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='system',
        help_text=_('Category of the log entry')
    )
    
    message = models.TextField(
        _('message'),
        help_text=_('Log message')
    )
    
    details = models.JSONField(
        _('details'),
        default=dict,
        blank=True,
        help_text=_('Additional details as JSON')
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs',
        verbose_name=_('user'),
        help_text=_('User who triggered this log entry (if applicable)')
    )
    
    ip_address = models.GenericIPAddressField(
        _('IP address'),
        null=True,
        blank=True,
        help_text=_('IP address associated with this log entry')
    )
    
    user_agent = models.TextField(
        _('user agent'),
        blank=True,
        help_text=_('User agent string (if applicable)')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    class Meta:
        verbose_name = _('System Log')
        verbose_name_plural = _('System Logs')
        db_table = 'system_logs'
        indexes = [
            models.Index(fields=['level', 'created_at']),
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['-created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_level_display()} - {self.category}: {self.message[:50]}"
    
    @classmethod
    def log(cls, level, category, message, details=None, user=None, 
            ip_address=None, user_agent=None):
        """Create a system log entry"""
        return cls.objects.create(
            level=level,
            category=category,
            message=message,
            details=details or {},
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
