"""
Views for Audit API
"""

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import AuditLog
from .serializers import (
    AuditLogSerializer,
    AuditLogDetailSerializer,
    AuditLogStatisticsSerializer,
    AuditLogFilterSerializer
)
from core.permissions import IsActiveUser, IsEditorOrAdmin, IsAdminUser
from users.models import User


class AuditLogPagination(PageNumberPagination):
    """Custom pagination for audit logs"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for AuditLog model.
    Provides read-only access to audit logs with filtering and statistics.
    """

    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsActiveUser, IsEditorOrAdmin]

    def get_queryset(self):
        """Apply filters based on query parameters"""
        queryset = AuditLog.objects.all()
        user = self.request.user

        # Role-based filtering
        if user.role == 'editor':
            # Editors can only see their own logs
            queryset = queryset.filter(user=user)

        # Apply filters from query params
        filter_serializer = AuditLogFilterSerializer(data=self.request.GET)
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data

            # Action filter
            if 'action' in filters:
                queryset = queryset.filter(action__in=filters['action'])

            # User filter (admin only)
            if 'user' in filters and user.role == 'admin':
                queryset = queryset.filter(user_id=filters['user'])

            # Table name filter
            if 'table_name' in filters:
                queryset = queryset.filter(table_name__icontains=filters['table_name'])

            # IP address filter
            if 'ip_address' in filters:
                queryset = queryset.filter(ip_address=filters['ip_address'])

            # Date range filter
            if 'date_from' in filters:
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            if 'date_to' in filters:
                queryset = queryset.filter(created_at__lte=filters['date_to'])

            # Search filter
            if 'search' in filters:
                search_term = filters['search']
                queryset = queryset.filter(
                    Q(description__icontains=search_term) |
                    Q(table_name__icontains=search_term) |
                    Q(user__email__icontains=search_term) |
                    Q(ip_address__icontains=search_term)
                )

            # Security relevant filter
            if 'is_security_relevant' in filters and filters['is_security_relevant']:
                security_actions = ['login_failed', 'permission_denied',
                                  'password_change', 'password_reset', 'delete']
                queryset = queryset.filter(action__in=security_actions)

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return AuditLogDetailSerializer
        return self.serializer_class

    @action(detail=False, methods=['get'], permission_classes=[IsActiveUser])
    def statistics(self, request):
        """
        Get audit log statistics
        """
        now = timezone.now()
        user = request.user

        # Base queryset
        queryset = self.get_queryset()

        # Calculate date ranges
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        # Total events (last 30 days)
        total_events = queryset.filter(created_at__gte=last_30d).count()

        # Active users (last 7 days)
        active_users = User.objects.filter(
            audit_logs__created_at__gte=last_7d
        ).distinct().count()

        # Security alerts (last 24 hours)
        security_actions = ['login_failed', 'permission_denied', 'delete']
        security_alerts = queryset.filter(
            created_at__gte=last_24h,
            action__in=security_actions
        ).count()

        # System health calculation
        error_count = queryset.filter(
            created_at__gte=last_24h,
            action__in=['login_failed', 'permission_denied']
        ).count()

        if error_count == 0:
            system_health = 'excellent'
        elif error_count < 10:
            system_health = 'good'
        elif error_count < 50:
            system_health = 'warning'
        else:
            system_health = 'critical'

        # Recent activities (last 10)
        recent_logs = queryset[:10]
        recent_activities = [
            {
                'id': log.id,
                'action': log.get_action_display(),
                'user': log.user_display_name,
                'table_name': log.table_name,
                'created_at': log.created_at,
                'is_security_relevant': log.is_security_relevant
            }
            for log in recent_logs
        ]

        # Activity by action type
        activity_by_action = dict(
            queryset.filter(created_at__gte=last_7d)
            .values('action')
            .annotate(count=Count('id'))
            .values_list('action', 'count')
        )

        # Activity by user (top 5)
        activity_by_user = list(
            queryset.filter(created_at__gte=last_7d)
            .values('user__email', 'user__first_name', 'user__last_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        # Activity timeline (hourly for last 24 hours)
        timeline_data = []
        for i in range(24):
            start_hour = now - timedelta(hours=i+1)
            end_hour = now - timedelta(hours=i)
            count = queryset.filter(
                created_at__gte=start_hour,
                created_at__lt=end_hour
            ).count()
            timeline_data.append({
                'hour': start_hour.strftime('%H:00'),
                'count': count
            })
        timeline_data.reverse()

        statistics = {
            'total_events': total_events,
            'active_users': active_users,
            'security_alerts': security_alerts,
            'system_health': system_health,
            'recent_activities': recent_activities,
            'activity_by_action': activity_by_action,
            'activity_by_user': activity_by_user,
            'activity_timeline': timeline_data
        }

        serializer = AuditLogStatisticsSerializer(statistics)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export(self, request):
        """
        Export audit logs to Excel/CSV
        """
        # This would be implemented with a library like xlsxwriter or csv
        # For now, return a placeholder response
        return Response({
            'message': 'Export functionality will be implemented',
            'formats': ['xlsx', 'csv', 'pdf']
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def cleanup(self, request):
        """
        Clean up old audit logs
        """
        days = request.data.get('days', 365)
        if not isinstance(days, int) or days < 30:
            return Response(
                {'error': 'Days must be an integer >= 30'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count = AuditLog.cleanup_old_logs(days)

        # Log the cleanup action
        AuditLog.log_action(
            user=request.user,
            action='other',
            table_name='audit_logs',
            description=f'Cleaned up {deleted_count} audit logs older than {days} days',
            request=request
        )

        return Response({
            'message': f'Successfully deleted {deleted_count} old audit logs',
            'deleted_count': deleted_count
        })
