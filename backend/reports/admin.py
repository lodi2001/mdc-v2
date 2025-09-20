from django.contrib import admin
from .models import (
    ReportTemplate, CustomReportBuilder, ScheduledReport, 
    ReportExecution, ReportShare
)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'is_active', 'is_public', 'created_by', 'created_at']
    list_filter = ['report_type', 'is_active', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = []


@admin.register(CustomReportBuilder)
class CustomReportBuilderAdmin(admin.ModelAdmin):
    list_display = ['name', 'data_source', 'created_by', 'is_public', 'created_at']
    list_filter = ['data_source', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['shared_with']


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'schedule_type', 'next_run', 'is_active', 'created_by']
    list_filter = ['report_type', 'schedule_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['last_run', 'created_at', 'updated_at']
    date_hierarchy = 'next_run'


@admin.register(ReportExecution)
class ReportExecutionAdmin(admin.ModelAdmin):
    list_display = ['report_name', 'report_type', 'status', 'record_count', 'execution_time_seconds', 'executed_by', 'created_at']
    list_filter = ['status', 'report_type', 'format_type', 'created_at']
    search_fields = ['report_name', 'executed_by__username']
    readonly_fields = ['started_at', 'completed_at', 'execution_time_seconds', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(ReportShare)
class ReportShareAdmin(admin.ModelAdmin):
    list_display = ['report_execution', 'shared_by', 'shared_with', 'is_viewed', 'created_at']
    list_filter = ['is_viewed', 'created_at']
    search_fields = ['shared_by__username', 'shared_with__username']
    readonly_fields = ['viewed_at', 'created_at']
    date_hierarchy = 'created_at'
