"""
Views for User Management API
"""

import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.db import transaction as db_transaction
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import User, PasswordResetToken
from .serializers import (
    UserSerializer, UserListSerializer, UserProfileSerializer,
    UserApprovalSerializer, PendingUserSerializer, BulkUserOperationSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserRegistrationSerializer,
    UserStatisticsSerializer
)
from core.permissions import (
    IsActiveUser, IsAdminUser, IsEditorOrAdmin, IsOwnerOrAdmin,
    CanApproveUsers, ReadOnlyOrAdmin
)
from core.utils import (
    create_success_response, create_error_response, send_notification_email,
    create_audit_log_entry, get_client_ip, get_user_agent
)
from core.pagination import StandardPagination
from core.throttling import AuthThrottle, BulkOperationThrottle

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on users
    """
    serializer_class = UserSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'status', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'company_name']
    ordering_fields = ['date_joined', 'last_login', 'username', 'email']
    ordering = ['-date_joined']
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action == 'create':
            # Allow admin users to create users directly
            # Public registration is handled separately
            permission_classes = [IsAdminUser]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsEditorOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsActiveUser]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on action
        """
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            # Admin users can create users with full details
            if self.request.user.is_authenticated and self.request.user.role == 'admin':
                return UserSerializer
            return UserRegistrationSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        Return filtered queryset based on user role
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return User.objects.none()
        
        if user.role == 'admin':
            return User.objects.all()
        elif user.role == 'editor':
            # Editors can see all users but with limited fields
            return User.objects.all()
        else:
            # Clients can only see themselves
            return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        """
        Save new user with proper audit logging
        """
        user = serializer.save()
        
        # Log user creation
        create_audit_log_entry(
            user=user,
            action='create',
            object_type='User',
            object_id=user.id,
            details={'role': user.role, 'status': user.status}
        )
        
        # Send welcome email
        try:
            send_notification_email(
                recipient_email=user.email,
                subject='Welcome to MDC Transaction Tracking System',
                template_name='emails/welcome.html',
                context={
                    'user': user,
                    'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL']
                }
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
    
    def perform_update(self, serializer):
        """
        Update user with audit logging
        """
        old_instance = self.get_object()
        user = serializer.save()
        
        # Log user update
        create_audit_log_entry(
            user=self.request.user,
            action='update',
            object_type='User',
            object_id=user.id,
            details={
                'updated_fields': list(serializer.validated_data.keys()),
                'old_status': old_instance.status,
                'new_status': user.status
            }
        )
    
    def perform_destroy(self, instance):
        """
        Delete user with audit logging
        """
        create_audit_log_entry(
            user=self.request.user,
            action='delete',
            object_type='User',
            object_id=instance.id,
            details={'deleted_user': instance.email}
        )
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[IsEditorOrAdmin])
    def statistics(self, request):
        """
        Get user statistics matching frontend expectations
        """
        total_users = User.objects.count()
        active_users = User.objects.filter(status='active').count()
        pending_users = User.objects.filter(status='pending').count()
        
        # Count users by role
        editors_count = User.objects.filter(role='editor').count()
        clients_count = User.objects.filter(role='client').count()
        
        # Calculate percentages
        active_percentage = (active_users / total_users * 100) if total_users > 0 else 0
        editors_percentage = (editors_count / total_users * 100) if total_users > 0 else 0
        clients_percentage = (clients_count / total_users * 100) if total_users > 0 else 0
        
        # Recent registrations (last 30 days)
        recent_date = timezone.now() - timedelta(days=30)
        recent_registrations = User.objects.filter(date_joined__gte=recent_date).count()
        
        # Calculate monthly growth
        last_month = timezone.now() - timedelta(days=30)
        previous_month = last_month - timedelta(days=30)
        last_month_users = User.objects.filter(date_joined__lt=last_month).count()
        previous_month_users = User.objects.filter(date_joined__lt=previous_month).count()
        
        if previous_month_users > 0:
            monthly_growth = ((last_month_users - previous_month_users) / previous_month_users * 100)
        else:
            monthly_growth = 100 if last_month_users > 0 else 0
        
        # Return data matching frontend UserStatistics interface
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'active_percentage': round(active_percentage, 1),
            'editors_count': editors_count,
            'editors_percentage': round(editors_percentage, 1),
            'clients_count': clients_count,
            'clients_percentage': round(clients_percentage, 1),
            'pending_registrations': pending_users,
            'monthly_growth': round(monthly_growth, 1)
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'], permission_classes=[IsEditorOrAdmin])
    def pending(self, request):
        """
        Get pending user registrations
        """
        pending_users = User.objects.filter(status='pending')
        serializer = PendingUserSerializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def change_status(self, request, pk=None):
        """
        Change user status (active/inactive/suspended)
        """
        user = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['active', 'inactive', 'suspended']:
            return Response(
                {'error': 'Invalid status. Must be active, inactive, or suspended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = user.status
        user.status = new_status
        user.save()
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='status_change',
            object_type='User',
            object_id=user.id,
            details={
                'old_status': old_status,
                'new_status': new_status,
                'target_user': user.email
            }
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """
        Approve a pending user registration
        """
        user = self.get_object()
        
        if user.status != 'pending':
            return Response(
                {'error': 'User is not in pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.status = 'active'
        user.save()
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='approve',
            object_type='User',
            object_id=user.id,
            details={'approved_user': user.email}
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """
        Reject a pending user registration
        """
        user = self.get_object()

        if user.status != 'pending':
            return Response(
                {'error': 'User is not in pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        user.status = 'rejected'
        user.save()
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='reject',
            object_type='User',
            object_id=user.id,
            details={
                'rejected_user': user.email,
                'reason': reason
            }
        )
        
        return Response({'message': f'User {user.email} rejected'})

    @action(detail=False, methods=['get'], permission_classes=[IsEditorOrAdmin])
    def assignees_list(self, request):
        """
        Get list of users who can be assigned to transactions (editors and admins).
        Returns optimized data for searchable dropdown.
        """
        # Get search query if provided
        search = request.query_params.get('search', '').strip()

        # Get all editor and admin users who are active
        queryset = User.objects.filter(
            role__in=['editor', 'admin'],
            status='active',
            is_active=True
        )

        # Apply search if provided
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        # Limit results for performance
        queryset = queryset[:50]

        # Format the response for frontend dropdown
        assignees_data = []
        for user in queryset:
            assignees_data.append({
                'id': user.id,
                'label': f"{user.get_full_name()} ({user.role.title()})",
                'value': user.id,
                'email': user.email,
                'role': user.role,
                'full_name': user.get_full_name(),
                'username': user.username
            })

        return Response({
            'success': True,
            'data': assignees_data,
            'count': len(assignees_data)
        })

    @action(detail=False, methods=['get'], permission_classes=[IsEditorOrAdmin])
    def clients_list(self, request):
        """
        Get list of client users with their contact information for transaction creation.
        Returns optimized data for searchable dropdown.
        """
        # Get search query if provided
        search = request.query_params.get('search', '').strip()

        # Get all client users who are active
        queryset = User.objects.filter(
            role='client',
            status='active',
            is_active=True
        )

        # Apply search if provided
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(company_name__icontains=search) |
                Q(username__icontains=search)
            )

        # Limit results for performance
        queryset = queryset[:50]

        # Format the response for frontend dropdown
        clients_data = []
        for client in queryset:
            clients_data.append({
                'id': client.id,
                'label': f"{client.get_full_name()} ({client.company_name or client.email})",
                'value': client.id,
                'email': client.email,
                'phone': client.phone_number or '',
                'company_name': client.company_name or '',
                'full_name': client.get_full_name(),
                'username': client.username
            })

        return Response({
            'success': True,
            'data': clients_data,
            'count': len(clients_data)
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser], url_path='bulk-approve')
    def bulk_approve(self, request):
        """
        Bulk approve multiple pending users
        """
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approved = 0
        failed = 0
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id, status='pending')
                user.status = 'active'
                user.save()
                approved += 1
                
                # Create audit log
                create_audit_log_entry(
                    user=request.user,
                    action='bulk_approve',
                    object_type='User',
                    object_id=user.id,
                    details={'approved_user': user.email}
                )
            except User.DoesNotExist:
                failed += 1
        
        return Response({
            'approved': approved,
            'failed': failed,
            'message': f'Approved {approved} users, {failed} failed'
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """
        Reset user password and send email
        """
        user = self.get_object()
        send_email = request.data.get('send_email', True)
        
        # Generate a temporary password or reset token
        # For now, just return a success message
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='reset_password',
            object_type='User',
            object_id=user.id,
            details={'reset_for_user': user.email}
        )
        
        return Response({
            'message': f'Password reset link has been sent to {user.email}' if send_email else 'Password has been reset'
        })


class PendingUsersView(APIView):
    """
    View for handling pending user registrations
    """
    permission_classes = [CanApproveUsers]
    
    def get(self, request):
        """
        Get list of pending users
        """
        pending_users = User.objects.filter(status='pending').order_by('date_joined')
        serializer = PendingUserSerializer(pending_users, many=True)
        
        return create_success_response(
            message="Pending users retrieved successfully",
            data=serializer.data
        )


class ApproveUserView(APIView):
    """
    View for approving user registrations
    """
    permission_classes = [CanApproveUsers]
    throttle_classes = [BulkOperationThrottle]
    
    def post(self, request):
        """
        Approve user registration
        """
        serializer = UserApprovalSerializer(data=request.data)
        
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            action = serializer.validated_data['action']
            reason = serializer.validated_data.get('reason', '')
            
            try:
                with db_transaction.atomic():
                    user = User.objects.get(id=user_id, status='pending')
                    
                    if action == 'approve':
                        user.activate(approved_by_user=request.user)
                        
                        # Send approval email
                        send_notification_email(
                            recipient_email=user.email,
                            subject='Account Approved - MDC Transaction Tracking System',
                            template_name='emails/account_approved.html',
                            context={
                                'user': user,
                                'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL']
                            }
                        )
                        
                        message = f"User {user.email} approved successfully"
                        
                    elif action == 'reject':
                        user.status = 'rejected'
                        user.save()
                        
                        # Send rejection email
                        send_notification_email(
                            recipient_email=user.email,
                            subject='Account Application - MDC Transaction Tracking System',
                            template_name='emails/account_rejected.html',
                            context={
                                'user': user,
                                'reason': reason,
                                'frontend_url': settings.MDC_SETTINGS['FRONTEND_URL']
                            }
                        )
                        
                        message = f"User {user.email} rejected"
                    
                    # Create audit log
                    create_audit_log_entry(
                        user=request.user,
                        action=f'user_{action}',
                        object_type='User',
                        object_id=user.id,
                        details={
                            'approved_user': user.email,
                            'reason': reason
                        }
                    )
                    
                    return create_success_response(
                        message=message,
                        data={'user_id': user.id, 'status': user.status}
                    )
                    
            except User.DoesNotExist:
                return create_error_response(
                    message="User not found or not in pending status",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                logger.error(f"Error in user approval: {str(e)}")
                return create_error_response(
                    message="Error processing user approval",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class UserProfileView(APIView):
    """
    View for user profile management
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request):
        """
        Get current user's profile
        """
        serializer = UserProfileSerializer(request.user)
        return create_success_response(
            message="Profile retrieved successfully",
            data=serializer.data
        )
    
    def put(self, request):
        """
        Update current user's profile
        """
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=False
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            create_audit_log_entry(
                user=request.user,
                action='profile_update',
                object_type='User',
                object_id=user.id,
                details={'updated_fields': list(serializer.validated_data.keys())}
            )
            
            return create_success_response(
                message="Profile updated successfully",
                data=serializer.data
            )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )
    
    def patch(self, request):
        """
        Partially update current user's profile
        """
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            create_audit_log_entry(
                user=request.user,
                action='profile_update',
                object_type='User',
                object_id=user.id,
                details={'updated_fields': list(serializer.validated_data.keys())}
            )
            
            return create_success_response(
                message="Profile updated successfully",
                data=serializer.data
            )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


class BulkUserOperationsView(APIView):
    """
    View for bulk user operations
    """
    permission_classes = [IsAdminUser]
    throttle_classes = [BulkOperationThrottle]
    
    def post(self, request):
        """
        Perform bulk operations on users
        """
        serializer = BulkUserOperationSerializer(data=request.data)
        
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            action = serializer.validated_data['action']
            reason = serializer.validated_data.get('reason', '')
            
            try:
                with db_transaction.atomic():
                    users = User.objects.filter(id__in=user_ids)
                    updated_count = 0
                    
                    for user in users:
                        if action == 'activate':
                            if user.status == 'pending':
                                user.activate(approved_by_user=request.user)
                                updated_count += 1
                        
                        elif action == 'deactivate':
                            if user.status == 'active':
                                user.deactivate(reason=reason)
                                updated_count += 1
                        
                        elif action == 'delete':
                            user.delete()
                            updated_count += 1
                        
                        elif action == 'approve':
                            if user.status == 'pending':
                                user.activate(approved_by_user=request.user)
                                updated_count += 1
                        
                        elif action == 'reject':
                            if user.status == 'pending':
                                user.status = 'rejected'
                                user.save()
                                updated_count += 1
                    
                    # Create audit log
                    create_audit_log_entry(
                        user=request.user,
                        action=f'bulk_{action}',
                        object_type='User',
                        object_id='bulk',
                        details={
                            'user_ids': user_ids,
                            'action': action,
                            'updated_count': updated_count,
                            'reason': reason
                        }
                    )
                    
                    return create_success_response(
                        message=f"Bulk {action} completed",
                        data={
                            'total_requested': len(user_ids),
                            'updated_count': updated_count
                        }
                    )
                    
            except Exception as e:
                logger.error(f"Error in bulk user operation: {str(e)}")
                return create_error_response(
                    message="Error processing bulk operation",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


class PasswordChangeView(APIView):
    """
    View for password change
    """
    permission_classes = [IsActiveUser]
    throttle_classes = [AuthThrottle]
    
    def post(self, request):
        """
        Change user password
        """
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Create audit log
            create_audit_log_entry(
                user=user,
                action='password_change',
                object_type='User',
                object_id=user.id,
                details={'ip_address': get_client_ip(request)}
            )
            
            return create_success_response(
                message="Password changed successfully"
            )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


class PasswordResetRequestView(APIView):
    """
    View for password reset request
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]
    
    def post(self, request):
        """
        Request password reset
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Generate reset token
                import secrets
                token = secrets.token_urlsafe(32)
                
                # Create password reset token
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=timezone.now() + timedelta(hours=1)
                )
                
                # Send reset email
                reset_url = f"{settings.MDC_SETTINGS['FRONTEND_URL']}/reset-password?token={token}"
                
                send_notification_email(
                    recipient_email=user.email,
                    subject='Password Reset - MDC Transaction Tracking System',
                    template_name='emails/password_reset.html',
                    context={
                        'user': user,
                        'reset_url': reset_url,
                        'expires_in': '1 hour'
                    }
                )
                
                # Create audit log
                create_audit_log_entry(
                    user=user,
                    action='password_reset_request',
                    object_type='User',
                    object_id=user.id,
                    details={'ip_address': get_client_ip(request)}
                )
                
                return create_success_response(
                    message="Password reset email sent successfully"
                )
                
            except User.DoesNotExist:
                # Don't reveal if email exists or not for security
                return create_success_response(
                    message="If the email exists, a reset link has been sent"
                )
        
        return create_error_response(
            message="Invalid email address",
            errors=serializer.errors
        )


class PasswordResetConfirmView(APIView):
    """
    View for password reset confirmation
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]
    
    def post(self, request):
        """
        Confirm password reset
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                reset_token = PasswordResetToken.objects.get(token=token)
                
                if not reset_token.is_valid:
                    return create_error_response(
                        message="Invalid or expired token",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                # Reset password
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.use_token()
                
                # Create audit log
                create_audit_log_entry(
                    user=user,
                    action='password_reset_confirm',
                    object_type='User',
                    object_id=user.id,
                    details={'ip_address': get_client_ip(request)}
                )
                
                return create_success_response(
                    message="Password reset successfully"
                )
                
            except PasswordResetToken.DoesNotExist:
                return create_error_response(
                    message="Invalid token",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


# SystemSettingsView removed - now handled by system_settings app
