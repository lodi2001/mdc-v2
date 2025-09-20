"""
URL configuration for Reports app
"""

from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    # Existing report generation endpoints
    path('transactions/', views.TransactionReportView.as_view(), name='transaction-report'),
    path('analytics/', views.AnalyticsReportView.as_view(), name='analytics-report'),
    path('audit-log/', views.AuditLogReportView.as_view(), name='audit-log-report'),
    path('users/', views.UserReportView.as_view(), name='user-report'),
    path('custom/', views.CustomReportView.as_view(), name='custom-report'),
    
    # Legacy report templates (keep for backward compatibility)
    path('templates/', views.ReportTemplateView.as_view(), name='report-templates'),
    
    # Enhanced Report Templates Management
    path('report-templates/', views.ReportTemplateListCreateView.as_view(), name='report-template-list'),
    path('report-templates/<int:pk>/', views.ReportTemplateDetailView.as_view(), name='report-template-detail'),
    
    # Custom Report Builder
    path('builders/', views.CustomReportBuilderListCreateView.as_view(), name='report-builder-list'),
    path('builders/<int:pk>/', views.CustomReportBuilderDetailView.as_view(), name='report-builder-detail'),
    path('builders/<int:builder_id>/generate/', views.CustomReportGenerateView.as_view(), name='custom-report-generate'),
    path('builder-data-sources/', views.ReportBuilderDataSourcesView.as_view(), name='report-builder-data-sources'),
    
    # Scheduled Reports
    path('scheduled/', views.ScheduledReportListCreateView.as_view(), name='scheduled-report-list'),
    path('scheduled/<int:pk>/', views.ScheduledReportDetailView.as_view(), name='scheduled-report-detail'),
    path('scheduled/<int:report_id>/execute/', views.ScheduledReportExecuteView.as_view(), name='scheduled-report-execute'),
    
    # Report Executions
    path('executions/', views.ReportExecutionListView.as_view(), name='report-execution-list'),
    
    # Quick Report Generation
    path('quick-generate/', views.quick_report_generate, name='quick-report-generate'),
]