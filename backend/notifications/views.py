"""
Views for Notifications API
"""

import json
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction, models
from django.db.models import Q, Count, Avg, Max, Min, F
from django.conf import settings
from django.http import JsonResponse
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import EmailTemplate, EmailNotification, NotificationPreference, Notification
from .serializers import (
    EmailTemplateSerializer, EmailTemplateListSerializer,
    EmailNotificationSerializer, EmailNotificationListSerializer,
    NotificationPreferenceSerializer, NotificationPreferenceUpdateSerializer,
    BulkNotificationPreferenceSerializer, EmailTemplateTestSerializer,
    EmailTemplatePreviewSerializer, EmailTemplateImportSerializer,
    NotificationStatisticsSerializer, NotificationSendSerializer,
    BulkNotificationSendSerializer, NotificationHealthSerializer,
    NotificationQueueSerializer, NotificationSerializer, NotificationListSerializer,
    NotificationMarkReadSerializer, NotificationCreateSerializer
)
from core.permissions import IsAdminUser, IsEditorOrAdmin, IsActiveUser
from core.utils import log_user_action, send_notification_email
from core.pagination import StandardPagination
from core.throttling import NotificationThrottle, BulkOperationThrottle


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing email templates
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['language', 'is_active']
    search_fields = ['name', 'subject']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EmailTemplateListSerializer
        return EmailTemplateSerializer
    
    def perform_create(self, serializer):
        """Save template with creator info"""
        template = serializer.save()
        log_user_action(
            user=self.request.user,
            action='create_email_template',
            resource_type='EmailTemplate',
            resource_id=template.id,
            metadata={'template_name': template.name}
        )
    
    def perform_update(self, serializer):
        """Update template with editor info"""
        template = serializer.save()
        log_user_action(
            user=self.request.user,
            action='update_email_template',
            resource_type='EmailTemplate',
            resource_id=template.id,
            metadata={'template_name': template.name}
        )
    
    def perform_destroy(self, instance):
        """Log template deletion"""
        log_user_action(
            user=self.request.user,
            action='delete_email_template',
            resource_type='EmailTemplate',
            resource_id=instance.id,
            metadata={'template_name': instance.name}
        )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def test_template(self, request, pk=None):
        """
        Test email template by sending to specified email
        """
        template = self.get_object()
        serializer = EmailTemplateTestSerializer(data=request.data)
        
        if serializer.is_valid():
            recipient_email = serializer.validated_data['recipient_email']
            test_variables = serializer.validated_data.get('test_variables', {})
            
            try:
                # Render template with test variables
                rendered = template.render(test_variables)
                
                # Send test email
                success = send_notification_email(
                    recipient_email=recipient_email,
                    subject=f"[TEST] {rendered['subject']}",
                    html_content=rendered['html_body'],
                    text_content=rendered['text_body']
                )
                
                if success:
                    log_user_action(
                        user=request.user,
                        action='test_email_template',
                        resource_type='EmailTemplate',
                        resource_id=template.id,
                        metadata={
                            'template_name': template.name,
                            'recipient_email': recipient_email
                        }
                    )
                    return Response({
                        'message': 'Test email sent successfully',
                        'recipient_email': recipient_email
                    })
                else:
                    return Response(
                        {'error': 'Failed to send test email'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
            except Exception as e:
                return Response(
                    {'error': f'Template rendering failed: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """
        Preview rendered email template
        """
        template = self.get_object()
        serializer = EmailTemplatePreviewSerializer(data=request.data)
        
        if serializer.is_valid():
            variables = serializer.validated_data.get('variables', {})
            
            try:
                rendered = template.render(variables)
                return Response({
                    'subject': rendered['subject'],
                    'html_body': rendered['html_body'],
                    'text_body': rendered['text_body'],
                    'variables_used': variables
                })
            except Exception as e:
                return Response(
                    {'error': f'Template rendering failed: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def import_templates(self, request):
        """
        Import multiple email templates
        """
        serializer = EmailTemplateImportSerializer(data=request.data)
        
        if serializer.is_valid():
            templates_data = serializer.validated_data['templates']
            overwrite_existing = serializer.validated_data.get('overwrite_existing', False)
            
            imported_count = 0
            skipped_count = 0
            errors = []
            
            with transaction.atomic():
                for template_data in templates_data:
                    try:
                        name = template_data['name']
                        language = template_data.get('language', 'en')
                        
                        # Check if template exists
                        existing = EmailTemplate.objects.filter(
                            name=name, language=language
                        ).first()
                        
                        if existing and not overwrite_existing:
                            skipped_count += 1
                            continue
                        
                        # Set creator
                        template_data['created_by'] = request.user.id
                        template_data['updated_by'] = request.user.id
                        
                        if existing and overwrite_existing:
                            # Update existing template
                            template_serializer = EmailTemplateSerializer(
                                existing, data=template_data, context={'request': request}
                            )
                        else:
                            # Create new template
                            template_serializer = EmailTemplateSerializer(
                                data=template_data, context={'request': request}
                            )
                        
                        if template_serializer.is_valid():
                            template_serializer.save()
                            imported_count += 1
                        else:
                            errors.append({
                                'template_name': name,
                                'errors': template_serializer.errors
                            })
                    
                    except Exception as e:
                        errors.append({
                            'template_name': template_data.get('name', 'Unknown'),
                            'errors': str(e)
                        })
            
            log_user_action(
                user=request.user,
                action='import_email_templates',
                resource_type='EmailTemplate',
                metadata={
                    'imported_count': imported_count,
                    'skipped_count': skipped_count,
                    'error_count': len(errors)
                }
            )
            
            return Response({
                'imported_count': imported_count,
                'skipped_count': skipped_count,
                'errors': errors
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export_templates(self, request):
        """
        Export all email templates
        """
        templates = EmailTemplate.objects.filter(is_active=True)
        serializer = EmailTemplateSerializer(templates, many=True)
        
        return Response({
            'templates': serializer.data,
            'export_date': timezone.now().isoformat(),
            'total_templates': len(serializer.data)
        })


class EmailNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing email notifications (read-only)
    """
    queryset = EmailNotification.objects.all()
    serializer_class = EmailNotificationSerializer
    permission_classes = [IsEditorOrAdmin]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'template_name', 'user']
    search_fields = ['recipient_email', 'subject', 'template_name']
    ordering_fields = ['created_at', 'sent_at', 'retry_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EmailNotificationListSerializer
        return EmailNotificationSerializer
    
    def get_queryset(self):
        """Filter notifications based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            return queryset
        elif user.role == 'editor':
            # Editors can see notifications for their transactions
            return queryset.filter(
                Q(user=user) | 
                Q(transaction__assigned_to=user) |
                Q(transaction__created_by=user)
            )
        else:
            # Clients can only see their own notifications
            return queryset.filter(user=user)
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """
        Retry failed notification
        """
        notification = self.get_object()
        
        if not notification.can_retry:
            return Response(
                {'error': 'Notification cannot be retried'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset notification for retry
        notification.status = 'pending'
        notification.error_message = ''
        notification.next_retry_at = timezone.now()
        notification.save()
        
        log_user_action(
            user=request.user,
            action='retry_notification',
            resource_type='EmailNotification',
            resource_id=notification.id,
            metadata={'template_name': notification.template_name}
        )
        
        return Response({'message': 'Notification queued for retry'})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get notification statistics
        """
        queryset = self.get_queryset()
        
        # Basic counts
        total_notifications = queryset.count()
        notifications_by_status = dict(
            queryset.values('status').annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        
        # Template usage
        notifications_by_template = dict(
            queryset.values('template_name').annotate(count=Count('id'))
            .order_by('-count')[:10].values_list('template_name', 'count')
        )
        
        # Success rate
        sent_count = notifications_by_status.get('sent', 0)
        delivery_success_rate = (sent_count / total_notifications * 100) if total_notifications > 0 else 0
        
        # Average delivery time (for sent notifications)
        sent_notifications = queryset.filter(status='sent', sent_at__isnull=False)
        avg_delivery_time = 0
        if sent_notifications.exists():
            # Calculate average time from creation to sending (in minutes)
            delivery_times = []
            for notif in sent_notifications:
                if notif.sent_at:
                    delta = notif.sent_at - notif.created_at
                    delivery_times.append(delta.total_seconds() / 60)
            avg_delivery_time = sum(delivery_times) / len(delivery_times) if delivery_times else 0
        
        # Recent activity (last 24 hours)
        recent_cutoff = timezone.now() - timedelta(hours=24)
        recent_activity = list(
            queryset.filter(created_at__gte=recent_cutoff)
            .values('template_name', 'status', 'created_at')
            .order_by('-created_at')[:10]
        )
        
        # Top templates
        top_templates = list(
            queryset.values('template_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        
        # Error analysis
        failed_notifications = queryset.filter(status='failed')
        error_analysis = {}
        if failed_notifications.exists():
            error_types = {}
            for notif in failed_notifications:
                error_key = notif.error_message[:50] if notif.error_message else 'Unknown error'
                error_types[error_key] = error_types.get(error_key, 0) + 1
            error_analysis = dict(list(error_types.items())[:10])
        
        data = {
            'total_notifications': total_notifications,
            'notifications_by_status': notifications_by_status,
            'notifications_by_template': notifications_by_template,
            'delivery_success_rate': round(delivery_success_rate, 2),
            'avg_delivery_time': round(avg_delivery_time, 2),
            'failed_notifications': notifications_by_status.get('failed', 0),
            'retry_notifications': queryset.filter(
                status='failed', retry_count__lt=F('max_retries')
            ).count(),
            'recent_activity': recent_activity,
            'top_templates': top_templates,
            'error_analysis': error_analysis
        }
        
        serializer = NotificationStatisticsSerializer(data)
        return Response(serializer.data)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences
    """
    queryset = NotificationPreference.objects.all()
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification_type', 'email_enabled', 'in_app_enabled']
    
    def get_queryset(self):
        """Filter preferences to user's own preferences"""
        return self.queryset.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return NotificationPreferenceUpdateSerializer
        return NotificationPreferenceSerializer
    
    def perform_create(self, serializer):
        """Save preference with user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update notification preferences
        """
        serializer = BulkNotificationPreferenceSerializer(data=request.data)
        
        if serializer.is_valid():
            preferences_data = serializer.validated_data['preferences']
            user = request.user
            
            updated_count = 0
            created_count = 0
            
            with transaction.atomic():
                for pref_data in preferences_data:
                    notification_type = pref_data['notification_type']
                    
                    # Get or create preference
                    preference, created = NotificationPreference.objects.get_or_create(
                        user=user,
                        notification_type=notification_type,
                        defaults={
                            'email_enabled': pref_data.get('email_enabled', True),
                            'in_app_enabled': pref_data.get('in_app_enabled', True)
                        }
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        # Update existing preference
                        preference.email_enabled = pref_data.get('email_enabled', preference.email_enabled)
                        preference.in_app_enabled = pref_data.get('in_app_enabled', preference.in_app_enabled)
                        preference.save()
                        updated_count += 1
            
            log_user_action(
                user=request.user,
                action='bulk_update_notification_preferences',
                resource_type='NotificationPreference',
                metadata={
                    'updated_count': updated_count,
                    'created_count': created_count
                }
            )
            
            return Response({
                'message': 'Preferences updated successfully',
                'updated_count': updated_count,
                'created_count': created_count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """
        Reset all preferences to defaults
        """
        user = request.user
        
        # Delete existing preferences
        NotificationPreference.objects.filter(user=user).delete()
        
        # Create default preferences
        NotificationPreference.create_defaults_for_user(user)
        
        log_user_action(
            user=request.user,
            action='reset_notification_preferences',
            resource_type='NotificationPreference'
        )
        
        return Response({'message': 'Preferences reset to defaults'})


class NotificationSendView(APIView):
    """
    Send individual notification
    """
    permission_classes = [IsEditorOrAdmin]
    throttle_classes = [NotificationThrottle]
    
    def post(self, request):
        """Send notification to specified recipient"""
        serializer = NotificationSendSerializer(data=request.data)
        
        if serializer.is_valid():
            template_name = serializer.validated_data['template_name']
            recipient_email = serializer.validated_data['recipient_email']
            variables = serializer.validated_data.get('variables', {})
            language = serializer.validated_data.get('language', 'en')
            user_id = serializer.validated_data.get('user_id')
            transaction_id = serializer.validated_data.get('transaction_id')
            
            try:
                # Get user and transaction objects if provided
                user = None
                transaction_obj = None
                
                if user_id:
                    from users.models import User
                    user = User.objects.get(id=user_id)
                
                if transaction_id:
                    from transactions.models import Transaction
                    transaction_obj = Transaction.objects.get(id=transaction_id)
                
                # Create notification
                notification = EmailNotification.create_from_template(
                    template_name=template_name,
                    recipient_email=recipient_email,
                    context=variables,
                    user=user,
                    transaction=transaction_obj,
                    language=language
                )
                
                log_user_action(
                    user=request.user,
                    action='send_notification',
                    resource_type='EmailNotification',
                    resource_id=notification.id,
                    metadata={
                        'template_name': template_name,
                        'recipient_email': recipient_email
                    }
                )
                
                return Response({
                    'message': 'Notification queued successfully',
                    'notification_id': notification.id
                })
                
            except Exception as e:
                return Response(
                    {'error': f'Failed to create notification: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkNotificationSendView(APIView):
    """
    Send bulk notifications
    """
    permission_classes = [IsAdminUser]
    throttle_classes = [BulkOperationThrottle]
    
    def post(self, request):
        """Send notifications to multiple recipients"""
        serializer = BulkNotificationSendSerializer(data=request.data)
        
        if serializer.is_valid():
            template_name = serializer.validated_data['template_name']
            recipient_emails = serializer.validated_data['recipient_emails']
            variables = serializer.validated_data.get('variables', {})
            language = serializer.validated_data.get('language', 'en')
            
            created_notifications = []
            errors = []
            
            with transaction.atomic():
                for email in recipient_emails:
                    try:
                        notification = EmailNotification.create_from_template(
                            template_name=template_name,
                            recipient_email=email,
                            context=variables,
                            language=language
                        )
                        created_notifications.append(notification.id)
                    
                    except Exception as e:
                        errors.append({
                            'email': email,
                            'error': str(e)
                        })
            
            log_user_action(
                user=request.user,
                action='send_bulk_notifications',
                resource_type='EmailNotification',
                metadata={
                    'template_name': template_name,
                    'recipient_count': len(recipient_emails),
                    'success_count': len(created_notifications),
                    'error_count': len(errors)
                }
            )
            
            return Response({
                'message': 'Bulk notifications processed',
                'created_count': len(created_notifications),
                'error_count': len(errors),
                'errors': errors,
                'notification_ids': created_notifications
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationHealthView(APIView):
    """
    Get notification system health status
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Return notification system health metrics"""
        # Get counts
        pending_notifications = EmailNotification.objects.filter(status='pending').count()
        failed_notifications = EmailNotification.objects.filter(status='failed').count()
        retry_queue_length = EmailNotification.objects.filter(
            status='failed',
            retry_count__lt=F('max_retries'),
            next_retry_at__lte=timezone.now()
        ).count()
        
        # Get last successful send
        last_successful = EmailNotification.objects.filter(
            status='sent'
        ).aggregate(last_sent=Max('sent_at'))['last_sent']
        
        # Calculate error rate (last 24 hours)
        last_24h = timezone.now() - timedelta(hours=24)
        recent_total = EmailNotification.objects.filter(created_at__gte=last_24h).count()
        recent_failed = EmailNotification.objects.filter(
            created_at__gte=last_24h, status='failed'
        ).count()
        error_rate = (recent_failed / recent_total * 100) if recent_total > 0 else 0
        
        # Template counts
        template_count = EmailTemplate.objects.count()
        active_template_count = EmailTemplate.objects.filter(is_active=True).count()
        
        # Determine overall status
        if failed_notifications > 100 or error_rate > 20:
            overall_status = 'error'
        elif failed_notifications > 50 or error_rate > 10 or pending_notifications > 200:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        # Health checks
        health_checks = {
            'database_connection': 'healthy',
            'email_service': 'healthy' if last_successful else 'unknown',
            'template_availability': 'healthy' if active_template_count > 0 else 'error',
            'queue_processing': 'healthy' if pending_notifications < 100 else 'warning'
        }
        
        # Generate alerts
        alerts = []
        if failed_notifications > 50:
            alerts.append(f"High number of failed notifications: {failed_notifications}")
        if error_rate > 15:
            alerts.append(f"High error rate: {error_rate:.1f}%")
        if pending_notifications > 200:
            alerts.append(f"Large pending queue: {pending_notifications}")
        if active_template_count == 0:
            alerts.append("No active email templates found")
        
        data = {
            'status': overall_status,
            'pending_notifications': pending_notifications,
            'failed_notifications': failed_notifications,
            'retry_queue_length': retry_queue_length,
            'last_successful_send': last_successful,
            'error_rate': round(error_rate, 2),
            'template_count': template_count,
            'active_template_count': active_template_count,
            'health_checks': health_checks,
            'alerts': alerts
        }
        
        serializer = NotificationHealthSerializer(data)
        return Response(serializer.data)


class NotificationQueueView(APIView):
    """
    Get notification queue status
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Return notification queue status and metrics"""
        # Queue counts
        pending_count = EmailNotification.objects.filter(status='pending').count()
        retry_count = EmailNotification.objects.filter(
            status='failed',
            retry_count__lt=F('max_retries')
        ).count()
        failed_count = EmailNotification.objects.filter(status='failed').count()
        
        # Oldest pending notification
        oldest_pending = EmailNotification.objects.filter(
            status='pending'
        ).aggregate(oldest=Min('created_at'))['oldest']
        
        # Recent queue items (sample)
        queue_items = list(
            EmailNotification.objects.filter(
                status__in=['pending', 'failed']
            ).values(
                'id', 'template_name', 'recipient_email', 'status', 
                'created_at', 'retry_count', 'next_retry_at'
            ).order_by('created_at')[:20]
        )
        
        # Calculate processing metrics (last 24 hours)
        last_24h = timezone.now() - timedelta(hours=24)
        processed_24h = EmailNotification.objects.filter(
            sent_at__gte=last_24h
        ).count()
        processing_rate = processed_24h / 24.0  # per hour
        
        # Average processing time
        recent_sent = EmailNotification.objects.filter(
            status='sent',
            sent_at__gte=last_24h
        )
        
        avg_processing_time = 0
        if recent_sent.exists():
            total_seconds = sum(
                (notif.sent_at - notif.created_at).total_seconds() 
                for notif in recent_sent
            )
            avg_processing_time = total_seconds / recent_sent.count() / 60  # in minutes
        
        data = {
            'pending_count': pending_count,
            'retry_count': retry_count,
            'failed_count': failed_count,
            'oldest_pending': oldest_pending,
            'queue_items': queue_items,
            'processing_rate': round(processing_rate, 2),
            'avg_processing_time': round(avg_processing_time, 2)
        }
        
        serializer = NotificationQueueSerializer(data)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for in-app notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsActiveUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'category', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return notifications for current user only"""
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return NotificationListSerializer
        elif self.action == 'create':
            return NotificationCreateSerializer
        elif self.action == 'mark_read':
            return NotificationMarkReadSerializer
        return NotificationSerializer
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark notifications as read"""
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data.get('notification_ids')
        
        if notification_ids:
            # Mark specific notifications as read
            notifications = Notification.objects.filter(
                user=request.user,
                id__in=notification_ids,
                is_read=False
            )
            for notification in notifications:
                notification.mark_as_read()
            
            return Response({
                'message': f'{notifications.count()} notifications marked as read'
            })
        else:
            # Mark all as read
            Notification.mark_all_as_read(request.user)
            return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        Notification.mark_all_as_read(request.user)
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all notifications for current user"""
        count = Notification.objects.filter(user=request.user).count()
        Notification.clear_all(request.user)
        return Response({'message': f'{count} notifications cleared'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notifications count"""
        count = Notification.get_unread_count(request.user)
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """Get notifications grouped by time periods"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        
        notifications = self.get_queryset()
        
        # Create groups with notifications
        groups = []
        
        # Today's notifications
        today_notifications = notifications.filter(created_at__gte=today)
        if today_notifications.exists():
            groups.append({
                'label': 'Today',
                'notifications': NotificationListSerializer(today_notifications, many=True).data
            })
        
        # Yesterday's notifications
        yesterday_notifications = notifications.filter(
            created_at__gte=yesterday,
            created_at__lt=today
        )
        if yesterday_notifications.exists():
            groups.append({
                'label': 'Yesterday',
                'notifications': NotificationListSerializer(yesterday_notifications, many=True).data
            })
        
        # This week's notifications
        week_notifications = notifications.filter(
            created_at__gte=week_ago,
            created_at__lt=yesterday
        )
        if week_notifications.exists():
            groups.append({
                'label': 'This Week',
                'notifications': NotificationListSerializer(week_notifications, many=True).data
            })
        
        # Older notifications
        older_notifications = notifications.filter(created_at__lt=week_ago)
        if older_notifications.exists():
            groups.append({
                'label': 'Older',
                'notifications': NotificationListSerializer(older_notifications, many=True).data
            })
        
        return Response({'groups': groups})
    
    def perform_destroy(self, instance):
        """Log notification deletion"""
        log_user_action(
            user=self.request.user,
            action='delete_notification',
            resource_type='Notification',
            resource_id=instance.id,
            metadata={'notification_title': instance.title}
        )
        instance.delete()
