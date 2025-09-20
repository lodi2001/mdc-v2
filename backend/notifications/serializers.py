"""
Serializers for Notifications API
"""

from rest_framework import serializers
from django.conf import settings
from .models import EmailTemplate, EmailNotification, NotificationPreference, Notification
from users.serializers import UserListSerializer


class EmailTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for email templates
    """
    created_by = UserListSerializer(read_only=True)
    updated_by = UserListSerializer(read_only=True)
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'subject', 'body_html', 'body_text',
            'variables', 'language', 'language_display', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']
    
    def validate_name(self, value):
        """
        Validate template name uniqueness for the language
        """
        if self.instance:
            # Update case
            if EmailTemplate.objects.filter(
                name=value,
                language=self.initial_data.get('language', self.instance.language)
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "Template with this name already exists for this language"
                )
        else:
            # Create case
            language = self.initial_data.get('language', 'en')
            if EmailTemplate.objects.filter(name=value, language=language).exists():
                raise serializers.ValidationError(
                    "Template with this name already exists for this language"
                )
        return value
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class EmailTemplateListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for email template lists
    """
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_display_name', read_only=True)
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'subject', 'language', 'language_display',
            'is_active', 'created_at', 'updated_at', 'created_by_name'
        ]


class EmailNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for email notifications
    """
    user = UserListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_retry = serializers.BooleanField(read_only=True)
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    
    class Meta:
        model = EmailNotification
        fields = [
            'id', 'user', 'template_name', 'recipient_email', 'subject',
            'body_html', 'body_text', 'status', 'status_display',
            'error_message', 'sent_at', 'created_at', 'transaction',
            'transaction_id', 'variables', 'retry_count', 'max_retries',
            'next_retry_at', 'can_retry'
        ]
        read_only_fields = [
            'id', 'sent_at', 'created_at', 'retry_count', 'next_retry_at'
        ]


class EmailNotificationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for email notification lists
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.CharField(source='user.get_display_name', read_only=True)
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    
    class Meta:
        model = EmailNotification
        fields = [
            'id', 'template_name', 'recipient_email', 'subject',
            'status', 'status_display', 'sent_at', 'created_at',
            'user_name', 'transaction_id', 'retry_count', 'error_message'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for notification preferences
    """
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'notification_type', 'notification_type_display',
            'email_enabled', 'in_app_enabled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationPreferenceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating notification preferences
    """
    class Meta:
        model = NotificationPreference
        fields = ['notification_type', 'email_enabled', 'in_app_enabled']
    
    def validate_notification_type(self, value):
        """
        Validate notification type is valid
        """
        valid_types = [choice[0] for choice in NotificationPreference.NOTIFICATION_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError("Invalid notification type")
        return value


class BulkNotificationPreferenceSerializer(serializers.Serializer):
    """
    Serializer for bulk notification preference updates
    """
    preferences = serializers.ListField(
        child=NotificationPreferenceUpdateSerializer(),
        min_length=1
    )
    
    def validate_preferences(self, value):
        """
        Validate no duplicate notification types
        """
        notification_types = [pref['notification_type'] for pref in value]
        if len(notification_types) != len(set(notification_types)):
            raise serializers.ValidationError("Duplicate notification types not allowed")
        return value


class EmailTemplateTestSerializer(serializers.Serializer):
    """
    Serializer for testing email templates
    """
    recipient_email = serializers.EmailField()
    test_variables = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )


class EmailTemplatePreviewSerializer(serializers.Serializer):
    """
    Serializer for email template preview
    """
    variables = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )


class EmailTemplateImportSerializer(serializers.Serializer):
    """
    Serializer for importing email templates
    """
    templates = serializers.ListField(
        child=EmailTemplateSerializer()
    )
    overwrite_existing = serializers.BooleanField(default=False)
    
    def validate_templates(self, value):
        """
        Validate template data
        """
        if not value:
            raise serializers.ValidationError("At least one template is required")
        
        # Check for duplicate names within the import
        names = []
        for template in value:
            name_lang = f"{template.get('name')}_{template.get('language', 'en')}"
            if name_lang in names:
                raise serializers.ValidationError(
                    f"Duplicate template name '{template['name']}' for language '{template.get('language', 'en')}'"
                )
            names.append(name_lang)
        
        return value


class NotificationStatisticsSerializer(serializers.Serializer):
    """
    Serializer for notification statistics
    """
    total_notifications = serializers.IntegerField()
    notifications_by_status = serializers.DictField()
    notifications_by_template = serializers.DictField()
    delivery_success_rate = serializers.FloatField()
    avg_delivery_time = serializers.FloatField()
    failed_notifications = serializers.IntegerField()
    retry_notifications = serializers.IntegerField()
    recent_activity = serializers.ListField()
    top_templates = serializers.ListField()
    error_analysis = serializers.DictField()


class NotificationSendSerializer(serializers.Serializer):
    """
    Serializer for sending notifications
    """
    template_name = serializers.CharField(max_length=100)
    recipient_email = serializers.EmailField()
    variables = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )
    language = serializers.ChoiceField(
        choices=settings.LANGUAGES,
        default='en',
        required=False
    )
    user_id = serializers.IntegerField(required=False, allow_null=True)
    transaction_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_template_name(self, value):
        """
        Validate template exists
        """
        language = self.initial_data.get('language', 'en')
        template = EmailTemplate.get_template(value, language)
        if not template:
            raise serializers.ValidationError(
                f"Email template '{value}' not found for language '{language}'"
            )
        return value
    
    def validate_user_id(self, value):
        """
        Validate user exists if provided
        """
        if value is not None:
            from users.models import User
            try:
                User.objects.get(id=value)
            except User.DoesNotExist:
                raise serializers.ValidationError("User not found")
        return value
    
    def validate_transaction_id(self, value):
        """
        Validate transaction exists if provided
        """
        if value is not None:
            from transactions.models import Transaction
            try:
                Transaction.objects.get(id=value)
            except Transaction.DoesNotExist:
                raise serializers.ValidationError("Transaction not found")
        return value


class BulkNotificationSendSerializer(serializers.Serializer):
    """
    Serializer for bulk notification sending
    """
    template_name = serializers.CharField(max_length=100)
    recipient_emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
        max_length=100
    )
    variables = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )
    language = serializers.ChoiceField(
        choices=settings.LANGUAGES,
        default='en',
        required=False
    )
    
    def validate_template_name(self, value):
        """
        Validate template exists
        """
        language = self.initial_data.get('language', 'en')
        template = EmailTemplate.get_template(value, language)
        if not template:
            raise serializers.ValidationError(
                f"Email template '{value}' not found for language '{language}'"
            )
        return value


class NotificationHealthSerializer(serializers.Serializer):
    """
    Serializer for notification system health
    """
    status = serializers.CharField()  # healthy, warning, error
    pending_notifications = serializers.IntegerField()
    failed_notifications = serializers.IntegerField()
    retry_queue_length = serializers.IntegerField()
    last_successful_send = serializers.DateTimeField(allow_null=True)
    error_rate = serializers.FloatField()
    template_count = serializers.IntegerField()
    active_template_count = serializers.IntegerField()
    health_checks = serializers.DictField()
    alerts = serializers.ListField()


class NotificationQueueSerializer(serializers.Serializer):
    """
    Serializer for notification queue status
    """
    pending_count = serializers.IntegerField()
    retry_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    oldest_pending = serializers.DateTimeField(allow_null=True)
    queue_items = serializers.ListField()
    processing_rate = serializers.FloatField()
    avg_processing_time = serializers.FloatField()


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for in-app notifications
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'type_display',
            'category', 'category_display', 'is_read', 'read_at',
            'created_at', 'time_ago', 'transaction', 'action_link', 'metadata'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time difference"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            minutes = diff.seconds // 60
            return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        elif diff < timedelta(days=1):
            hours = diff.seconds // 3600
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            return obj.created_at.strftime('%b %d, %Y')


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Light serializer for notification lists
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'type_display',
            'category', 'category_display', 'is_read', 'created_at', 
            'time_ago', 'action_link'
        ]
    
    def get_time_ago(self, obj):
        """Get human-readable time difference"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            minutes = diff.seconds // 60
            return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        elif diff < timedelta(days=1):
            hours = diff.seconds // 3600
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            return obj.created_at.strftime('%b %d, %Y')


class NotificationMarkReadSerializer(serializers.Serializer):
    """
    Serializer for marking notifications as read
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='List of notification IDs to mark as read. If not provided, marks all as read.'
    )


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating notifications
    """
    class Meta:
        model = Notification
        fields = [
            'user', 'title', 'message', 'type', 'category',
            'transaction', 'action_link', 'metadata'
        ]
    
    def create(self, validated_data):
        """Create notification with defaults"""
        return Notification.create_for_user(**validated_data)