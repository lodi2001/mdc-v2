"""
Serializers for Dashboard API
"""

from rest_framework import serializers
from datetime import datetime, timedelta
from django.utils import timezone


class DashboardStatsSerializer(serializers.Serializer):
    """
    Base dashboard statistics serializer
    """
    total_transactions = serializers.IntegerField()
    active_transactions = serializers.IntegerField()
    completed_transactions = serializers.IntegerField()
    overdue_transactions = serializers.IntegerField()
    pending_assignments = serializers.IntegerField()
    recent_activity_count = serializers.IntegerField()


class AdminDashboardSerializer(DashboardStatsSerializer):
    """
    Admin dashboard with comprehensive statistics
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    pending_users = serializers.IntegerField()
    total_attachments = serializers.IntegerField()
    storage_usage = serializers.DictField()
    
    # Transaction statistics by status
    transactions_by_status = serializers.DictField()
    transactions_by_priority = serializers.DictField()
    transactions_by_category = serializers.DictField()
    
    # Performance metrics
    avg_completion_time = serializers.FloatField()
    completion_rate = serializers.FloatField()
    
    # Time series data
    transactions_created_trend = serializers.ListField()
    transactions_completed_trend = serializers.ListField()
    
    # Top statistics
    top_clients = serializers.ListField()
    top_editors = serializers.ListField()
    busiest_categories = serializers.ListField()
    
    # Recent activity
    recent_transactions = serializers.ListField()
    recent_users = serializers.ListField()
    recent_uploads = serializers.ListField()
    
    # System health
    system_alerts = serializers.ListField()
    performance_metrics = serializers.DictField()


class EditorDashboardSerializer(DashboardStatsSerializer):
    """
    Editor dashboard with role-specific statistics
    """
    my_assigned_transactions = serializers.IntegerField()
    my_completed_transactions = serializers.IntegerField()
    my_overdue_transactions = serializers.IntegerField()
    
    # My transaction statistics
    my_transactions_by_status = serializers.DictField()
    my_transactions_by_priority = serializers.DictField()
    my_avg_completion_time = serializers.FloatField()
    
    # Workload
    workload_distribution = serializers.DictField()
    upcoming_deadlines = serializers.ListField()
    
    # Performance
    monthly_performance = serializers.DictField()
    completion_trend = serializers.ListField()
    
    # Recent activity
    recent_assignments = serializers.ListField()
    recent_completions = serializers.ListField()
    recent_comments = serializers.ListField()


class ClientDashboardSerializer(DashboardStatsSerializer):
    """
    Client dashboard with client-specific statistics
    """
    my_total_transactions = serializers.IntegerField()
    my_active_transactions = serializers.IntegerField()
    my_completed_transactions = serializers.IntegerField()
    my_draft_transactions = serializers.IntegerField()
    
    # My transaction statistics
    my_transactions_by_status = serializers.DictField()
    my_transactions_by_category = serializers.DictField()
    
    # Timeline
    transaction_timeline = serializers.ListField()
    estimated_completions = serializers.ListField()
    
    # Files
    total_files_uploaded = serializers.IntegerField()
    files_pending_review = serializers.IntegerField()
    
    # Recent activity
    recent_updates = serializers.ListField()
    recent_comments = serializers.ListField()
    
    # Service statistics
    service_history = serializers.DictField()
    avg_processing_time = serializers.FloatField()


class RecentActivitySerializer(serializers.Serializer):
    """
    Recent activity items
    """
    id = serializers.IntegerField()
    type = serializers.CharField()  # transaction, user, attachment, comment
    title = serializers.CharField()
    description = serializers.CharField()
    user = serializers.DictField()
    timestamp = serializers.DateTimeField()
    metadata = serializers.DictField()


class PerformanceMetricsSerializer(serializers.Serializer):
    """
    System performance metrics
    """
    response_times = serializers.DictField()
    throughput = serializers.DictField()
    error_rates = serializers.DictField()
    resource_usage = serializers.DictField()
    database_performance = serializers.DictField()
    cache_performance = serializers.DictField()


class WorkloadAnalysisSerializer(serializers.Serializer):
    """
    Workload analysis for editors and admins
    """
    editor_workloads = serializers.ListField()
    transaction_distribution = serializers.DictField()
    capacity_analysis = serializers.DictField()
    bottlenecks = serializers.ListField()
    recommendations = serializers.ListField()


class TransactionTrendSerializer(serializers.Serializer):
    """
    Transaction trend analysis
    """
    period = serializers.CharField()
    created_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    avg_processing_time = serializers.FloatField()
    completion_rate = serializers.FloatField()


class UserActivityAnalysisSerializer(serializers.Serializer):
    """
    User activity analysis
    """
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    
    # Activity metrics
    transactions_created = serializers.IntegerField()
    transactions_completed = serializers.IntegerField()
    comments_made = serializers.IntegerField()
    files_uploaded = serializers.IntegerField()
    
    # Performance metrics
    avg_completion_time = serializers.FloatField()
    completion_rate = serializers.FloatField()
    productivity_score = serializers.FloatField()
    
    # Time data
    last_activity = serializers.DateTimeField()
    active_days = serializers.IntegerField()


class SystemHealthSerializer(serializers.Serializer):
    """
    System health indicators
    """
    overall_status = serializers.CharField()  # healthy, warning, critical
    uptime = serializers.FloatField()
    
    # Component status
    database_status = serializers.CharField()
    cache_status = serializers.CharField()
    storage_status = serializers.CharField()
    email_service_status = serializers.CharField()
    
    # Resource usage
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    
    # Performance indicators
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    active_connections = serializers.IntegerField()
    
    # Alerts and warnings
    active_alerts = serializers.ListField()
    warnings = serializers.ListField()
    
    # Last check timestamp
    last_updated = serializers.DateTimeField()


class BusinessIntelligenceSerializer(serializers.Serializer):
    """
    Business intelligence and analytics
    """
    # Revenue/Transaction volume trends
    monthly_transaction_volume = serializers.ListField()
    revenue_trends = serializers.ListField()
    
    # Client analysis
    client_satisfaction_metrics = serializers.DictField()
    client_retention_rate = serializers.FloatField()
    top_clients_by_volume = serializers.ListField()
    
    # Service analysis
    most_requested_services = serializers.ListField()
    service_completion_rates = serializers.DictField()
    seasonal_trends = serializers.DictField()
    
    # Operational efficiency
    processing_time_trends = serializers.ListField()
    resource_utilization = serializers.DictField()
    bottleneck_analysis = serializers.DictField()
    
    # Forecasting
    demand_forecast = serializers.ListField()
    capacity_planning = serializers.DictField()
    
    # Geographic analysis (if applicable)
    geographic_distribution = serializers.DictField()


class AlertSerializer(serializers.Serializer):
    """
    System alerts and notifications
    """
    id = serializers.CharField()
    type = serializers.CharField()  # info, warning, error, critical
    category = serializers.CharField()  # system, performance, security, business
    title = serializers.CharField()
    message = serializers.CharField()
    severity = serializers.IntegerField()  # 1-5
    is_acknowledged = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    acknowledged_at = serializers.DateTimeField(allow_null=True)
    acknowledged_by = serializers.CharField(allow_null=True)
    metadata = serializers.DictField()


class NotificationSummarySerializer(serializers.Serializer):
    """
    Notification summary for dashboard
    """
    unread_count = serializers.IntegerField()
    urgent_count = serializers.IntegerField()
    today_count = serializers.IntegerField()
    recent_notifications = serializers.ListField()
    notification_types = serializers.DictField()


class QuickStatsSerializer(serializers.Serializer):
    """
    Quick stats widget for dashboard
    """
    title = serializers.CharField()
    value = serializers.CharField()
    change = serializers.FloatField()
    change_type = serializers.CharField()  # increase, decrease, neutral
    icon = serializers.CharField()
    color = serializers.CharField()
    trend_data = serializers.ListField()


class DashboardWidgetSerializer(serializers.Serializer):
    """
    Dashboard widget configuration
    """
    widget_id = serializers.CharField()
    widget_type = serializers.CharField()
    title = serializers.CharField()
    position = serializers.DictField()
    size = serializers.DictField()
    data = serializers.DictField()
    settings = serializers.DictField()
    is_visible = serializers.BooleanField()
    refresh_interval = serializers.IntegerField()  # seconds