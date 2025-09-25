"""
Serializers for Audit API
"""

from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model"""

    user_display_name = serializers.CharField(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    formatted_changes = serializers.CharField(read_only=True)
    is_security_relevant = serializers.BooleanField(read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_display_name', 'action', 'action_display',
            'table_name', 'record_id', 'old_values', 'new_values',
            'description', 'ip_address', 'user_agent', 'session_id',
            'request_method', 'request_path', 'response_status',
            'created_at', 'formatted_changes', 'is_security_relevant',
            'content_type', 'object_id'
        ]
        read_only_fields = ['created_at']


class AuditLogDetailSerializer(AuditLogSerializer):
    """Detailed serializer with user information"""

    user = serializers.SerializerMethodField()

    class Meta(AuditLogSerializer.Meta):
        pass

    def get_user(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'email': obj.user.email,
                'full_name': obj.user.get_full_name() or obj.user.email,
                'role': getattr(obj.user, 'role', None)
            }
        return None


class AuditLogStatisticsSerializer(serializers.Serializer):
    """Serializer for audit log statistics"""

    total_events = serializers.IntegerField()
    active_users = serializers.IntegerField()
    security_alerts = serializers.IntegerField()
    system_health = serializers.CharField()
    recent_activities = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    activity_by_action = serializers.DictField(required=False)
    activity_by_user = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    activity_timeline = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )


class AuditLogFilterSerializer(serializers.Serializer):
    """Serializer for audit log filters"""

    action = serializers.MultipleChoiceField(
        choices=AuditLog.ACTION_CHOICES,
        required=False
    )
    user = serializers.IntegerField(required=False)
    table_name = serializers.CharField(required=False)
    ip_address = serializers.CharField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    search = serializers.CharField(required=False)
    is_security_relevant = serializers.BooleanField(required=False)