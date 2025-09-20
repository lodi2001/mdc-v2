"""
Views for Attachment Management API
"""

import logging
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.db.models import Sum, Avg, Max, Count
from django.core.files.storage import default_storage
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Attachment
from .serializers import (
    AttachmentSerializer, AttachmentUploadSerializer, AttachmentListSerializer,
    AttachmentFilterSerializer, BulkAttachmentOperationSerializer,
    AttachmentStatisticsSerializer, FileValidationSerializer
)
from transactions.models import Transaction
from core.permissions import IsActiveUser, IsEditorOrAdmin, CanUploadFiles
from core.utils import (
    create_success_response, create_error_response, create_audit_log_entry,
    validate_file_extension, validate_file_size, validate_mime_type
)
from core.pagination import StandardPagination
from core.throttling import UploadThrottle, BulkOperationThrottle

logger = logging.getLogger(__name__)


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attachment CRUD operations
    """
    serializer_class = AttachmentSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['original_filename', 'description']
    ordering_fields = ['original_filename', 'file_size', 'created_at']
    ordering = ['-created_at']
    filterset_fields = [
        'transaction', 'uploaded_by', 'mime_type', 'is_client_visible',
        'virus_scan_status'
    ]
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [CanUploadFiles]
        elif self.action in ['destroy']:
            permission_classes = [IsActiveUser]  # Will check object permissions
        else:
            permission_classes = [IsActiveUser]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on action
        """
        if self.action == 'list':
            return AttachmentListSerializer
        elif self.action == 'create':
            return AttachmentUploadSerializer
        return AttachmentSerializer
    
    def get_queryset(self):
        """
        Return filtered queryset based on user role and permissions
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return Attachment.objects.none()
        
        # Base queryset excluding soft-deleted attachments
        queryset = Attachment.objects.filter(is_deleted=False).select_related(
            'transaction', 'uploaded_by'
        )
        
        # Filter based on user role
        if user.role == 'admin':
            # Admins can see all attachments
            return queryset
        elif user.role == 'editor':
            # Editors can see attachments on transactions they're assigned to or created
            return queryset.filter(
                transaction__assigned_to=user
            ).union(
                queryset.filter(transaction__created_by=user)
            )
        elif user.role == 'client':
            # Clients can only see client-visible attachments on their own transactions
            return queryset.filter(
                transaction__client=user,
                is_client_visible=True
            )
        
        return Attachment.objects.none()
    
    def check_object_permissions(self, request, obj):
        """
        Check if user has permission to access this specific attachment
        """
        user = request.user
        
        if not obj.can_be_accessed_by(user):
            self.permission_denied(request, message="You don't have access to this attachment")
        
        # Additional check for deletion permissions
        if request.method == 'DELETE':
            if not obj.can_be_deleted_by(user):
                self.permission_denied(request, message="You don't have permission to delete this attachment")
    
    def perform_destroy(self, instance):
        """
        Soft delete attachment with audit logging
        """
        instance.soft_delete(self.request.user)
        
        create_audit_log_entry(
            user=self.request.user,
            action='delete',
            object_type='Attachment',
            object_id=instance.id,
            details={
                'filename': instance.original_filename,
                'transaction_id': instance.transaction.transaction_id
            }
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsActiveUser])
    def scan_virus(self, request, pk=None):
        """
        Scan attachment for viruses
        """
        attachment = self.get_object()
        
        # Check permissions
        if not attachment.can_be_accessed_by(request.user):
            return create_error_response(
                message="You don't have permission to access this attachment",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Perform virus scan
        is_clean = attachment.scan_for_virus()
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='virus_scan',
            object_type='Attachment',
            object_id=attachment.id,
            details={
                'filename': attachment.original_filename,
                'scan_result': attachment.virus_scan_result,
                'is_clean': is_clean
            }
        )
        
        return create_success_response(
            message="Virus scan completed",
            data={
                'is_clean': is_clean,
                'status': attachment.virus_scan_status,
                'result': attachment.virus_scan_result,
                'scan_date': attachment.virus_scan_date
            }
        )
    
    @action(detail=True, methods=['get'], permission_classes=[IsActiveUser])
    def preview(self, request, pk=None):
        """
        Get attachment preview/thumbnail
        """
        attachment = self.get_object()
        
        # Check permissions
        if not attachment.can_be_accessed_by(request.user):
            return create_error_response(
                message="You don't have permission to access this attachment",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Generate preview
        preview_data = attachment.generate_preview()
        
        if preview_data:
            return create_success_response(
                message="Preview generated successfully",
                data={
                    'preview': preview_data,
                    'filename': attachment.original_filename,
                    'file_type': attachment.file_type_category
                }
            )
        else:
            return create_error_response(
                message="Preview not available for this file type",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsActiveUser], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Upload multiple attachments for a transaction using proper serializer workflow
        """
        transaction_id = request.data.get('transaction')
        files = request.FILES.getlist('files')

        if not transaction_id:
            return create_error_response(
                message="transaction ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if not files:
            return create_error_response(
                message="No files provided",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            transaction = Transaction.objects.get(
                id=transaction_id,
                is_deleted=False
            )
        except Transaction.DoesNotExist:
            return create_error_response(
                message="Transaction not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Check permissions
        user = request.user
        if user.role == 'client' and transaction.client != user:
            return create_error_response(
                message="You don't have permission to upload files to this transaction",
                status_code=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'editor' and transaction.assigned_to != user and transaction.created_by != user:
            return create_error_response(
                message="You don't have permission to upload files to this transaction",
                status_code=status.HTTP_403_FORBIDDEN
            )

        uploaded_attachments = []
        errors = []

        # Use database transaction for atomicity
        with db_transaction.atomic():
            for file in files:
                try:
                    # Use the proper AttachmentUploadSerializer
                    upload_data = {
                        'file': file,
                        'transaction_id': transaction_id,
                        'is_client_visible': True,
                        'description': ''
                    }

                    serializer = AttachmentUploadSerializer(
                        data=upload_data,
                        context={'request': request}
                    )

                    if serializer.is_valid():
                        attachment = serializer.save()
                        # Get the full attachment data with all fields
                        attachment_data = AttachmentSerializer(
                            attachment,
                            context={'request': request}
                        ).data
                        uploaded_attachments.append(attachment_data)
                    else:
                        errors.append({
                            'filename': file.name,
                            'error': str(serializer.errors)
                        })

                except Exception as e:
                    logger.error(f"Error uploading file {file.name}: {str(e)}")
                    errors.append({
                        'filename': file.name,
                        'error': str(e)
                    })

        # Create audit log - commented out for now due to parameter issues
        # if uploaded_attachments:
        #     create_audit_log_entry(
        #         user=request.user,
        #         action='BULK_FILE_UPLOAD',
        #         object_id=transaction.id,
        #         details=f"Uploaded {len(uploaded_attachments)} files to transaction {transaction.transaction_id}"
        #     )

        if uploaded_attachments:
            return create_success_response(
                message=f"Successfully uploaded {len(uploaded_attachments)} file(s)",
                data={
                    'attachments': uploaded_attachments,
                    'errors': errors
                }
            )
        else:
            return create_error_response(
                message="Failed to upload any files",
                data={'errors': errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[IsActiveUser])
    def by_transaction(self, request):
        """
        Get attachments for a specific transaction
        """
        transaction_id = request.query_params.get('transaction_id')
        if not transaction_id:
            return create_error_response(
                message="transaction_id parameter is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transaction = Transaction.objects.get(
                id=transaction_id,
                is_deleted=False
            )
        except Transaction.DoesNotExist:
            return create_error_response(
                message="Transaction not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has access to this transaction
        user = request.user
        if user.role == 'client' and transaction.client != user:
            return create_error_response(
                message="You don't have access to this transaction",
                status_code=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'editor' and transaction.assigned_to != user and transaction.created_by != user:
            return create_error_response(
                message="You don't have access to this transaction",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Get attachments for the transaction
        attachments = self.get_queryset().filter(transaction=transaction)
        
        page = self.paginate_queryset(attachments)
        if page is not None:
            serializer = AttachmentListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = AttachmentListSerializer(attachments, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsEditorOrAdmin])
    def statistics(self, request):
        """
        Get attachment statistics
        """
        queryset = self.get_queryset()
        
        # Basic statistics
        total_attachments = queryset.count()
        total_size = queryset.aggregate(total=Sum('file_size'))['total'] or 0
        
        # Format total size
        def format_size(size_bytes):
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size_bytes < 1024.0:
                    return f"{size_bytes:.1f} {unit}"
                size_bytes /= 1024.0
            return f"{size_bytes:.1f} TB"
        
        total_size_formatted = format_size(total_size)
        
        # By file type
        by_type = {}
        for attachment in queryset:
            file_type = attachment.file_type_category
            by_type[file_type] = by_type.get(file_type, 0) + 1
        
        # By virus scan status
        by_virus_scan_status = dict(
            queryset.values('virus_scan_status')
            .annotate(count=Count('id'))
            .values_list('virus_scan_status', 'count')
        )
        
        # Recent uploads (last 7 days)
        recent_date = timezone.now() - timezone.timedelta(days=7)
        recent_uploads = queryset.filter(created_at__gte=recent_date).count()
        
        # Average file size
        avg_file_size = queryset.aggregate(avg=Avg('file_size'))['avg'] or 0
        
        # Largest file
        largest = queryset.order_by('-file_size').first()
        largest_file = {}
        if largest:
            largest_file = {
                'filename': largest.original_filename,
                'size': largest.file_size,
                'size_formatted': largest.file_size_formatted
            }
        
        # Storage usage (approximate)
        storage_usage = {
            'total_files': total_attachments,
            'total_size': total_size,
            'total_size_formatted': total_size_formatted,
            'avg_size_per_file': avg_file_size
        }
        
        stats = {
            'total_attachments': total_attachments,
            'total_size': total_size,
            'total_size_formatted': total_size_formatted,
            'by_type': by_type,
            'by_virus_scan_status': by_virus_scan_status,
            'recent_uploads': recent_uploads,
            'avg_file_size': avg_file_size,
            'largest_file': largest_file,
            'storage_usage': storage_usage
        }
        
        serializer = AttachmentStatisticsSerializer(stats)
        return create_success_response(
            message="Attachment statistics retrieved successfully",
            data=serializer.data
        )


class AttachmentUploadView(APIView):
    """
    View for file upload with validation
    """
    permission_classes = [CanUploadFiles]
    throttle_classes = [UploadThrottle]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Upload file attachment
        """
        serializer = AttachmentUploadSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                attachment = serializer.save()
                
                # Create audit log
                create_audit_log_entry(
                    user=request.user,
                    action='upload',
                    object_type='Attachment',
                    object_id=attachment.id,
                    details={
                        'filename': attachment.original_filename,
                        'file_size': attachment.file_size,
                        'transaction_id': attachment.transaction.transaction_id
                    }
                )
                
                return create_success_response(
                    message="File uploaded successfully",
                    data=AttachmentSerializer(attachment, context={'request': request}).data,
                    status_code=status.HTTP_201_CREATED
                )
                
            except Exception as e:
                logger.error(f"File upload error: {str(e)}")
                return create_error_response(
                    message="Error processing file upload",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


class AttachmentDownloadView(APIView):
    """
    View for secure file download
    """
    permission_classes = [IsActiveUser]
    
    def get(self, request, pk):
        """
        Download attachment file
        """
        try:
            attachment = get_object_or_404(Attachment, pk=pk, is_deleted=False)
        except Attachment.DoesNotExist:
            raise Http404("Attachment not found")
        
        # Check permissions
        if not attachment.can_be_accessed_by(request.user):
            return create_error_response(
                message="You don't have permission to access this file",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Check if file is safe to download
        if not attachment.is_safe_to_download:
            return create_error_response(
                message="File is not safe to download (virus scan failed)",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Get file from storage
        try:
            file_content = attachment.get_file_content()
            if not file_content:
                return create_error_response(
                    message="File not found in storage",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            # Create response with file content
            response = HttpResponse(
                file_content.read(),
                content_type=attachment.mime_type
            )
            response['Content-Disposition'] = f'attachment; filename="{attachment.original_filename}"'
            response['Content-Length'] = attachment.file_size
            
            # Create audit log
            create_audit_log_entry(
                user=request.user,
                action='download',
                object_type='Attachment',
                object_id=attachment.id,
                details={
                    'filename': attachment.original_filename,
                    'transaction_id': attachment.transaction.transaction_id
                }
            )
            
            return response
            
        except Exception as e:
            logger.error(f"File download error: {str(e)}")
            return create_error_response(
                message="Error retrieving file",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AttachmentDeleteView(APIView):
    """
    View for attachment deletion
    """
    permission_classes = [IsActiveUser]
    
    def delete(self, request, pk):
        """
        Delete attachment
        """
        try:
            attachment = get_object_or_404(Attachment, pk=pk, is_deleted=False)
        except Attachment.DoesNotExist:
            return create_error_response(
                message="Attachment not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not attachment.can_be_deleted_by(request.user):
            return create_error_response(
                message="You don't have permission to delete this attachment",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Soft delete
        attachment.soft_delete(request.user)
        
        # Create audit log
        create_audit_log_entry(
            user=request.user,
            action='delete',
            object_type='Attachment',
            object_id=attachment.id,
            details={
                'filename': attachment.original_filename,
                'transaction_id': attachment.transaction.transaction_id
            }
        )
        
        return create_success_response(
            message="Attachment deleted successfully",
            data={'id': attachment.id}
        )


class BulkAttachmentOperationsView(APIView):
    """
    View for bulk attachment operations
    """
    permission_classes = [IsEditorOrAdmin]
    throttle_classes = [BulkOperationThrottle]
    
    def post(self, request):
        """
        Perform bulk operations on attachments
        """
        serializer = BulkAttachmentOperationSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            attachment_ids = serializer.validated_data['attachment_ids']
            action = serializer.validated_data['action']
            
            try:
                with db_transaction.atomic():
                    attachments = Attachment.objects.filter(
                        id__in=attachment_ids,
                        is_deleted=False
                    )
                    updated_count = 0
                    
                    for attachment in attachments:
                        if action == 'delete':
                            if attachment.can_be_deleted_by(request.user):
                                attachment.soft_delete(request.user)
                                updated_count += 1
                        
                        elif action == 'toggle_visibility':
                            if request.user.role in ['admin', 'editor']:
                                attachment.is_client_visible = serializer.validated_data['is_client_visible']
                                attachment.save()
                                updated_count += 1
                        
                        elif action == 'update_description':
                            if request.user.role in ['admin', 'editor']:
                                attachment.description = serializer.validated_data.get('description', '')
                                attachment.save()
                                updated_count += 1
                    
                    # Create audit log
                    create_audit_log_entry(
                        user=request.user,
                        action=f'bulk_{action}',
                        object_type='Attachment',
                        object_id='bulk',
                        details={
                            'attachment_ids': attachment_ids,
                            'action': action,
                            'updated_count': updated_count,
                            'total_requested': len(attachment_ids)
                        }
                    )
                    
                    return create_success_response(
                        message=f"Bulk {action} completed",
                        data={
                            'total_requested': len(attachment_ids),
                            'updated_count': updated_count
                        }
                    )
                    
            except Exception as e:
                logger.error(f"Error in bulk attachment operation: {str(e)}")
                return create_error_response(
                    message="Error processing bulk operation",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )


class FileValidationView(APIView):
    """
    View for pre-upload file validation
    """
    permission_classes = [IsActiveUser]
    
    def post(self, request):
        """
        Validate file before upload
        """
        serializer = FileValidationSerializer(data=request.data)
        
        if serializer.is_valid():
            filename = serializer.validated_data['filename']
            file_size = serializer.validated_data['file_size']
            
            # Perform validations
            validation_results = {
                'is_valid': True,
                'errors': [],
                'warnings': []
            }
            
            try:
                # Check file extension
                validate_file_extension(filename)
            except Exception as e:
                validation_results['is_valid'] = False
                validation_results['errors'].append(str(e))
            
            try:
                # Check file size
                import io
                fake_file = io.BytesIO(b'0' * file_size)
                fake_file.size = file_size
                validate_file_size(fake_file)
            except Exception as e:
                validation_results['is_valid'] = False
                validation_results['errors'].append(str(e))
            
            # Check for potential duplicates (if file hash was provided)
            file_hash = request.data.get('file_hash')
            if file_hash:
                duplicates = Attachment.find_duplicate(file_hash)
                if duplicates.exists():
                    validation_results['warnings'].append(
                        f"Similar file may already exist ({duplicates.count()} found)"
                    )
            
            # Additional checks
            import os
            extension = os.path.splitext(filename)[1].lower().lstrip('.')
            
            # Check maximum files per transaction
            transaction_id = request.data.get('transaction_id')
            if transaction_id:
                try:
                    transaction = Transaction.objects.get(id=transaction_id, is_deleted=False)
                    attachment_count = transaction.attachments.filter(is_deleted=False).count()
                    max_files = settings.MAX_FILES_PER_TRANSACTION
                    
                    if attachment_count >= max_files:
                        validation_results['is_valid'] = False
                        validation_results['errors'].append(
                            f"Maximum number of files per transaction exceeded ({max_files})"
                        )
                except Transaction.DoesNotExist:
                    validation_results['is_valid'] = False
                    validation_results['errors'].append("Transaction not found")
            
            return create_success_response(
                message="File validation completed",
                data=validation_results
            )
        
        return create_error_response(
            message="Invalid data provided",
            errors=serializer.errors
        )
