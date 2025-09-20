"""
Views for Report Generation API
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum
from django.http import HttpResponse
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from transactions.models import Transaction
from users.models import User
from audit.models import AuditLog
from attachments.models import Attachment
from notifications.models import EmailNotification
from core.permissions import IsActiveUser, IsEditorOrAdmin, IsAdminUser
from core.utils import create_success_response, create_error_response, create_audit_log_entry
from .utils import PDFReportGenerator, ExcelReportGenerator, generate_report_response
from .models import (
    ReportTemplate, CustomReportBuilder, ScheduledReport, 
    ReportExecution, ReportShare
)
from .serializers import (
    ReportTemplateSerializer, CustomReportBuilderSerializer, 
    ScheduledReportSerializer, ReportExecutionSerializer, 
    ReportShareSerializer, ReportBuilderConfigSerializer, QuickReportSerializer
)

logger = logging.getLogger(__name__)


class TransactionReportView(APIView):
    """
    Generate transaction reports in PDF or Excel format
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Generate transaction report based on filters
        """
        # Get parameters
        format_type = request.query_params.get('format', 'pdf').lower()
        report_type = request.query_params.get('type', 'detailed')
        
        # Date range filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Other filters
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        category_filter = request.query_params.get('category')
        assigned_to = request.query_params.get('assigned_to')
        
        # Build query
        queryset = Transaction.objects.filter(is_deleted=False)
        
        # Apply role-based filtering
        user = request.user
        if user.role == 'client':
            queryset = queryset.filter(client=user)
        elif user.role == 'editor':
            queryset = queryset.filter(
                Q(assigned_to=user) | Q(created_by=user)
            )
        
        # Apply filters
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(created_at__lte=end)
            except ValueError:
                pass
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        if assigned_to and user.role in ['admin', 'editor']:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Order by creation date
        transactions = queryset.select_related(
            'client', 'assigned_to', 'created_by'
        ).prefetch_related(
            'attachments', 'comments'
        ).order_by('-created_at')
        
        # Generate report
        try:
            if format_type == 'pdf':
                generator = PDFReportGenerator()
                title = f"Transaction Report - {datetime.now().strftime('%Y-%m-%d')}"
                buffer = generator.generate_transaction_report(transactions, title)
                filename = f"transaction_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            elif format_type == 'excel':
                generator = ExcelReportGenerator()
                buffer = generator.generate_transaction_report(transactions)
                filename = f"transaction_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                return create_error_response(
                    message="Invalid format. Use 'pdf' or 'excel'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='report_generated',
                object_type='TransactionReport',
                object_id=0,
                details={
                    'format': format_type,
                    'filters': {
                        'start_date': start_date,
                        'end_date': end_date,
                        'status': status_filter,
                        'priority': priority_filter,
                        'category': category_filter
                    },
                    'record_count': transactions.count()
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalyticsReportView(APIView):
    """
    Generate analytics reports
    """
    permission_classes = [IsEditorOrAdmin]
    
    def get(self, request):
        """
        Generate analytics report
        """
        format_type = request.query_params.get('format', 'pdf').lower()
        period = request.query_params.get('period', '30')  # days
        
        try:
            days = int(period)
        except ValueError:
            days = 30
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Gather analytics data
        transactions = Transaction.objects.filter(
            is_deleted=False,
            created_at__gte=start_date
        )
        
        # Basic statistics
        total_transactions = transactions.count()
        completed_transactions = transactions.filter(status='completed').count()
        
        # Status distribution
        status_distribution = dict(
            transactions.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        
        # Priority distribution
        priority_distribution = dict(
            transactions.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Category distribution
        category_distribution = dict(
            transactions.values('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        
        # User statistics
        users = User.objects.filter(is_active=True)
        total_users = users.count()
        users_by_role = dict(
            users.values('role')
            .annotate(count=Count('id'))
            .values_list('role', 'count')
        )
        
        # Top performers (editors with most completed transactions)
        top_performers = list(
            Transaction.objects.filter(
                status='completed',
                created_at__gte=start_date,
                assigned_to__isnull=False
            ).values(
                'assigned_to__username',
                'assigned_to__first_name',
                'assigned_to__last_name'
            ).annotate(
                completed_count=Count('id')
            ).order_by('-completed_count')[:10]
        )
        
        # Average completion time
        completed_txns = transactions.filter(status='completed')
        avg_completion_time = 0
        if completed_txns.exists():
            completion_times = []
            for txn in completed_txns:
                if txn.created_at and txn.updated_at:
                    delta = (txn.updated_at - txn.created_at).days
                    completion_times.append(delta)
            if completion_times:
                avg_completion_time = sum(completion_times) / len(completion_times)
        
        # Compile analytics data
        analytics_data = {
            'summary': {
                'Report Period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                'Total Transactions': total_transactions,
                'Completed Transactions': completed_transactions,
                'Completion Rate': f"{(completed_transactions/total_transactions*100 if total_transactions else 0):.1f}%",
                'Average Completion Time': f"{avg_completion_time:.1f} days",
                'Total Users': total_users
            },
            'status_distribution': status_distribution,
            'priority_distribution': priority_distribution,
            'category_distribution': category_distribution,
            'users_by_role': users_by_role,
            'top_performers': top_performers
        }
        
        # Generate report
        try:
            if format_type == 'pdf':
                generator = PDFReportGenerator()
                title = f"Analytics Report - {datetime.now().strftime('%Y-%m-%d')}"
                buffer = generator.generate_analytics_report(analytics_data, title)
                filename = f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            elif format_type == 'excel':
                generator = ExcelReportGenerator()
                buffer = generator.generate_analytics_report(analytics_data)
                filename = f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                return create_error_response(
                    message="Invalid format. Use 'pdf' or 'excel'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='report_generated',
                object_type='AnalyticsReport',
                object_id=0,
                details={
                    'format': format_type,
                    'period': days,
                    'data_points': len(analytics_data)
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"Analytics report generation failed: {str(e)}")
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AuditLogReportView(APIView):
    """
    Generate audit log reports
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Generate audit log report
        """
        format_type = request.query_params.get('format', 'pdf').lower()
        
        # Date range filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Other filters
        user_id = request.query_params.get('user_id')
        action_filter = request.query_params.get('action')
        table_filter = request.query_params.get('table')
        
        # Build query
        queryset = AuditLog.objects.all()
        
        # Apply filters
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(created_at__lte=end)
            except ValueError:
                pass
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
        if table_filter:
            queryset = queryset.filter(table_name=table_filter)
        
        # Order by creation date
        audit_logs = queryset.select_related('user').order_by('-created_at')[:1000]  # Limit to 1000 entries
        
        # Generate report
        try:
            if format_type == 'pdf':
                generator = PDFReportGenerator()
                title = f"Audit Log Report - {datetime.now().strftime('%Y-%m-%d')}"
                buffer = generator.generate_audit_report(audit_logs, title)
                filename = f"audit_log_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                return create_error_response(
                    message="Audit reports are only available in PDF format",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='report_generated',
                object_type='AuditLogReport',
                object_id=0,
                details={
                    'format': format_type,
                    'filters': {
                        'start_date': start_date,
                        'end_date': end_date,
                        'user_id': user_id,
                        'action': action_filter,
                        'table': table_filter
                    },
                    'record_count': audit_logs.count()
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"Audit report generation failed: {str(e)}")
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserReportView(APIView):
    """
    Generate user reports
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Generate user report
        """
        format_type = request.query_params.get('format', 'excel').lower()
        
        # Filters
        role_filter = request.query_params.get('role')
        status_filter = request.query_params.get('status')
        
        # Build query
        queryset = User.objects.all()
        
        # Apply filters
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Order by date joined
        users = queryset.prefetch_related(
            'created_transactions', 'assigned_transactions'
        ).order_by('-date_joined')
        
        # Generate report
        try:
            if format_type == 'excel':
                generator = ExcelReportGenerator()
                buffer = generator.generate_user_report(users)
                filename = f"user_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                return create_error_response(
                    message="User reports are only available in Excel format",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='report_generated',
                object_type='UserReport',
                object_id=0,
                details={
                    'format': format_type,
                    'filters': {
                        'role': role_filter,
                        'status': status_filter
                    },
                    'record_count': users.count()
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"User report generation failed: {str(e)}")
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomReportView(APIView):
    """
    Generate custom reports based on user requirements
    """
    permission_classes = [IsEditorOrAdmin]
    
    def post(self, request):
        """
        Generate custom report based on specifications
        """
        report_config = request.data.get('config', {})
        format_type = request.data.get('format', 'pdf').lower()
        
        # Validate configuration
        if not report_config:
            return create_error_response(
                message="Report configuration is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        report_type = report_config.get('type', 'transactions')
        filters = report_config.get('filters', {})
        columns = report_config.get('columns', [])
        
        try:
            # Build data based on report type
            if report_type == 'transactions':
                queryset = Transaction.objects.filter(is_deleted=False)
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(Transaction, field):
                        queryset = queryset.filter(**{field: value})
                
                data = list(queryset.values(*columns if columns else ['transaction_id', 'status', 'created_at']))
                
            elif report_type == 'users':
                queryset = User.objects.all()
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(User, field):
                        queryset = queryset.filter(**{field: value})
                
                data = list(queryset.values(*columns if columns else ['username', 'email', 'role']))
                
            else:
                return create_error_response(
                    message=f"Unsupported report type: {report_type}",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate report
            if format_type == 'pdf':
                generator = PDFReportGenerator()
                title = f"Custom {report_type.title()} Report - {datetime.now().strftime('%Y-%m-%d')}"
                buffer = generator.generate_analytics_report({'data': data}, title)
                filename = f"custom_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            elif format_type == 'excel':
                generator = ExcelReportGenerator()
                buffer = generator.generate_analytics_report({'data': data})
                filename = f"custom_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                return create_error_response(
                    message="Invalid format. Use 'pdf' or 'excel'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='report_generated',
                object_type='CustomReport',
                object_id=0,
                details={
                    'format': format_type,
                    'type': report_type,
                    'filters': filters,
                    'columns': columns,
                    'record_count': len(data)
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"Custom report generation failed: {str(e)}")
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportTemplateView(APIView):
    """
    Get available report templates and configurations
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get available report templates based on user role
        """
        user = request.user
        
        # Base templates available to all users
        templates = [
            {
                'id': 'transaction_detailed',
                'name': 'Detailed Transaction Report',
                'description': 'Complete transaction details with all fields',
                'formats': ['pdf', 'excel'],
                'filters': ['date_range', 'status', 'priority', 'category']
            }
        ]
        
        # Add role-specific templates
        if user.role in ['admin', 'editor']:
            templates.extend([
                {
                    'id': 'analytics_summary',
                    'name': 'Analytics Summary Report',
                    'description': 'System analytics and performance metrics',
                    'formats': ['pdf', 'excel'],
                    'filters': ['period']
                },
                {
                    'id': 'user_activity',
                    'name': 'User Activity Report',
                    'description': 'User activity and performance metrics',
                    'formats': ['excel'],
                    'filters': ['date_range', 'user_id']
                }
            ])
        
        if user.role == 'admin':
            templates.extend([
                {
                    'id': 'audit_log',
                    'name': 'Audit Log Report',
                    'description': 'System audit trail and user actions',
                    'formats': ['pdf'],
                    'filters': ['date_range', 'user_id', 'action', 'table']
                },
                {
                    'id': 'user_management',
                    'name': 'User Management Report',
                    'description': 'Complete user list with details',
                    'formats': ['excel'],
                    'filters': ['role', 'status']
                },
                {
                    'id': 'system_health',
                    'name': 'System Health Report',
                    'description': 'System performance and health metrics',
                    'formats': ['pdf'],
                    'filters': ['period']
                }
            ])
        
        return create_success_response(
            message="Report templates retrieved successfully",
            data={'templates': templates}
        )


# New API endpoints for enhanced report generation


class ReportTemplateListCreateView(generics.ListCreateAPIView):
    """
    List and create report templates
    """
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsEditorOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ReportTemplate.objects.all()
        return ReportTemplate.objects.filter(
            Q(created_by=user) | Q(is_public=True)
        )


class ReportTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete report templates
    """
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsEditorOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ReportTemplate.objects.all()
        return ReportTemplate.objects.filter(created_by=user)


class CustomReportBuilderListCreateView(generics.ListCreateAPIView):
    """
    List and create custom report builders
    """
    serializer_class = CustomReportBuilderSerializer
    permission_classes = [IsActiveUser]
    
    def get_queryset(self):
        user = self.request.user
        return CustomReportBuilder.objects.filter(
            Q(created_by=user) | Q(shared_with=user) | Q(is_public=True)
        ).distinct()


class CustomReportBuilderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete custom report builders
    """
    serializer_class = CustomReportBuilderSerializer
    permission_classes = [IsActiveUser]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return CustomReportBuilder.objects.all()
        return CustomReportBuilder.objects.filter(
            Q(created_by=user) | Q(shared_with=user)
        ).distinct()


class CustomReportGenerateView(APIView):
    """
    Generate report from custom report builder
    """
    permission_classes = [IsActiveUser]
    
    def post(self, request, builder_id):
        """
        Generate report using custom report builder configuration
        """
        try:
            builder = CustomReportBuilder.objects.get(
                Q(id=builder_id) & 
                (Q(created_by=request.user) | Q(shared_with=request.user) | Q(is_public=True))
            )
        except CustomReportBuilder.DoesNotExist:
            return create_error_response(
                message="Custom report builder not found or access denied",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        format_type = request.data.get('format', 'pdf').lower()
        additional_filters = request.data.get('filters', {})
        
        try:
            # Start execution tracking
            execution = ReportExecution.objects.create(
                report_name=builder.name,
                report_type='custom',
                status='processing',
                format_type=format_type,
                filters_applied=additional_filters,
                executed_by=request.user,
                started_at=timezone.now()
            )
            
            # Build query based on configuration
            data_source = builder.data_source
            query_config = builder.query_config
            columns = builder.columns or []
            filters = {**builder.filters, **additional_filters}
            
            # Generate data based on data source
            if data_source == 'transactions':
                queryset = Transaction.objects.filter(is_deleted=False)
                
                # Apply role-based filtering
                user = request.user
                if user.role == 'client':
                    queryset = queryset.filter(client=user)
                elif user.role == 'editor':
                    queryset = queryset.filter(
                        Q(assigned_to=user) | Q(created_by=user)
                    )
                
                # Apply additional filters
                for field, value in filters.items():
                    if hasattr(Transaction, field) and value:
                        if field in ['created_at', 'updated_at'] and isinstance(value, dict):
                            if 'start' in value:
                                queryset = queryset.filter(**{f"{field}__gte": value['start']})
                            if 'end' in value:
                                queryset = queryset.filter(**{f"{field}__lte": value['end']})
                        else:
                            queryset = queryset.filter(**{field: value})
                
                # Apply grouping and aggregations
                if builder.grouping:
                    data = queryset.values(*builder.grouping).annotate(
                        count=Count('id')
                    )
                else:
                    data = queryset.select_related('client', 'assigned_to')
                    if columns:
                        data = data.values(*columns)
                    else:
                        data = data.values()
                    
                data = list(data)
                
            elif data_source == 'users':
                queryset = User.objects.all()
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(User, field) and value:
                        queryset = queryset.filter(**{field: value})
                
                if builder.grouping:
                    data = list(queryset.values(*builder.grouping).annotate(count=Count('id')))
                else:
                    data = list(queryset.values(*columns if columns else ['id', 'username', 'email', 'role']))
                
            else:
                return create_error_response(
                    message=f"Data source '{data_source}' not supported yet",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Update execution record count
            execution.record_count = len(data)
            execution.save()
            
            # Generate report
            if format_type == 'pdf':
                generator = PDFReportGenerator()
                title = f"{builder.name} - {datetime.now().strftime('%Y-%m-%d')}"
                buffer = generator.generate_custom_report(data, title, builder.format_settings)
                filename = f"custom_report_{builder.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            elif format_type == 'excel':
                generator = ExcelReportGenerator()
                buffer = generator.generate_custom_report(data, builder.format_settings)
                filename = f"custom_report_{builder.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            else:
                execution.status = 'failed'
                execution.error_message = "Invalid format type"
                execution.save()
                return create_error_response(
                    message="Invalid format. Use 'pdf' or 'excel'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Update execution as completed
            execution.status = 'completed'
            execution.completed_at = timezone.now()
            execution.calculate_execution_time()
            
            # Log report generation
            create_audit_log_entry(
                user=request.user,
                action='custom_report_generated',
                object_type='CustomReportBuilder',
                object_id=builder.id,
                details={
                    'report_name': builder.name,
                    'format': format_type,
                    'record_count': len(data),
                    'execution_id': execution.id
                }
            )
            
            return generate_report_response(buffer, filename, format_type)
            
        except Exception as e:
            logger.error(f"Custom report generation failed: {str(e)}")
            if 'execution' in locals():
                execution.status = 'failed'
                execution.error_message = str(e)
                execution.completed_at = timezone.now()
                execution.save()
            
            return create_error_response(
                message=f"Report generation failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ScheduledReportListCreateView(generics.ListCreateAPIView):
    """
    List and create scheduled reports
    """
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsEditorOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ScheduledReport.objects.all()
        return ScheduledReport.objects.filter(created_by=user)


class ScheduledReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete scheduled reports
    """
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsEditorOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ScheduledReport.objects.all()
        return ScheduledReport.objects.filter(created_by=user)


class ScheduledReportExecuteView(APIView):
    """
    Execute a scheduled report manually
    """
    permission_classes = [IsEditorOrAdmin]
    
    def post(self, request, report_id):
        """
        Execute scheduled report manually
        """
        try:
            scheduled_report = ScheduledReport.objects.get(
                id=report_id,
                created_by=request.user if request.user.role != 'admin' else None
            )
        except ScheduledReport.DoesNotExist:
            return create_error_response(
                message="Scheduled report not found or access denied",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if not scheduled_report.is_active:
            return create_error_response(
                message="Scheduled report is not active",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Execute the scheduled report
            # This would typically be handled by a background task
            from .tasks import execute_scheduled_report
            result = execute_scheduled_report.delay(scheduled_report.id, request.user.id)
            
            return create_success_response(
                message="Scheduled report execution started",
                data={'task_id': result.id, 'report_id': scheduled_report.id}
            )
            
        except Exception as e:
            logger.error(f"Failed to start scheduled report execution: {str(e)}")
            return create_error_response(
                message=f"Failed to start execution: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportExecutionListView(generics.ListAPIView):
    """
    List report executions
    """
    serializer_class = ReportExecutionSerializer
    permission_classes = [IsActiveUser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ReportExecution.objects.select_related(
            'scheduled_report', 'executed_by'
        )
        
        if user.role == 'admin':
            return queryset.all()
        else:
            return queryset.filter(executed_by=user)


class ReportBuilderDataSourcesView(APIView):
    """
    Get available data sources and their fields for report builder
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Return available data sources and their fields
        """
        data_sources = {
            'transactions': {
                'name': 'Transactions',
                'fields': [
                    {'name': 'transaction_id', 'type': 'string', 'label': 'Transaction ID'},
                    {'name': 'status', 'type': 'choice', 'label': 'Status'},
                    {'name': 'priority', 'type': 'choice', 'label': 'Priority'},
                    {'name': 'category', 'type': 'string', 'label': 'Category'},
                    {'name': 'title', 'type': 'string', 'label': 'Title'},
                    {'name': 'description', 'type': 'text', 'label': 'Description'},
                    {'name': 'client__username', 'type': 'string', 'label': 'Client Username'},
                    {'name': 'assigned_to__username', 'type': 'string', 'label': 'Assigned To'},
                    {'name': 'created_at', 'type': 'datetime', 'label': 'Created Date'},
                    {'name': 'updated_at', 'type': 'datetime', 'label': 'Last Updated'},
                ],
                'aggregations': ['count', 'avg', 'sum', 'min', 'max'],
                'filters': [
                    {'field': 'status', 'type': 'choice', 'choices': ['pending', 'in_progress', 'completed', 'cancelled']},
                    {'field': 'priority', 'type': 'choice', 'choices': ['low', 'medium', 'high', 'urgent']},
                    {'field': 'category', 'type': 'string'},
                    {'field': 'created_at', 'type': 'date_range'},
                ]
            },
            'users': {
                'name': 'Users',
                'fields': [
                    {'name': 'username', 'type': 'string', 'label': 'Username'},
                    {'name': 'email', 'type': 'string', 'label': 'Email'},
                    {'name': 'first_name', 'type': 'string', 'label': 'First Name'},
                    {'name': 'last_name', 'type': 'string', 'label': 'Last Name'},
                    {'name': 'role', 'type': 'choice', 'label': 'Role'},
                    {'name': 'is_active', 'type': 'boolean', 'label': 'Active'},
                    {'name': 'date_joined', 'type': 'datetime', 'label': 'Date Joined'},
                ],
                'aggregations': ['count'],
                'filters': [
                    {'field': 'role', 'type': 'choice', 'choices': ['admin', 'editor', 'client']},
                    {'field': 'is_active', 'type': 'boolean'},
                    {'field': 'date_joined', 'type': 'date_range'},
                ]
            }
        }
        
        return create_success_response(
            message="Data sources retrieved successfully",
            data={'data_sources': data_sources}
        )


@api_view(['POST'])
@permission_classes([IsActiveUser])
def quick_report_generate(request):
    """
    Generate a quick report without saving configuration
    """
    serializer = QuickReportSerializer(data=request.data)
    if not serializer.is_valid():
        return create_error_response(
            message="Invalid request data",
            data=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    validated_data = serializer.validated_data
    report_type = validated_data['report_type']
    format_type = validated_data['format_type']
    filters = validated_data.get('filters', {})
    
    try:
        # Route to appropriate existing view based on report type
        if report_type == 'transaction':
            view = TransactionReportView()
            request._request.GET = request._request.GET.copy()
            request._request.GET.update({
                'format': format_type,
                **filters
            })
            return view.get(request._request)
        elif report_type == 'analytics':
            view = AnalyticsReportView()
            request._request.GET = request._request.GET.copy()
            request._request.GET.update({
                'format': format_type,
                **filters
            })
            return view.get(request._request)
        elif report_type == 'user':
            view = UserReportView()
            request._request.GET = request._request.GET.copy()
            request._request.GET.update({
                'format': format_type,
                **filters
            })
            return view.get(request._request)
        elif report_type == 'audit':
            view = AuditLogReportView()
            request._request.GET = request._request.GET.copy()
            request._request.GET.update({
                'format': format_type,
                **filters
            })
            return view.get(request._request)
        else:
            return create_error_response(
                message=f"Unsupported report type: {report_type}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        logger.error(f"Quick report generation failed: {str(e)}")
        return create_error_response(
            message=f"Report generation failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )