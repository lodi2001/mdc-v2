"""
Serializers for Attachment Management API
"""

from rest_framework import serializers
from django.core.files.uploadedfile import UploadedFile
from django.conf import settings
from .models import Attachment
from transactions.models import Transaction
from users.serializers import UserListSerializer


class AttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for attachment listing and details
    """
    uploaded_by = UserListSerializer(read_only=True)
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    file_extension = serializers.CharField(read_only=True)
    file_size_formatted = serializers.CharField(read_only=True)
    file_type_category = serializers.CharField(read_only=True)
    is_safe_to_download = serializers.BooleanField(read_only=True)
    download_url = serializers.CharField(source='get_download_url', read_only=True)
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'transaction', 'transaction_id', 'uploaded_by',
            'original_filename', 'file_size', 'file_size_formatted',
            'mime_type', 'file_extension', 'file_type_category',
            'is_client_visible', 'description', 'virus_scan_status',
            'is_safe_to_download', 'download_url', 'created_at',
            'can_delete'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'file_size', 'mime_type',
            'virus_scan_status', 'created_at'
        ]
    
    def get_can_delete(self, obj):
        user = self.context.get('request').user
        return obj.can_be_deleted_by(user)
    
    def to_representation(self, instance):
        """
        Filter fields based on user permissions
        """
        data = super().to_representation(instance)
        user = self.context.get('request').user
        
        # Hide certain fields for clients
        if user and user.role == 'client':
            # Remove internal fields
            data.pop('virus_scan_status', None)
        
        return data


class AttachmentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for file upload with validation
    """
    file = serializers.FileField(write_only=True)
    transaction_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Attachment
        fields = [
            'file', 'transaction_id', 'is_client_visible', 'description'
        ]
        extra_kwargs = {
            'is_client_visible': {'default': True},
            'description': {'required': False, 'allow_blank': True}
        }
    
    def validate_transaction_id(self, value):
        """
        Validate transaction exists and user has access
        """
        try:
            transaction = Transaction.objects.get(id=value, is_deleted=False)
        except Transaction.DoesNotExist:
            raise serializers.ValidationError("Transaction not found")
        
        user = self.context.get('request').user
        
        # Check if user can upload files to this transaction
        if user.role == 'client' and transaction.client != user:
            raise serializers.ValidationError("You don't have permission to upload to this transaction")
        elif user.role == 'editor' and transaction.assigned_to != user and transaction.created_by != user:
            raise serializers.ValidationError("You don't have permission to upload to this transaction")
        
        return value
    
    def validate_file(self, value):
        """
        Validate uploaded file
        """
        if not isinstance(value, UploadedFile):
            raise serializers.ValidationError("Invalid file upload")
        
        # Validate file size
        if value.size > settings.MAX_FILE_SIZE:
            max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise serializers.ValidationError(
                f"File size ({value.size / (1024 * 1024):.1f} MB) exceeds "
                f"maximum allowed size ({max_size_mb:.1f} MB)"
            )
        
        # Validate file extension
        import os
        extension = os.path.splitext(value.name)[1].lower().lstrip('.')
        if extension not in settings.ALLOWED_FILE_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '.{extension}' is not allowed. "
                f"Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
            )
        
        # Validate MIME type
        import mimetypes
        mime_type, _ = mimetypes.guess_type(value.name)
        if mime_type and mime_type not in settings.ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                f"MIME type '{mime_type}' is not allowed"
            )
        
        return value
    
    def create(self, validated_data):
        """
        Create attachment with file processing
        """
        file = validated_data.pop('file')
        transaction_id = validated_data.pop('transaction_id')
        
        # Get transaction
        transaction = Transaction.objects.get(id=transaction_id)
        
        # Process file upload
        attachment = self._process_file_upload(
            file=file,
            transaction=transaction,
            validated_data=validated_data
        )
        
        return attachment
    
    def _process_file_upload(self, file, transaction, validated_data):
        """
        Process file upload with security checks
        """
        import os
        import uuid
        import mimetypes
        from django.core.files.storage import default_storage
        from core.utils import scan_file_for_virus
        
        # Generate unique filename
        original_filename = file.name
        extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{extension}"
        
        # Generate storage path
        from django.utils import timezone
        now = timezone.now()
        storage_path = f"attachments/{now.year:04d}/{now.month:02d}/{transaction.transaction_id}/{unique_filename}"
        
        # Save file to storage
        saved_path = default_storage.save(storage_path, file)
        
        # Calculate file hash
        file.seek(0)
        file_hash = Attachment.calculate_file_hash(file)
        file.seek(0)
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(original_filename)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Check for duplicates
        duplicates = Attachment.find_duplicate(file_hash, transaction.id)
        if duplicates.exists():
            # Log duplicate but allow upload
            pass
        
        # Create attachment record
        attachment = Attachment.objects.create(
            transaction=transaction,
            uploaded_by=self.context['request'].user,
            original_filename=original_filename,
            stored_filename=unique_filename,
            file_path=saved_path,
            file_size=file.size,
            mime_type=mime_type,
            file_hash=file_hash,
            virus_scan_status='pending',
            **validated_data
        )
        
        # Perform virus scan (async in production)
        try:
            is_clean = scan_file_for_virus(file)
            attachment.virus_scan_status = 'clean' if is_clean else 'infected'
            attachment.virus_scan_result = 'Scan completed'
            attachment.save()
        except Exception as e:
            attachment.virus_scan_status = 'error'
            attachment.virus_scan_result = f"Scan error: {str(e)}"
            attachment.save()
        
        return attachment
    
    def to_representation(self, instance):
        """
        Return detailed attachment data after upload
        """
        return AttachmentSerializer(instance, context=self.context).data


class AttachmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for attachment lists
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_display_name', read_only=True)
    file_extension = serializers.CharField(read_only=True)
    file_size_formatted = serializers.CharField(read_only=True)
    file_type_category = serializers.CharField(read_only=True)
    is_safe_to_download = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'original_filename', 'file_size', 'file_size_formatted',
            'file_extension', 'file_type_category', 'is_client_visible',
            'description', 'uploaded_by_name', 'is_safe_to_download',
            'created_at'
        ]


class AttachmentFilterSerializer(serializers.Serializer):
    """
    Serializer for attachment filtering parameters
    """
    transaction_id = serializers.IntegerField(required=False)
    file_type = serializers.ChoiceField(
        choices=['image', 'document', 'other'],
        required=False
    )
    uploaded_by = serializers.IntegerField(required=False)
    is_client_visible = serializers.BooleanField(required=False)
    virus_scan_status = serializers.ChoiceField(
        choices=Attachment.VIRUS_SCAN_STATUS_CHOICES,
        required=False
    )
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    
    def validate(self, attrs):
        # Validate date range
        if attrs.get('date_from') and attrs.get('date_to'):
            if attrs['date_from'] > attrs['date_to']:
                raise serializers.ValidationError("date_from must be before date_to")
        
        return attrs


class BulkAttachmentOperationSerializer(serializers.Serializer):
    """
    Serializer for bulk attachment operations
    """
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=50
    )
    action = serializers.ChoiceField(
        choices=['delete', 'toggle_visibility', 'update_description']
    )
    
    # Optional fields based on action
    is_client_visible = serializers.BooleanField(required=False)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_attachment_ids(self, value):
        # Check if all attachment IDs exist and user has permission
        user = self.context.get('request').user
        attachments = Attachment.objects.filter(id__in=value, is_deleted=False)
        
        if attachments.count() != len(value):
            raise serializers.ValidationError("Some attachment IDs don't exist")
        
        # Check permissions for each attachment
        for attachment in attachments:
            if not attachment.can_be_accessed_by(user):
                raise serializers.ValidationError(
                    f"You don't have permission to access attachment {attachment.id}"
                )
        
        return value
    
    def validate(self, attrs):
        action = attrs.get('action')
        
        # Validate required fields for each action
        if action == 'toggle_visibility' and 'is_client_visible' not in attrs:
            raise serializers.ValidationError(
                "is_client_visible is required for toggle_visibility action"
            )
        
        if action == 'update_description' and 'description' not in attrs:
            raise serializers.ValidationError(
                "description is required for update_description action"
            )
        
        return attrs


class AttachmentStatisticsSerializer(serializers.Serializer):
    """
    Serializer for attachment statistics
    """
    total_attachments = serializers.IntegerField()
    total_size = serializers.IntegerField()
    total_size_formatted = serializers.CharField()
    by_type = serializers.DictField()
    by_virus_scan_status = serializers.DictField()
    recent_uploads = serializers.IntegerField()
    avg_file_size = serializers.FloatField()
    largest_file = serializers.DictField()
    storage_usage = serializers.DictField()


class FileValidationSerializer(serializers.Serializer):
    """
    Serializer for file validation endpoint
    """
    filename = serializers.CharField(max_length=255)
    file_size = serializers.IntegerField(min_value=1)
    
    def validate_filename(self, value):
        import os
        extension = os.path.splitext(value)[1].lower().lstrip('.')
        if extension not in settings.ALLOWED_FILE_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '.{extension}' is not allowed. "
                f"Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
            )
        return value
    
    def validate_file_size(self, value):
        if value > settings.MAX_FILE_SIZE:
            max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise serializers.ValidationError(
                f"File size ({value / (1024 * 1024):.1f} MB) exceeds "
                f"maximum allowed size ({max_size_mb:.1f} MB)"
            )
        return value