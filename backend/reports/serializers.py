from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ReportTemplate, CustomReportBuilder, ScheduledReport, 
    ReportExecution, ReportShare
)

User = get_user_model()


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ReportTemplate model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'report_type', 'configuration',
            'filters', 'columns', 'format_types', 'is_active', 'is_public',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CustomReportBuilderSerializer(serializers.ModelSerializer):
    """Serializer for CustomReportBuilder model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    shared_with_names = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomReportBuilder
        fields = [
            'id', 'name', 'description', 'data_source', 'query_config',
            'visualization_config', 'filters', 'columns', 'aggregations',
            'sorting', 'grouping', 'format_settings', 'created_by',
            'created_by_name', 'shared_with', 'shared_with_names', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_shared_with_names(self, obj):
        return [user.get_full_name() for user in obj.shared_with.all()]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        shared_with = validated_data.pop('shared_with', [])
        instance = super().create(validated_data)
        instance.shared_with.set(shared_with)
        return instance
    
    def update(self, instance, validated_data):
        shared_with = validated_data.pop('shared_with', None)
        instance = super().update(instance, validated_data)
        if shared_with is not None:
            instance.shared_with.set(shared_with)
        return instance


class ScheduledReportSerializer(serializers.ModelSerializer):
    """Serializer for ScheduledReport model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    report_template_name = serializers.CharField(source='report_template.name', read_only=True)
    custom_report_name = serializers.CharField(source='custom_report.name', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = [
            'id', 'name', 'description', 'report_template', 'report_template_name',
            'custom_report', 'custom_report_name', 'report_type', 'schedule_type',
            'schedule_config', 'next_run', 'last_run', 'recipients', 'format_type',
            'filters', 'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'last_run', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        if data['report_type'] == 'template' and not data.get('report_template'):
            raise serializers.ValidationError("report_template is required for template-based reports")
        if data['report_type'] == 'custom' and not data.get('custom_report'):
            raise serializers.ValidationError("custom_report is required for custom reports")
        return data


class ReportExecutionSerializer(serializers.ModelSerializer):
    """Serializer for ReportExecution model"""
    executed_by_name = serializers.CharField(source='executed_by.get_full_name', read_only=True)
    scheduled_report_name = serializers.CharField(source='scheduled_report.name', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportExecution
        fields = [
            'id', 'scheduled_report', 'scheduled_report_name', 'report_name',
            'report_type', 'status', 'started_at', 'completed_at', 'file_path',
            'file_size', 'format_type', 'record_count', 'error_message',
            'execution_time_seconds', 'duration_formatted', 'filters_applied',
            'executed_by', 'executed_by_name', 'created_at'
        ]
        read_only_fields = ['executed_by', 'created_at']
    
    def get_duration_formatted(self, obj):
        if obj.execution_time_seconds:
            if obj.execution_time_seconds < 60:
                return f"{obj.execution_time_seconds:.1f} seconds"
            elif obj.execution_time_seconds < 3600:
                minutes = obj.execution_time_seconds / 60
                return f"{minutes:.1f} minutes"
            else:
                hours = obj.execution_time_seconds / 3600
                return f"{hours:.1f} hours"
        return "N/A"


class ReportShareSerializer(serializers.ModelSerializer):
    """Serializer for ReportShare model"""
    shared_by_name = serializers.CharField(source='shared_by.get_full_name', read_only=True)
    shared_with_name = serializers.CharField(source='shared_with.get_full_name', read_only=True)
    report_name = serializers.CharField(source='report_execution.report_name', read_only=True)
    
    class Meta:
        model = ReportShare
        fields = [
            'id', 'report_execution', 'report_name', 'shared_by',
            'shared_by_name', 'shared_with', 'shared_with_name',
            'share_message', 'is_viewed', 'viewed_at', 'expires_at', 'created_at'
        ]
        read_only_fields = ['shared_by', 'created_at', 'viewed_at']
    
    def create(self, validated_data):
        validated_data['shared_by'] = self.context['request'].user
        return super().create(validated_data)


# Additional serializers for API responses
class ReportBuilderConfigSerializer(serializers.Serializer):
    """Serializer for report builder configuration"""
    data_source = serializers.ChoiceField(choices=[
        ('transactions', 'Transactions'),
        ('users', 'Users'),
        ('audit_logs', 'Audit Logs'),
        ('workflows', 'Workflows'),
        ('attachments', 'Attachments'),
    ])
    columns = serializers.ListField(child=serializers.CharField(), required=False)
    filters = serializers.DictField(required=False)
    aggregations = serializers.ListField(child=serializers.DictField(), required=False)
    sorting = serializers.ListField(child=serializers.DictField(), required=False)
    grouping = serializers.ListField(child=serializers.CharField(), required=False)
    format_type = serializers.ChoiceField(choices=[('pdf', 'PDF'), ('excel', 'Excel')], default='pdf')


class QuickReportSerializer(serializers.Serializer):
    """Serializer for quick report generation"""
    report_type = serializers.ChoiceField(choices=[
        ('transaction', 'Transaction Report'),
        ('analytics', 'Analytics Report'),
        ('user', 'User Report'),
        ('audit', 'Audit Log Report'),
    ])
    format_type = serializers.ChoiceField(choices=[('pdf', 'PDF'), ('excel', 'Excel')], default='pdf')
    filters = serializers.DictField(required=False)
    date_range = serializers.DictField(required=False)
    columns = serializers.ListField(child=serializers.CharField(), required=False)