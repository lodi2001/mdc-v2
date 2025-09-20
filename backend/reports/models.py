from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
import json

User = get_user_model()


class ReportTemplate(models.Model):
    """Template for report configurations"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=[
        ('transaction', 'Transaction Report'),
        ('analytics', 'Analytics Report'),
        ('user', 'User Report'),
        ('audit', 'Audit Log Report'),
        ('custom', 'Custom Report'),
    ])
    configuration = models.JSONField(default=dict)
    filters = models.JSONField(default=dict)
    columns = models.JSONField(default=list)
    format_types = models.JSONField(default=list)  # ['pdf', 'excel']
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_report_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        
    def __str__(self):
        return self.name


class CustomReportBuilder(models.Model):
    """Custom report builder for users to create their own reports"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    data_source = models.CharField(max_length=50, choices=[
        ('transactions', 'Transactions'),
        ('users', 'Users'),
        ('audit_logs', 'Audit Logs'),
        ('workflows', 'Workflows'),
        ('attachments', 'Attachments'),
    ])
    query_config = models.JSONField(default=dict)  # Stores the query configuration
    visualization_config = models.JSONField(default=dict)  # Chart/graph settings
    filters = models.JSONField(default=list)  # Available filters for the report
    columns = models.JSONField(default=list)  # Selected columns
    aggregations = models.JSONField(default=list)  # Count, Sum, Avg, etc.
    sorting = models.JSONField(default=list)  # Sorting configuration
    grouping = models.JSONField(default=list)  # Group by fields
    format_settings = models.JSONField(default=dict)  # PDF/Excel format settings
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_reports')
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_custom_reports')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'created_by']
        
    def __str__(self):
        return f"{self.name} - {self.created_by.username}"


class ScheduledReport(models.Model):
    """Scheduled report generation"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    report_template = models.ForeignKey(ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    custom_report = models.ForeignKey(CustomReportBuilder, on_delete=models.SET_NULL, null=True, blank=True)
    report_type = models.CharField(max_length=50, choices=[
        ('template', 'Template Based'),
        ('custom', 'Custom Report'),
        ('api', 'API Based'),
    ])
    schedule_type = models.CharField(max_length=20, choices=[
        ('once', 'One Time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ])
    schedule_config = models.JSONField(default=dict)  # Specific scheduling configuration
    next_run = models.DateTimeField()
    last_run = models.DateTimeField(null=True, blank=True)
    recipients = models.JSONField(default=list)  # Email addresses
    format_type = models.CharField(max_length=10, choices=[
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('both', 'Both'),
    ], default='pdf')
    filters = models.JSONField(default=dict)  # Dynamic filters for the report
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['next_run']
        
    def __str__(self):
        return f"{self.name} - {self.schedule_type}"
    
    def calculate_next_run(self):
        """Calculate next run time based on schedule"""
        from datetime import timedelta
        
        if self.schedule_type == 'once':
            return None
        
        base_time = self.last_run if self.last_run else timezone.now()
        schedule_config = self.schedule_config
        
        if self.schedule_type == 'daily':
            return base_time + timedelta(days=1)
        elif self.schedule_type == 'weekly':
            return base_time + timedelta(weeks=1)
        elif self.schedule_type == 'monthly':
            # Add one month (approximate)
            return base_time + timedelta(days=30)
        elif self.schedule_type == 'quarterly':
            return base_time + timedelta(days=90)
        
        return base_time + timedelta(days=1)  # Default to daily


class ReportExecution(models.Model):
    """Track report generation executions"""
    scheduled_report = models.ForeignKey(ScheduledReport, on_delete=models.CASCADE, related_name='executions', null=True, blank=True)
    report_name = models.CharField(max_length=100)
    report_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    format_type = models.CharField(max_length=10)
    record_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    execution_time_seconds = models.FloatField(null=True, blank=True)
    filters_applied = models.JSONField(default=dict)
    executed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='executed_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.report_name} - {self.status}"
    
    def calculate_execution_time(self):
        """Calculate execution time if both timestamps exist"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            self.execution_time_seconds = delta.total_seconds()
            self.save()


class ReportShare(models.Model):
    """Share reports with users"""
    report_execution = models.ForeignKey(ReportExecution, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_reports')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reports')
    share_message = models.TextField(blank=True)
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['report_execution', 'shared_with']
        
    def __str__(self):
        return f"Share: {self.report_execution.report_name} with {self.shared_with.username}"
