"""
Views for Dashboard API
"""

import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q, F
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework import status

from .serializers import (
    AdminDashboardSerializer, EditorDashboardSerializer, ClientDashboardSerializer,
    RecentActivitySerializer, PerformanceMetricsSerializer, WorkloadAnalysisSerializer,
    SystemHealthSerializer, BusinessIntelligenceSerializer, NotificationSummarySerializer,
    QuickStatsSerializer, DashboardWidgetSerializer
)
from users.models import User
from transactions.models import Transaction, TransactionStatusHistory, Comment
from attachments.models import Attachment
from notifications.models import EmailNotification
from core.permissions import IsActiveUser, IsAdminUser, IsEditorOrAdmin
from core.utils import create_success_response, create_error_response

logger = logging.getLogger(__name__)


class DashboardStatsView(APIView):
    """
    Quick dashboard statistics endpoint
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get dashboard statistics based on user role
        """
        user = request.user
        
        # Basic transaction statistics
        all_transactions = Transaction.objects.filter(is_deleted=False)
        
        if user.role == 'client':
            # Client sees only their transactions
            user_transactions = all_transactions.filter(client=user)
            stats = {
                'totalTransactions': user_transactions.count(),
                'pendingApproval': user_transactions.filter(status='submitted').count(),
                'completed': user_transactions.filter(status='completed').count(),
                'activeUsers': 1,  # Client only sees themselves
            }
        elif user.role == 'editor':
            # Editor sees assigned transactions
            user_transactions = all_transactions.filter(
                Q(assigned_to=user) | Q(created_by=user)
            )
            stats = {
                'totalTransactions': user_transactions.count(),
                'pendingApproval': user_transactions.filter(status='under_review').count(),
                'completed': user_transactions.filter(status='completed').count(),
                'activeUsers': User.objects.filter(status='active').count(),
            }
        else:  # admin
            stats = {
                'totalTransactions': all_transactions.count(),
                'pendingApproval': all_transactions.filter(
                    status__in=['submitted', 'under_review']
                ).count(),
                'completed': all_transactions.filter(status='completed').count(),
                'activeUsers': User.objects.filter(status='active').count(),
            }
        
        return create_success_response(
            message="Dashboard stats retrieved successfully",
            data=stats
        )


class AdminDashboardView(APIView):
    """
    Comprehensive dashboard for admin users
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get admin dashboard data
        """
        # Time periods for analysis
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        year_ago = now - timedelta(days=365)
        
        # Basic transaction statistics
        all_transactions = Transaction.objects.filter(is_deleted=False)
        total_transactions = all_transactions.count()
        active_transactions = all_transactions.exclude(status__in=['completed', 'cancelled']).count()
        completed_transactions = all_transactions.filter(status='completed').count()
        overdue_transactions = all_transactions.filter(
            due_date__lt=today,
            status__in=['submitted', 'under_review', 'approved', 'in_progress']
        ).count()
        pending_assignments = all_transactions.filter(assigned_to__isnull=True).count()
        
        # User statistics
        all_users = User.objects.all()
        total_users = all_users.count()
        active_users = all_users.filter(status='active').count()
        pending_users = all_users.filter(status='pending').count()
        
        # Attachment statistics
        all_attachments = Attachment.objects.filter(is_deleted=False)
        total_attachments = all_attachments.count()
        total_storage = all_attachments.aggregate(total=Sum('file_size'))['total'] or 0
        
        def format_size(size_bytes):
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size_bytes < 1024.0:
                    return f"{size_bytes:.1f} {unit}"
                size_bytes /= 1024.0
            return f"{size_bytes:.1f} TB"
        
        storage_usage = {
            'total_files': total_attachments,
            'total_size_bytes': total_storage,
            'total_size_formatted': format_size(total_storage),
            'avg_file_size': all_attachments.aggregate(avg=Avg('file_size'))['avg'] or 0
        }
        
        # Transaction breakdowns
        transactions_by_status = dict(
            all_transactions.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        transactions_by_priority = dict(
            all_transactions.values('priority').annotate(count=Count('id')).values_list('priority', 'count')
        )
        transactions_by_department = dict(
            all_transactions.values('department').annotate(count=Count('id')).values_list('department', 'count')
        )
        
        # Performance metrics
        completed_txns = all_transactions.filter(status='completed')
        avg_completion_time = 0
        if completed_txns.exists():
            avg_delta = completed_txns.aggregate(
                avg_time=Avg(F('updated_at') - F('created_at'))
            )['avg_time']
            if avg_delta:
                avg_completion_time = avg_delta.days
        
        completion_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
        
        # Time series data (last 12 months)
        transactions_created_trend = []
        transactions_completed_trend = []
        
        for i in range(12):
            period_start = now - timedelta(days=30 * (i + 1))
            period_end = now - timedelta(days=30 * i)
            
            created_count = all_transactions.filter(
                created_at__gte=period_start,
                created_at__lt=period_end
            ).count()
            
            completed_count = all_transactions.filter(
                status='completed',
                updated_at__gte=period_start,
                updated_at__lt=period_end
            ).count()
            
            transactions_created_trend.insert(0, {
                'period': period_start.strftime('%Y-%m'),
                'count': created_count
            })
            
            transactions_completed_trend.insert(0, {
                'period': period_start.strftime('%Y-%m'),
                'count': completed_count
            })
        
        # Top statistics
        top_clients = list(
            all_transactions.values(
                'client__id', 'client__username', 'client__first_name', 'client__last_name'
            ).annotate(
                transaction_count=Count('id')
            ).order_by('-transaction_count')[:5]
        )
        
        top_editors = list(
            all_transactions.filter(assigned_to__isnull=False)
            .values(
                'assigned_to__id', 'assigned_to__username', 
                'assigned_to__first_name', 'assigned_to__last_name'
            ).annotate(
                transaction_count=Count('id')
            ).order_by('-transaction_count')[:5]
        )
        
        busiest_departments = list(
            all_transactions.values('department')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        
        # Recent activity
        recent_transactions = list(
            all_transactions.filter(created_at__gte=week_ago)
            .values('id', 'transaction_id', 'client_name', 'status', 'created_at')
            .order_by('-created_at')[:10]
        )
        
        recent_users = list(
            all_users.filter(date_joined__gte=week_ago)
            .values('id', 'username', 'first_name', 'last_name', 'role', 'date_joined')
            .order_by('-date_joined')[:10]
        )
        
        recent_uploads = list(
            all_attachments.filter(created_at__gte=week_ago)
            .values('id', 'original_filename', 'file_size', 'uploaded_by__username', 'created_at')
            .order_by('-created_at')[:10]
        )
        
        # System health and alerts (simplified)
        system_alerts = []
        
        # Check for critical issues
        if overdue_transactions > 10:
            system_alerts.append({
                'type': 'warning',
                'message': f'{overdue_transactions} transactions are overdue',
                'severity': 'medium'
            })
        
        if pending_assignments > 5:
            system_alerts.append({
                'type': 'warning',
                'message': f'{pending_assignments} transactions need assignment',
                'severity': 'medium'
            })
        
        if pending_users > 0:
            system_alerts.append({
                'type': 'info',
                'message': f'{pending_users} users waiting for approval',
                'severity': 'low'
            })
        
        performance_metrics = {
            'avg_response_time': 0.15,  # Placeholder - would be real metrics
            'error_rate': 0.02,
            'uptime': 99.9,
            'active_sessions': active_users
        }
        
        # Recent activity count
        recent_activity_count = (
            TransactionStatusHistory.objects.filter(created_at__gte=week_ago).count() +
            Comment.objects.filter(created_at__gte=week_ago).count() +
            all_attachments.filter(created_at__gte=week_ago).count()
        )
        
        dashboard_data = {
            'total_transactions': total_transactions,
            'active_transactions': active_transactions,
            'completed_transactions': completed_transactions,
            'overdue_transactions': overdue_transactions,
            'pending_assignments': pending_assignments,
            'recent_activity_count': recent_activity_count,
            'total_users': total_users,
            'active_users': active_users,
            'pending_users': pending_users,
            'total_attachments': total_attachments,
            'storage_usage': storage_usage,
            'transactions_by_status': transactions_by_status,
            'transactions_by_priority': transactions_by_priority,
            'transactions_by_department': transactions_by_department,
            'avg_completion_time': avg_completion_time,
            'completion_rate': completion_rate,
            'transactions_created_trend': transactions_created_trend,
            'transactions_completed_trend': transactions_completed_trend,
            'top_clients': top_clients,
            'top_editors': top_editors,
            'busiest_departments': busiest_departments,
            'recent_transactions': recent_transactions,
            'recent_users': recent_users,
            'recent_uploads': recent_uploads,
            'system_alerts': system_alerts,
            'performance_metrics': performance_metrics
        }
        
        serializer = AdminDashboardSerializer(dashboard_data)
        return create_success_response(
            message="Admin dashboard data retrieved successfully",
            data=serializer.data
        )


class EditorDashboardView(APIView):
    """
    Dashboard for editor users
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get editor dashboard data
        """
        user = request.user
        if user.role not in ['admin', 'editor']:
            return create_error_response(
                message="Access denied",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Time periods
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # User's transactions (assigned or created)
        my_transactions = Transaction.objects.filter(
            Q(assigned_to=user) | Q(created_by=user),
            is_deleted=False
        )
        
        # All transactions for context
        all_transactions = Transaction.objects.filter(is_deleted=False)
        
        # Basic statistics
        total_transactions = all_transactions.count()
        active_transactions = all_transactions.exclude(status__in=['completed', 'cancelled']).count()
        completed_transactions = all_transactions.filter(status='completed').count()
        overdue_transactions = all_transactions.filter(
            due_date__lt=today,
            status__in=['submitted', 'under_review', 'approved', 'in_progress']
        ).count()
        pending_assignments = all_transactions.filter(assigned_to__isnull=True).count()
        
        # My statistics
        my_assigned_transactions = my_transactions.filter(assigned_to=user).count()
        my_completed_transactions = my_transactions.filter(status='completed').count()
        my_overdue_transactions = my_transactions.filter(
            due_date__lt=today,
            status__in=['submitted', 'under_review', 'approved', 'in_progress']
        ).count()
        
        # My transaction breakdowns
        my_transactions_by_status = dict(
            my_transactions.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        my_transactions_by_priority = dict(
            my_transactions.values('priority').annotate(count=Count('id')).values_list('priority', 'count')
        )
        
        # My performance metrics
        my_completed = my_transactions.filter(status='completed')
        my_avg_completion_time = 0
        if my_completed.exists():
            avg_delta = my_completed.aggregate(
                avg_time=Avg(F('updated_at') - F('created_at'))
            )['avg_time']
            if avg_delta:
                my_avg_completion_time = avg_delta.days
        
        # Workload analysis
        workload_distribution = {
            'total_assigned': my_assigned_transactions,
            'in_progress': my_transactions.filter(status='in_progress').count(),
            'under_review': my_transactions.filter(status='under_review').count(),
            'capacity_utilization': min(my_assigned_transactions / 10.0, 1.0)  # Assuming 10 is max capacity
        }
        
        # Upcoming deadlines
        upcoming_deadlines = list(
            my_transactions.filter(
                due_date__gte=today,
                due_date__lte=today + timedelta(days=14),
                status__in=['submitted', 'under_review', 'approved', 'in_progress']
            ).values('id', 'transaction_id', 'client_name', 'due_date', 'status', 'priority')
            .order_by('due_date')[:10]
        )
        
        # Monthly performance
        monthly_performance = {
            'completed_this_month': my_transactions.filter(
                status='completed',
                updated_at__gte=month_ago
            ).count(),
            'avg_time_this_month': my_avg_completion_time,  # Simplified
            'quality_score': 95.0  # Placeholder
        }
        
        # Completion trend (last 6 months)
        completion_trend = []
        for i in range(6):
            period_start = now - timedelta(days=30 * (i + 1))
            period_end = now - timedelta(days=30 * i)
            
            completed_count = my_transactions.filter(
                status='completed',
                updated_at__gte=period_start,
                updated_at__lt=period_end
            ).count()
            
            completion_trend.insert(0, {
                'period': period_start.strftime('%Y-%m'),
                'count': completed_count
            })
        
        # Recent activity
        recent_assignments = list(
            my_transactions.filter(
                assigned_to=user,
                created_at__gte=week_ago
            ).values('id', 'transaction_id', 'client_name', 'priority', 'created_at')
            .order_by('-created_at')[:5]
        )
        
        recent_completions = list(
            my_transactions.filter(
                status='completed',
                updated_at__gte=week_ago
            ).values('id', 'transaction_id', 'client_name', 'updated_at')
            .order_by('-updated_at')[:5]
        )
        
        recent_comments = list(
            Comment.objects.filter(
                user=user,
                created_at__gte=week_ago,
                is_deleted=False
            ).values('id', 'transaction__transaction_id', 'content', 'created_at')
            .order_by('-created_at')[:5]
        )
        
        # Recent activity count
        recent_activity_count = (
            TransactionStatusHistory.objects.filter(
                changed_by=user,
                created_at__gte=week_ago
            ).count() +
            len(recent_comments)
        )
        
        dashboard_data = {
            'total_transactions': total_transactions,
            'active_transactions': active_transactions,
            'completed_transactions': completed_transactions,
            'overdue_transactions': overdue_transactions,
            'pending_assignments': pending_assignments,
            'recent_activity_count': recent_activity_count,
            'my_assigned_transactions': my_assigned_transactions,
            'my_completed_transactions': my_completed_transactions,
            'my_overdue_transactions': my_overdue_transactions,
            'my_transactions_by_status': my_transactions_by_status,
            'my_transactions_by_priority': my_transactions_by_priority,
            'my_avg_completion_time': my_avg_completion_time,
            'workload_distribution': workload_distribution,
            'upcoming_deadlines': upcoming_deadlines,
            'monthly_performance': monthly_performance,
            'completion_trend': completion_trend,
            'recent_assignments': recent_assignments,
            'recent_completions': recent_completions,
            'recent_comments': recent_comments
        }
        
        serializer = EditorDashboardSerializer(dashboard_data)
        return create_success_response(
            message="Editor dashboard data retrieved successfully",
            data=serializer.data
        )


class ClientDashboardView(APIView):
    """
    Dashboard for client users
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get client dashboard data
        """
        user = request.user
        if user.role != 'client':
            return create_error_response(
                message="Access denied",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Time periods
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Client's transactions
        my_transactions = Transaction.objects.filter(
            client=user,
            is_deleted=False
        )
        
        # All transactions for general context
        all_transactions = Transaction.objects.filter(is_deleted=False)
        
        # Basic statistics
        total_transactions = all_transactions.count()
        active_transactions = all_transactions.exclude(status__in=['completed', 'cancelled']).count()
        completed_transactions = all_transactions.filter(status='completed').count()
        overdue_transactions = all_transactions.filter(
            due_date__lt=today,
            status__in=['submitted', 'under_review', 'approved', 'in_progress']
        ).count()
        pending_assignments = all_transactions.filter(assigned_to__isnull=True).count()
        
        # My statistics
        my_total_transactions = my_transactions.count()
        my_active_transactions = my_transactions.exclude(status__in=['completed', 'cancelled']).count()
        my_completed_transactions = my_transactions.filter(status='completed').count()
        my_draft_transactions = my_transactions.filter(status='draft').count()
        
        # My transaction breakdowns
        my_transactions_by_status = dict(
            my_transactions.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        my_transactions_by_department = dict(
            my_transactions.values('department').annotate(count=Count('id')).values_list('department', 'count')
        )
        
        # Transaction timeline
        transaction_timeline = list(
            my_transactions.filter(status__in=['submitted', 'under_review', 'approved', 'in_progress'])
            .values('id', 'transaction_id', 'transaction_type', 'status', 'due_date', 'created_at')
            .order_by('created_at')
        )
        
        # Estimated completions (based on due dates)
        estimated_completions = list(
            my_transactions.filter(
                due_date__isnull=False,
                status__in=['submitted', 'under_review', 'approved', 'in_progress']
            ).values('id', 'transaction_id', 'transaction_type', 'due_date')
            .order_by('due_date')[:5]
        )
        
        # File statistics
        my_attachments = Attachment.objects.filter(
            transaction__client=user,
            is_deleted=False
        )
        total_files_uploaded = my_attachments.count()
        files_pending_review = my_attachments.filter(
            transaction__status__in=['submitted', 'under_review']
        ).count()
        
        # Recent updates
        recent_updates = list(
            TransactionStatusHistory.objects.filter(
                transaction__client=user,
                created_at__gte=week_ago
            ).values(
                'transaction__transaction_id',
                'previous_status',
                'new_status',
                'created_at',
                'changed_by__username'
            ).order_by('-created_at')[:10]
        )
        
        # Recent comments (non-internal)
        recent_comments = list(
            Comment.objects.filter(
                transaction__client=user,
                is_internal=False,
                is_deleted=False,
                created_at__gte=week_ago
            ).values(
                'transaction__transaction_id',
                'content',
                'user__username',
                'created_at'
            ).order_by('-created_at')[:5]
        )
        
        # Service history
        service_history = {
            'total_services_used': my_total_transactions,
            'most_used_department': my_transactions.values('department').annotate(
                count=Count('id')
            ).order_by('-count').first() if my_transactions.exists() else None,
            'satisfaction_rating': 4.5  # Placeholder - would come from surveys
        }
        
        # Average processing time for completed transactions
        my_completed = my_transactions.filter(status='completed')
        avg_processing_time = 0
        if my_completed.exists():
            avg_delta = my_completed.aggregate(
                avg_time=Avg(F('updated_at') - F('created_at'))
            )['avg_time']
            if avg_delta:
                avg_processing_time = avg_delta.days
        
        # Recent activity count
        recent_activity_count = (
            len(recent_updates) + len(recent_comments) +
            my_attachments.filter(created_at__gte=week_ago).count()
        )
        
        dashboard_data = {
            'total_transactions': total_transactions,
            'active_transactions': active_transactions,
            'completed_transactions': completed_transactions,
            'overdue_transactions': overdue_transactions,
            'pending_assignments': pending_assignments,
            'recent_activity_count': recent_activity_count,
            'my_total_transactions': my_total_transactions,
            'my_active_transactions': my_active_transactions,
            'my_completed_transactions': my_completed_transactions,
            'my_draft_transactions': my_draft_transactions,
            'my_transactions_by_status': my_transactions_by_status,
            'my_transactions_by_department': my_transactions_by_department,
            'transaction_timeline': transaction_timeline,
            'estimated_completions': estimated_completions,
            'total_files_uploaded': total_files_uploaded,
            'files_pending_review': files_pending_review,
            'recent_updates': recent_updates,
            'recent_comments': recent_comments,
            'service_history': service_history,
            'avg_processing_time': avg_processing_time
        }
        
        serializer = ClientDashboardSerializer(dashboard_data)
        return create_success_response(
            message="Client dashboard data retrieved successfully",
            data=serializer.data
        )


class RecentActivityView(APIView):
    """
    Recent activity feed
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get recent activity based on user role
        """
        user = request.user
        limit = min(int(request.query_params.get('limit', 20)), 100)
        
        # Time filter
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        
        activities = []
        
        # Transaction activities
        if user.role == 'admin':
            # Admins see all activities
            status_changes = TransactionStatusHistory.objects.filter(
                created_at__gte=since
            ).select_related('transaction', 'changed_by').order_by('-created_at')
        elif user.role == 'editor':
            # Editors see activities on their transactions
            status_changes = TransactionStatusHistory.objects.filter(
                Q(transaction__assigned_to=user) | Q(transaction__created_by=user),
                created_at__gte=since
            ).select_related('transaction', 'changed_by').order_by('-created_at')
        else:  # client
            # Clients see activities on their transactions
            status_changes = TransactionStatusHistory.objects.filter(
                transaction__client=user,
                created_at__gte=since
            ).select_related('transaction', 'changed_by').order_by('-created_at')
        
        for change in status_changes[:limit//2]:
            activities.append({
                'type': 'status_change',
                'id': change.id,
                'title': f"Transaction {change.transaction.transaction_id}",
                'description': f"Status changed from {change.previous_status} to {change.new_status}",
                'user': {
                    'username': change.changed_by.username,
                    'full_name': change.changed_by.get_full_name()
                },
                'timestamp': change.created_at,
                'metadata': {
                    'transaction_id': change.transaction.transaction_id,
                    'previous_status': change.previous_status,
                    'new_status': change.new_status
                }
            })
        
        # Comment activities (filter internal comments for clients)
        comment_filter = Q(created_at__gte=since, is_deleted=False)
        if user.role == 'client':
            comment_filter &= Q(transaction__client=user, is_internal=False)
        elif user.role == 'editor':
            comment_filter &= Q(
                Q(transaction__assigned_to=user) | Q(transaction__created_by=user)
            )
        
        comments = Comment.objects.filter(comment_filter).select_related(
            'transaction', 'user'
        ).order_by('-created_at')
        
        for comment in comments[:limit//2]:
            activities.append({
                'type': 'comment',
                'id': comment.id,
                'title': f"Comment on {comment.transaction.transaction_id}",
                'description': comment.content[:100] + ('...' if len(comment.content) > 100 else ''),
                'user': {
                    'username': comment.user.username,
                    'full_name': comment.user.get_full_name()
                },
                'timestamp': comment.created_at,
                'metadata': {
                    'transaction_id': comment.transaction.transaction_id,
                    'is_internal': comment.is_internal
                }
            })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]
        
        serializer = RecentActivitySerializer(activities, many=True)
        return create_success_response(
            message="Recent activity retrieved successfully",
            data=serializer.data
        )


class PerformanceMetricsView(APIView):
    """
    System performance metrics (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get system performance metrics
        """
        # This would integrate with monitoring systems in production
        # For now, providing sample data structure
        
        metrics = {
            'response_times': {
                'avg': 0.15,
                'p95': 0.45,
                'p99': 0.8
            },
            'throughput': {
                'requests_per_minute': 1250,
                'transactions_per_hour': 45
            },
            'error_rates': {
                'http_4xx': 0.02,
                'http_5xx': 0.001
            },
            'resource_usage': {
                'cpu_percent': 35.5,
                'memory_percent': 68.2,
                'disk_percent': 45.8
            },
            'database_performance': {
                'avg_query_time': 0.025,
                'slow_queries_count': 3,
                'connection_pool_usage': 0.75
            },
            'cache_performance': {
                'hit_rate': 0.92,
                'miss_rate': 0.08,
                'eviction_rate': 0.05
            }
        }
        
        serializer = PerformanceMetricsSerializer(metrics)
        return create_success_response(
            message="Performance metrics retrieved successfully",
            data=serializer.data
        )
