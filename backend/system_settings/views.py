"""
Views for System Settings API
"""

import os
import sys
import platform
import psutil
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction, connection
from django.db.models import Q, Count, Avg, Max, Min
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.core.cache import cache
from django.core.management import call_command
from django.core.exceptions import ValidationError
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import SystemSetting, SystemMaintenanceMode, SystemConfiguration, SystemLog
from .serializers import (
    SystemSettingSerializer, SystemSettingListSerializer, SystemSettingUpdateSerializer,
    BulkSystemSettingUpdateSerializer, SystemMaintenanceModeSerializer,
    SystemMaintenanceModeUpdateSerializer, SystemConfigurationSerializer,
    SystemConfigurationListSerializer, SystemLogSerializer, SystemLogListSerializer,
    SystemHealthSerializer, SystemStatusSerializer, SystemBackupSerializer,
    SystemRestoreSerializer, SettingsCategorySerializer, SystemInfoSerializer,
    SystemValidationSerializer
)
from core.permissions import IsAdminUser, IsEditorOrAdmin, IsActiveUser
from core.utils import log_user_action, get_client_ip
from core.pagination import StandardPagination
from core.throttling import BulkOperationThrottle, AdminThrottle
import django


class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing system settings
    """
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'setting_type', 'is_editable', 'is_required', 'is_sensitive']
    search_fields = ['key', 'name', 'description']
    ordering_fields = ['key', 'name', 'category', 'created_at', 'updated_at']
    ordering = ['category', 'key']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return SystemSettingListSerializer
        elif self.action in ['update', 'partial_update']:
            return SystemSettingUpdateSerializer
        return SystemSettingSerializer
    
    def perform_create(self, serializer):
        """Save setting with creator info"""
        setting = serializer.save(updated_by=self.request.user)
        
        log_user_action(
            user=self.request.user,
            action='create_system_setting',
            resource_type='SystemSetting',
            resource_id=setting.id,
            metadata={'setting_key': setting.key}
        )
    
    def perform_update(self, serializer):
        """Update setting with editor info"""
        original_value = self.get_object().value
        setting = serializer.save(updated_by=self.request.user)
        
        log_user_action(
            user=self.request.user,
            action='update_system_setting',
            resource_type='SystemSetting',
            resource_id=setting.id,
            metadata={
                'setting_key': setting.key,
                'old_value': original_value,
                'new_value': setting.value
            }
        )
    
    def perform_destroy(self, instance):
        """Log setting deletion"""
        log_user_action(
            user=self.request.user,
            action='delete_system_setting',
            resource_type='SystemSetting',
            resource_id=instance.id,
            metadata={'setting_key': instance.key}
        )
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update system settings
        """
        serializer = BulkSystemSettingUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            settings_data = serializer.validated_data['settings']
            updated_settings = []
            
            with transaction.atomic():
                for key, value in settings_data.items():
                    try:
                        setting = SystemSetting.objects.get(key=key, is_editable=True)
                        original_value = setting.value
                        setting.value = value
                        setting.updated_by = request.user
                        setting.save()
                        
                        updated_settings.append({
                            'key': key,
                            'old_value': original_value,
                            'new_value': value
                        })
                    
                    except SystemSetting.DoesNotExist:
                        continue
            
            log_user_action(
                user=request.user,
                action='bulk_update_system_settings',
                resource_type='SystemSetting',
                metadata={
                    'updated_count': len(updated_settings),
                    'settings': updated_settings
                }
            )
            
            return Response({
                'message': 'Settings updated successfully',
                'updated_count': len(updated_settings),
                'updated_settings': updated_settings
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Get settings grouped by category
        """
        categories = SystemSetting.objects.values('category').distinct()
        result = []
        
        for cat in categories:
            category_key = cat['category']
            settings = SystemSetting.objects.filter(category=category_key)
            
            # Apply filtering if requested
            if not request.user.is_superuser:
                settings = settings.filter(is_editable=True)
            
            category_data = {
                'category': category_key,
                'category_display': dict(SystemSetting.CATEGORY_CHOICES).get(category_key, category_key),
                'settings': SystemSettingListSerializer(settings, many=True).data,
                'editable_count': settings.filter(is_editable=True).count(),
                'total_count': settings.count()
            }
            result.append(category_data)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """
        Reset settings to their default values
        """
        category = request.data.get('category')
        setting_keys = request.data.get('setting_keys', [])
        
        if category:
            settings_to_reset = SystemSetting.objects.filter(
                category=category, is_editable=True
            )
        elif setting_keys:
            settings_to_reset = SystemSetting.objects.filter(
                key__in=setting_keys, is_editable=True
            )
        else:
            return Response(
                {'error': 'Either category or setting_keys must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reset_count = 0
        reset_settings = []
        
        with transaction.atomic():
            for setting in settings_to_reset:
                if setting.default_value:
                    old_value = setting.value
                    setting.value = setting.default_value
                    setting.updated_by = request.user
                    setting.save()
                    
                    reset_settings.append({
                        'key': setting.key,
                        'old_value': old_value,
                        'new_value': setting.value
                    })
                    reset_count += 1
        
        log_user_action(
            user=request.user,
            action='reset_system_settings',
            resource_type='SystemSetting',
            metadata={
                'reset_count': reset_count,
                'category': category,
                'settings': reset_settings
            }
        )
        
        return Response({
            'message': f'Reset {reset_count} settings to defaults',
            'reset_count': reset_count,
            'reset_settings': reset_settings
        })


class SystemMaintenanceModeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing system maintenance mode
    """
    queryset = SystemMaintenanceMode.objects.all()
    serializer_class = SystemMaintenanceModeSerializer
    permission_classes = [IsAdminUser]
    ordering = ['-updated_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['update', 'partial_update', 'create']:
            return SystemMaintenanceModeUpdateSerializer
        return SystemMaintenanceModeSerializer
    
    def perform_create(self, serializer):
        """Save maintenance mode with creator info"""
        maintenance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        
        log_user_action(
            user=self.request.user,
            action='create_maintenance_mode',
            resource_type='SystemMaintenanceMode',
            resource_id=maintenance.id,
            metadata={'is_enabled': maintenance.is_enabled}
        )
    
    def perform_update(self, serializer):
        """Update maintenance mode with editor info"""
        old_status = self.get_object().is_enabled
        maintenance = serializer.save(updated_by=self.request.user)
        
        log_user_action(
            user=self.request.user,
            action='update_maintenance_mode',
            resource_type='SystemMaintenanceMode',
            resource_id=maintenance.id,
            metadata={
                'old_status': old_status,
                'new_status': maintenance.is_enabled
            }
        )
    
    @action(detail=False, methods=['get'])
    def current_status(self, request):
        """
        Get current maintenance mode status
        """
        is_active = SystemMaintenanceMode.is_maintenance_active()
        message = SystemMaintenanceMode.get_maintenance_message()
        
        try:
            current_mode = SystemMaintenanceMode.objects.latest('updated_at')
            serializer = SystemMaintenanceModeSerializer(current_mode)
            return Response({
                'is_active': is_active,
                'message': message,
                'maintenance_mode': serializer.data
            })
        except SystemMaintenanceMode.DoesNotExist:
            return Response({
                'is_active': False,
                'message': 'No maintenance mode configured',
                'maintenance_mode': None
            })
    
    @action(detail=False, methods=['post'])
    def enable(self, request):
        """
        Enable maintenance mode quickly
        """
        message = request.data.get('message', 'System is under maintenance')
        message_ar = request.data.get('message_ar', '')
        
        # Create or update latest maintenance mode
        try:
            maintenance = SystemMaintenanceMode.objects.latest('updated_at')
        except SystemMaintenanceMode.DoesNotExist:
            maintenance = SystemMaintenanceMode()
        
        maintenance.is_enabled = True
        maintenance.message = message
        if message_ar:
            maintenance.message_ar = message_ar
        maintenance.updated_by = request.user
        
        if not maintenance.pk:
            maintenance.created_by = request.user
        
        maintenance.save()
        
        log_user_action(
            user=request.user,
            action='enable_maintenance_mode',
            resource_type='SystemMaintenanceMode',
            resource_id=maintenance.id
        )
        
        return Response({
            'message': 'Maintenance mode enabled',
            'maintenance_mode': SystemMaintenanceModeSerializer(maintenance).data
        })
    
    @action(detail=False, methods=['post'])
    def disable(self, request):
        """
        Disable maintenance mode quickly
        """
        try:
            maintenance = SystemMaintenanceMode.objects.latest('updated_at')
            maintenance.is_enabled = False
            maintenance.updated_by = request.user
            maintenance.save()
            
            log_user_action(
                user=request.user,
                action='disable_maintenance_mode',
                resource_type='SystemMaintenanceMode',
                resource_id=maintenance.id
            )
            
            return Response({
                'message': 'Maintenance mode disabled',
                'maintenance_mode': SystemMaintenanceModeSerializer(maintenance).data
            })
            
        except SystemMaintenanceMode.DoesNotExist:
            return Response(
                {'error': 'No maintenance mode configuration found'},
                status=status.HTTP_404_NOT_FOUND
            )


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing system configurations
    """
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['environment', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'environment', 'created_at', 'updated_at']
    ordering = ['environment', 'name']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return SystemConfigurationListSerializer
        return SystemConfigurationSerializer
    
    def perform_create(self, serializer):
        """Save configuration with creator info"""
        config = serializer.save(created_by=self.request.user)
        
        log_user_action(
            user=self.request.user,
            action='create_system_configuration',
            resource_type='SystemConfiguration',
            resource_id=config.id,
            metadata={'config_name': config.name, 'environment': config.environment}
        )
    
    def perform_update(self, serializer):
        """Update configuration"""
        config = serializer.save()
        
        log_user_action(
            user=self.request.user,
            action='update_system_configuration',
            resource_type='SystemConfiguration',
            resource_id=config.id,
            metadata={'config_name': config.name, 'environment': config.environment}
        )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a configuration
        """
        config = self.get_object()
        config.activate()
        
        log_user_action(
            user=request.user,
            action='activate_system_configuration',
            resource_type='SystemConfiguration',
            resource_id=config.id,
            metadata={'config_name': config.name, 'environment': config.environment}
        )
        
        return Response({
            'message': f'Configuration "{config.name}" activated for {config.environment}',
            'configuration': SystemConfigurationSerializer(config).data
        })


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing system logs (read-only)
    """
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['level', 'category', 'user']
    search_fields = ['message', 'user__username', 'ip_address']
    ordering_fields = ['created_at', 'level', 'category']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return SystemLogListSerializer
        return SystemLogSerializer
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get system log statistics
        """
        queryset = self.get_queryset()
        
        # Basic counts
        total_logs = queryset.count()
        logs_by_level = dict(
            queryset.values('level').annotate(count=Count('id'))
            .values_list('level', 'count')
        )
        logs_by_category = dict(
            queryset.values('category').annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        
        # Recent activity (last 24 hours)
        recent_cutoff = timezone.now() - timedelta(hours=24)
        recent_logs = queryset.filter(created_at__gte=recent_cutoff).count()
        
        # Error trends (last 7 days)
        error_trend = []
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            
            error_count = queryset.filter(
                level__in=['error', 'critical'],
                created_at__gte=start_date,
                created_at__lt=end_date
            ).count()
            
            error_trend.append({
                'date': start_date.date(),
                'error_count': error_count
            })
        
        return Response({
            'total_logs': total_logs,
            'logs_by_level': logs_by_level,
            'logs_by_category': logs_by_category,
            'recent_logs_24h': recent_logs,
            'error_trend_7d': error_trend
        })


class SystemHealthView(APIView):
    """
    Get system health status
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Return comprehensive system health metrics"""
        health_data = self._collect_health_metrics()
        serializer = SystemHealthSerializer(health_data)
        return Response(serializer.data)
    
    def _collect_health_metrics(self):
        """Collect all health metrics"""
        # Database health
        db_status, db_response_time = self._check_database_health()
        
        # Cache health
        cache_status, cache_hit_rate = self._check_cache_health()
        
        # Storage health
        storage_status, storage_usage = self._check_storage_health()
        
        # Email service health
        email_status, last_email = self._check_email_service_health()
        
        # System resources
        memory_usage = self._get_memory_usage()
        cpu_usage = self._get_cpu_usage()
        disk_usage = self._get_disk_usage()
        
        # Application metrics
        active_connections = self._get_active_connections()
        active_users = self._get_active_users()
        error_rate = self._get_error_rate()
        avg_response_time = self._get_avg_response_time()
        
        # Recent errors
        recent_errors = self._get_recent_errors()
        
        # Generate alerts and warnings
        alerts, warnings = self._generate_alerts({
            'db_response_time': db_response_time,
            'memory_usage': memory_usage.get('percent', 0),
            'cpu_usage': cpu_usage,
            'disk_usage': disk_usage.get('percent', 0),
            'error_rate': error_rate,
        })
        
        # Determine overall status
        overall_status = 'healthy'
        if alerts:
            overall_status = 'error'
        elif warnings:
            overall_status = 'warning'
        
        # Calculate uptime (since last restart)
        uptime = self._get_uptime()
        
        return {
            'overall_status': overall_status,
            'uptime': uptime,
            'database_status': db_status,
            'database_response_time': db_response_time,
            'cache_status': cache_status,
            'cache_hit_rate': cache_hit_rate,
            'storage_status': storage_status,
            'storage_usage': storage_usage,
            'email_service_status': email_status,
            'last_email_sent': last_email,
            'memory_usage': memory_usage,
            'cpu_usage': cpu_usage,
            'disk_usage': disk_usage,
            'active_connections': active_connections,
            'active_users': active_users,
            'error_rate': error_rate,
            'avg_response_time': avg_response_time,
            'recent_errors': recent_errors,
            'alerts': alerts,
            'warnings': warnings,
            'last_updated': timezone.now()
        }
    
    def _check_database_health(self):
        """Check database connectivity and performance"""
        try:
            start_time = timezone.now()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            end_time = timezone.now()
            
            response_time = (end_time - start_time).total_seconds() * 1000  # ms
            return 'healthy', response_time
        except Exception:
            return 'error', 0
    
    def _check_cache_health(self):
        """Check cache connectivity and hit rate"""
        try:
            # Test cache connectivity
            cache.set('health_check', 'test', 30)
            result = cache.get('health_check')
            
            if result == 'test':
                # Try to get hit rate (this is implementation-specific)
                hit_rate = 75.0  # Placeholder
                return 'healthy', hit_rate
            else:
                return 'error', 0.0
        except Exception:
            return 'error', 0.0
    
    def _check_storage_health(self):
        """Check storage usage"""
        try:
            media_root = getattr(settings, 'MEDIA_ROOT', '/tmp')
            static_root = getattr(settings, 'STATIC_ROOT', '/tmp')
            
            def get_directory_size(path):
                total_size = 0
                if os.path.exists(path):
                    for dirpath, dirnames, filenames in os.walk(path):
                        for file in filenames:
                            fp = os.path.join(dirpath, file)
                            if os.path.exists(fp):
                                total_size += os.path.getsize(fp)
                return total_size
            
            media_size = get_directory_size(media_root)
            static_size = get_directory_size(static_root)
            
            usage = {
                'media_size': media_size,
                'static_size': static_size,
                'total_size': media_size + static_size,
                'media_path': media_root,
                'static_path': static_root
            }
            
            return 'healthy', usage
        except Exception:
            return 'error', {}
    
    def _check_email_service_health(self):
        """Check email service status"""
        try:
            # Check last successful email from notifications
            from notifications.models import EmailNotification
            last_sent = EmailNotification.objects.filter(
                status='sent'
            ).aggregate(last_sent=Max('sent_at'))['last_sent']
            
            return 'healthy', last_sent
        except Exception:
            return 'unknown', None
    
    def _get_memory_usage(self):
        """Get system memory usage"""
        try:
            memory = psutil.virtual_memory()
            return {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'percent': memory.percent
            }
        except Exception:
            return {'percent': 0}
    
    def _get_cpu_usage(self):
        """Get CPU usage percentage"""
        try:
            return psutil.cpu_percent(interval=1)
        except Exception:
            return 0.0
    
    def _get_disk_usage(self):
        """Get disk usage"""
        try:
            disk = psutil.disk_usage('/')
            return {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': (disk.used / disk.total) * 100
            }
        except Exception:
            return {'percent': 0}
    
    def _get_active_connections(self):
        """Get active database connections"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM pg_stat_activity")
                return cursor.fetchone()[0]
        except Exception:
            return 0
    
    def _get_active_users(self):
        """Get count of active users (last 24h)"""
        try:
            from users.models import User
            last_24h = timezone.now() - timedelta(hours=24)
            return User.objects.filter(last_login__gte=last_24h).count()
        except Exception:
            return 0
    
    def _get_error_rate(self):
        """Get recent error rate from system logs"""
        try:
            last_hour = timezone.now() - timedelta(hours=1)
            total_logs = SystemLog.objects.filter(created_at__gte=last_hour).count()
            error_logs = SystemLog.objects.filter(
                created_at__gte=last_hour,
                level__in=['error', 'critical']
            ).count()
            
            if total_logs > 0:
                return (error_logs / total_logs) * 100
            return 0.0
        except Exception:
            return 0.0
    
    def _get_avg_response_time(self):
        """Get average response time (placeholder)"""
        # This would typically come from middleware or external monitoring
        return 150.0  # ms
    
    def _get_recent_errors(self):
        """Get recent error log entries"""
        try:
            recent_cutoff = timezone.now() - timedelta(hours=1)
            errors = SystemLog.objects.filter(
                level__in=['error', 'critical'],
                created_at__gte=recent_cutoff
            ).order_by('-created_at')[:10]
            
            return [
                {
                    'message': error.message,
                    'level': error.level,
                    'category': error.category,
                    'created_at': error.created_at
                }
                for error in errors
            ]
        except Exception:
            return []
    
    def _generate_alerts(self, metrics):
        """Generate alerts and warnings based on metrics"""
        alerts = []
        warnings = []
        
        # Database response time
        if metrics['db_response_time'] > 1000:  # 1 second
            alerts.append('Database response time is high')
        elif metrics['db_response_time'] > 500:  # 500ms
            warnings.append('Database response time is elevated')
        
        # Memory usage
        if metrics['memory_usage'] > 90:
            alerts.append('Memory usage is critically high')
        elif metrics['memory_usage'] > 80:
            warnings.append('Memory usage is high')
        
        # CPU usage
        if metrics['cpu_usage'] > 90:
            alerts.append('CPU usage is critically high')
        elif metrics['cpu_usage'] > 80:
            warnings.append('CPU usage is high')
        
        # Disk usage
        if metrics['disk_usage'] > 95:
            alerts.append('Disk usage is critically high')
        elif metrics['disk_usage'] > 85:
            warnings.append('Disk usage is high')
        
        # Error rate
        if metrics['error_rate'] > 10:
            alerts.append('High error rate detected')
        elif metrics['error_rate'] > 5:
            warnings.append('Elevated error rate detected')
        
        return alerts, warnings
    
    def _get_uptime(self):
        """Get system uptime in seconds"""
        try:
            boot_time = psutil.boot_time()
            uptime = timezone.now().timestamp() - boot_time
            return uptime
        except Exception:
            return 0


class SystemStatusView(APIView):
    """
    Get system status overview
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """Return system status information"""
        # Maintenance status
        is_maintenance = SystemMaintenanceMode.is_maintenance_active()
        maintenance_msg = SystemMaintenanceMode.get_maintenance_message()
        
        # System info
        version = getattr(settings, 'VERSION', '1.0.0')
        environment = getattr(settings, 'ENVIRONMENT', 'production')
        debug_mode = settings.DEBUG
        
        # Features status
        features_enabled = {
            'email_notifications': True,  # Based on EMAIL_BACKEND setting
            'file_uploads': True,  # Based on file upload settings
            'user_registration': getattr(settings, 'ALLOW_USER_REGISTRATION', True),
            'maintenance_mode': is_maintenance,
        }
        
        # Database status
        db_accessible = True
        db_version = 'Unknown'
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT version()")
                db_version = cursor.fetchone()[0]
        except Exception:
            db_accessible = False
        
        # Cache status
        cache_accessible = True
        cache_type = 'Unknown'
        try:
            cache.set('status_check', 'test', 10)
            if cache.get('status_check') == 'test':
                cache_type = getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', 'Unknown')
            else:
                cache_accessible = False
        except Exception:
            cache_accessible = False
        
        # Storage info
        media_storage = {
            'accessible': os.path.exists(settings.MEDIA_ROOT) if hasattr(settings, 'MEDIA_ROOT') else False,
            'path': getattr(settings, 'MEDIA_ROOT', 'Not configured')
        }
        
        static_storage = {
            'accessible': os.path.exists(settings.STATIC_ROOT) if hasattr(settings, 'STATIC_ROOT') else False,
            'path': getattr(settings, 'STATIC_ROOT', 'Not configured')
        }
        
        # Email service
        email_service = {
            'configured': hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST,
            'backend': getattr(settings, 'EMAIL_BACKEND', 'Not configured')
        }
        
        # Current load (basic metrics)
        current_load = {
            'timestamp': timezone.now(),
            'maintenance_active': is_maintenance,
            'debug_mode': debug_mode
        }
        
        data = {
            'is_maintenance_active': is_maintenance,
            'maintenance_message': maintenance_msg,
            'version': version,
            'environment': environment,
            'debug_mode': debug_mode,
            'features_enabled': features_enabled,
            'database_accessible': db_accessible,
            'database_version': db_version,
            'cache_accessible': cache_accessible,
            'cache_type': cache_type,
            'media_storage': media_storage,
            'static_storage': static_storage,
            'email_service': email_service,
            'current_load': current_load
        }
        
        serializer = SystemStatusSerializer(data)
        return Response(serializer.data)


class SystemInfoView(APIView):
    """
    Get detailed system information
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Return detailed system information"""
        # Application info
        app_name = getattr(settings, 'APP_NAME', 'MDC Transaction Tracking System')
        app_version = getattr(settings, 'VERSION', '1.0.0')
        environment = getattr(settings, 'ENVIRONMENT', 'production')
        
        # Django and Python info
        django_version = django.get_version()
        python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        
        # Database info
        db_settings = settings.DATABASES.get('default', {})
        database_engine = db_settings.get('ENGINE', 'Unknown').split('.')[-1]
        database_name = db_settings.get('NAME', 'Unknown')
        
        # Cache info
        cache_settings = settings.CACHES.get('default', {})
        cache_backend = cache_settings.get('BACKEND', 'Unknown').split('.')[-1]
        
        # Server info
        server_time = timezone.now()
        timezone_name = str(timezone.get_current_timezone())
        
        # Statistics
        try:
            from users.models import User
            from transactions.models import Transaction
            from attachments.models import Attachment
            
            total_users = User.objects.count()
            total_transactions = Transaction.objects.count()
            total_attachments = Attachment.objects.count()
        except Exception:
            total_users = total_transactions = total_attachments = 0
        
        # Storage usage
        storage_usage = self._calculate_storage_usage()
        
        # Last maintenance
        try:
            last_maintenance = SystemMaintenanceMode.objects.filter(
                is_enabled=True
            ).aggregate(last=Max('created_at'))['last']
        except Exception:
            last_maintenance = None
        
        data = {
            'app_name': app_name,
            'app_version': app_version,
            'environment': environment,
            'django_version': django_version,
            'python_version': python_version,
            'database_engine': database_engine,
            'database_name': database_name,
            'cache_backend': cache_backend,
            'server_time': server_time,
            'timezone': timezone_name,
            'total_users': total_users,
            'total_transactions': total_transactions,
            'total_attachments': total_attachments,
            'storage_usage': storage_usage,
            'last_maintenance': last_maintenance
        }
        
        serializer = SystemInfoSerializer(data)
        return Response(serializer.data)
    
    def _calculate_storage_usage(self):
        """Calculate storage usage"""
        try:
            def get_size(path):
                if not os.path.exists(path):
                    return 0
                total_size = 0
                for dirpath, dirnames, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        if os.path.exists(fp):
                            total_size += os.path.getsize(fp)
                return total_size
            
            media_size = get_size(getattr(settings, 'MEDIA_ROOT', '/tmp'))
            static_size = get_size(getattr(settings, 'STATIC_ROOT', '/tmp'))
            
            return {
                'media_size_bytes': media_size,
                'static_size_bytes': static_size,
                'total_size_bytes': media_size + static_size,
                'media_size_mb': round(media_size / (1024 * 1024), 2),
                'static_size_mb': round(static_size / (1024 * 1024), 2),
                'total_size_mb': round((media_size + static_size) / (1024 * 1024), 2)
            }
        except Exception:
            return {
                'media_size_bytes': 0,
                'static_size_bytes': 0,
                'total_size_bytes': 0,
                'media_size_mb': 0,
                'static_size_mb': 0,
                'total_size_mb': 0
            }
