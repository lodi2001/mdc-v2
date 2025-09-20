"""
Serializers for System Settings API
"""

from rest_framework import serializers
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .models import SystemSetting, SystemMaintenanceMode, SystemConfiguration, SystemLog
from users.serializers import UserListSerializer


class SystemSettingSerializer(serializers.ModelSerializer):
    """
    Serializer for system settings
    """
    setting_type_display = serializers.CharField(source='get_setting_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    typed_value = serializers.SerializerMethodField(read_only=True)
    updated_by = UserListSerializer(read_only=True)
    
    class Meta:
        model = SystemSetting
        fields = [
            'id', 'key', 'name', 'description', 'category', 'category_display',
            'setting_type', 'setting_type_display', 'value', 'typed_value',
            'default_value', 'is_required', 'is_editable', 'is_sensitive',
            'validation_rules', 'help_text', 'created_at', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_typed_value(self, obj):
        """Get the properly typed value"""
        try:
            return obj.get_typed_value()
        except (ValueError, TypeError):
            return None
    
    def to_representation(self, instance):
        """Custom representation to hide sensitive values"""
        data = super().to_representation(instance)
        
        if instance.is_sensitive:
            # Mask sensitive values
            data['value'] = '*' * 8
            data['typed_value'] = '*' * 8
        
        return data


class SystemSettingListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for system settings list
    """
    setting_type_display = serializers.CharField(source='get_setting_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_display_name', read_only=True)
    
    class Meta:
        model = SystemSetting
        fields = [
            'id', 'key', 'name', 'category', 'category_display',
            'setting_type', 'setting_type_display', 'is_required', 
            'is_editable', 'is_sensitive', 'updated_at', 'updated_by_name'
        ]
    
    def to_representation(self, instance):
        """Custom representation to hide sensitive settings"""
        data = super().to_representation(instance)
        
        if instance.is_sensitive:
            data['name'] = data['name'] + ' (Hidden)'
        
        return data


class SystemSettingUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating system settings
    """
    class Meta:
        model = SystemSetting
        fields = ['value']
    
    def validate_value(self, value):
        """Validate the setting value"""
        if self.instance:
            # Temporarily set the value to validate it
            original_value = self.instance.value
            self.instance.value = value
            
            try:
                self.instance.full_clean()
            except Exception as e:
                # Restore original value
                self.instance.value = original_value
                raise serializers.ValidationError(str(e))
            
            # Restore original value
            self.instance.value = original_value
        
        return value


class BulkSystemSettingUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk system settings updates
    """
    settings = serializers.DictField(
        child=serializers.CharField()
    )
    
    def validate_settings(self, value):
        """Validate all settings"""
        if not value:
            raise serializers.ValidationError("Settings dictionary cannot be empty")
        errors = {}
        
        for key, setting_value in value.items():
            try:
                setting = SystemSetting.objects.get(key=key, is_editable=True)
                
                # Validate the value
                original_value = setting.value
                setting.value = setting_value
                setting.full_clean()
                setting.value = original_value
                
            except SystemSetting.DoesNotExist:
                errors[key] = 'Setting not found or not editable'
            except Exception as e:
                errors[key] = str(e)
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return value


class SystemMaintenanceModeSerializer(serializers.ModelSerializer):
    """
    Serializer for system maintenance mode
    """
    created_by = UserListSerializer(read_only=True)
    updated_by = UserListSerializer(read_only=True)
    allowed_users_details = UserListSerializer(source='allowed_users', many=True, read_only=True)
    
    class Meta:
        model = SystemMaintenanceMode
        fields = [
            'id', 'is_enabled', 'message', 'message_ar', 'allowed_ips',
            'allowed_users', 'allowed_users_details', 'scheduled_start',
            'scheduled_end', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']


class SystemMaintenanceModeUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating maintenance mode
    """
    class Meta:
        model = SystemMaintenanceMode
        fields = [
            'is_enabled', 'message', 'message_ar', 'allowed_ips',
            'allowed_users', 'scheduled_start', 'scheduled_end'
        ]


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer for system configurations
    """
    environment_display = serializers.CharField(source='get_environment_display', read_only=True)
    created_by = UserListSerializer(read_only=True)
    
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'name', 'environment', 'environment_display', 'description',
            'configuration', 'is_active', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class SystemConfigurationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for system configurations list
    """
    environment_display = serializers.CharField(source='get_environment_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_display_name', read_only=True)
    configuration_keys = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'name', 'environment', 'environment_display', 'description',
            'configuration_keys', 'is_active', 'created_at', 'updated_at', 'created_by_name'
        ]
    
    def get_configuration_keys(self, obj):
        """Get the keys from configuration JSON"""
        if obj.configuration:
            return list(obj.configuration.keys())[:10]  # Limit to first 10 keys
        return []


class SystemLogSerializer(serializers.ModelSerializer):
    """
    Serializer for system logs
    """
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'level', 'level_display', 'category', 'category_display',
            'message', 'details', 'user', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SystemLogListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for system logs list
    """
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    user_name = serializers.CharField(source='user.get_display_name', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'level', 'level_display', 'category', 'category_display',
            'message', 'user_name', 'ip_address', 'created_at'
        ]


class SystemHealthSerializer(serializers.Serializer):
    """
    Serializer for system health status
    """
    overall_status = serializers.CharField()  # healthy, warning, error
    uptime = serializers.FloatField()
    
    # Database
    database_status = serializers.CharField()
    database_response_time = serializers.FloatField()
    
    # Cache
    cache_status = serializers.CharField()
    cache_hit_rate = serializers.FloatField()
    
    # Storage
    storage_status = serializers.CharField()
    storage_usage = serializers.DictField()
    
    # Email service
    email_service_status = serializers.CharField()
    last_email_sent = serializers.DateTimeField(allow_null=True)
    
    # System resources
    memory_usage = serializers.DictField()
    cpu_usage = serializers.FloatField()
    disk_usage = serializers.DictField()
    
    # Active connections
    active_connections = serializers.IntegerField()
    active_users = serializers.IntegerField()
    
    # Error rates
    error_rate = serializers.FloatField()
    avg_response_time = serializers.FloatField()
    
    # Recent errors
    recent_errors = serializers.ListField()
    
    # Alerts
    alerts = serializers.ListField()
    warnings = serializers.ListField()
    
    # Last check
    last_updated = serializers.DateTimeField()


class SystemStatusSerializer(serializers.Serializer):
    """
    Serializer for system status overview
    """
    is_maintenance_active = serializers.BooleanField()
    maintenance_message = serializers.CharField()
    
    # System info
    version = serializers.CharField()
    environment = serializers.CharField()
    debug_mode = serializers.BooleanField()
    
    # Features status
    features_enabled = serializers.DictField()
    
    # Database status
    database_accessible = serializers.BooleanField()
    database_version = serializers.CharField()
    
    # Cache status
    cache_accessible = serializers.BooleanField()
    cache_type = serializers.CharField()
    
    # Storage status
    media_storage = serializers.DictField()
    static_storage = serializers.DictField()
    
    # External services
    email_service = serializers.DictField()
    
    # Current load
    current_load = serializers.DictField()


class SystemBackupSerializer(serializers.Serializer):
    """
    Serializer for system backup operations
    """
    backup_type = serializers.ChoiceField(
        choices=[
            ('full', 'Full Backup'),
            ('incremental', 'Incremental Backup'),
            ('settings', 'Settings Only'),
            ('database', 'Database Only'),
        ],
        default='full'
    )
    include_media = serializers.BooleanField(default=True)
    include_logs = serializers.BooleanField(default=False)
    compression = serializers.ChoiceField(
        choices=[('none', 'None'), ('zip', 'ZIP'), ('gzip', 'GZIP')],
        default='zip'
    )
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)


class SystemRestoreSerializer(serializers.Serializer):
    """
    Serializer for system restore operations
    """
    backup_file = serializers.FileField()
    restore_settings = serializers.BooleanField(default=True)
    restore_database = serializers.BooleanField(default=True)
    restore_media = serializers.BooleanField(default=True)
    force_restore = serializers.BooleanField(default=False)
    
    def validate_backup_file(self, value):
        """Validate backup file"""
        if not value.name.endswith(('.zip', '.tar.gz', '.sql')):
            raise serializers.ValidationError(
                "Invalid backup file format. Supported formats: .zip, .tar.gz, .sql"
            )
        return value


class SettingsCategorySerializer(serializers.Serializer):
    """
    Serializer for settings organized by category
    """
    category = serializers.CharField()
    category_display = serializers.CharField()
    settings = SystemSettingListSerializer(many=True)
    editable_count = serializers.IntegerField()
    total_count = serializers.IntegerField()


class SystemInfoSerializer(serializers.Serializer):
    """
    Serializer for system information
    """
    # Application info
    app_name = serializers.CharField()
    app_version = serializers.CharField()
    environment = serializers.CharField()
    
    # Django info
    django_version = serializers.CharField()
    python_version = serializers.CharField()
    
    # Database info
    database_engine = serializers.CharField()
    database_name = serializers.CharField()
    
    # Cache info
    cache_backend = serializers.CharField()
    
    # Server info
    server_time = serializers.DateTimeField()
    timezone = serializers.CharField()
    
    # Statistics
    total_users = serializers.IntegerField()
    total_transactions = serializers.IntegerField()
    total_attachments = serializers.IntegerField()
    
    # Storage info
    storage_usage = serializers.DictField()
    
    # Last maintenance
    last_maintenance = serializers.DateTimeField(allow_null=True)


class SystemValidationSerializer(serializers.Serializer):
    """
    Serializer for system validation results
    """
    overall_status = serializers.CharField()  # valid, warning, error
    checks_performed = serializers.IntegerField()
    warnings_count = serializers.IntegerField()
    errors_count = serializers.IntegerField()
    
    # Validation results
    database_validation = serializers.DictField()
    settings_validation = serializers.DictField()
    permissions_validation = serializers.DictField()
    file_system_validation = serializers.DictField()
    dependencies_validation = serializers.DictField()
    
    # Detailed results
    validation_details = serializers.ListField()
    recommendations = serializers.ListField()
    
    # Validation timestamp
    validated_at = serializers.DateTimeField()