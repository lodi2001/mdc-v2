"""
Serializers for Transaction Management API
"""

from rest_framework import serializers
from django.db import transaction as db_transaction
from django.utils import timezone
from django.conf import settings
from .models import Transaction, TransactionStatusHistory, Comment
from users.models import User
from users.serializers import UserListSerializer


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for transaction comments
    """
    user = UserListSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'is_internal', 'user', 'user_name',
            'created_at', 'updated_at', 'is_deleted'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_deleted']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['transaction'] = self.context.get('transaction')
        return super().create(validated_data)


class TransactionStatusHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for transaction status history
    """
    changed_by = UserListSerializer(read_only=True)
    previous_status_display = serializers.CharField(source='get_previous_status_display', read_only=True)
    new_status_display = serializers.CharField(source='get_new_status_display', read_only=True)
    
    class Meta:
        model = TransactionStatusHistory
        fields = [
            'id', 'previous_status', 'new_status', 'previous_status_display',
            'new_status_display', 'changed_by', 'change_reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TransactionListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for transaction lists
    """
    created_by = UserListSerializer(read_only=True)
    assigned_to = UserListSerializer(read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    client = UserListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'title', 'reference_number', 'client_name',
            'transaction_type', 'status',
            'status_display', 'priority', 'priority_display', 'due_date',
            'created_by', 'assigned_to', 'assigned_to_name', 'client', 'created_at', 'updated_at',
            'is_overdue', 'days_until_due', 'comment_count', 'attachment_count'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'created_at', 'updated_at',
            'is_overdue', 'days_until_due'
        ]
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_comment_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()


class TransactionSerializer(serializers.ModelSerializer):
    """
    Full transaction serializer for CRUD operations
    """
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    attachments = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()
    status_history = TransactionStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'title', 'reference_number', 'client_name',
            'transaction_type', 'description',
            'status', 'status_display', 'priority', 'priority_display',
            'due_date', 'department', 'project_id', 'tags', 'internal_notes',
            'created_by_name', 'assigned_to_name',
            'attachments', 'attachments_count', 'status_history',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_attachments(self, obj):
        from attachments.serializers import AttachmentSerializer
        attachments = obj.attachments.filter(is_deleted=False)
        return AttachmentSerializer(attachments, many=True, context=self.context).data

    def get_attachments_count(self, obj):
        return obj.attachments.filter(is_deleted=False).count()

    def to_representation(self, instance):
        """Override to hide internal_notes from clients"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.role == 'client':
            # Remove internal_notes for client users
            data.pop('internal_notes', None)
        return data
    
    def validate_assigned_to(self, value):
        """
        Validate that assigned user is admin or editor
        """
        if value and value.role not in ['admin', 'editor']:
            raise serializers.ValidationError("Only admin or editor users can be assigned to transactions")
        return value
    
    def validate_client(self, value):
        """
        Validate that client user has client role
        """
        if value and value.role != 'client':
            raise serializers.ValidationError("Only client users can be set as transaction clients")
        return value
    
    def validate_status(self, value):
        """
        Validate status transitions
        """
        if self.instance:
            # Skip validation if status is not changing
            if value == self.instance.status:
                return value

            user = self.context.get('request').user
            if not self.instance.can_change_status_to(value, user):
                raise serializers.ValidationError(
                    f"Cannot change status from {self.instance.status} to {value}"
                )
        return value
    
    def validate_due_date(self, value):
        """
        Validate due date is not in the past
        """
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value

    def validate(self, attrs):
        """Additional validation for the entire object"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            # Prevent clients from updating internal_notes
            if user.role == 'client' and 'internal_notes' in attrs:
                attrs.pop('internal_notes', None)
        return super().validate(attrs)
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        
        # If no client is specified and user is a client, assign to them
        user = self.context['request'].user
        if not validated_data.get('client') and user.role == 'client':
            validated_data['client'] = user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle status changes with proper logging
        if 'status' in validated_data and validated_data['status'] != instance.status:
            user = self.context['request'].user
            new_status = validated_data['status']
            
            # Remove status from validated_data as it will be handled by change_status
            validated_data.pop('status')
            
            # Update other fields first
            instance = super().update(instance, validated_data)
            
            # Change status with logging
            success = instance.change_status(new_status, user, "Status changed via API")
            if not success:
                raise serializers.ValidationError(
                    f"Cannot change status from {instance.status} to {new_status}"
                )
            
            return instance
        
        return super().update(instance, validated_data)


class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for transaction creation with validation
    """
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'title', 'reference_number', 'client_name', 'transaction_type',
            'description', 'priority', 'due_date',
            'department', 'project_id', 'tags', 'internal_notes', 'assigned_to', 'client'
        ]
        read_only_fields = ['id', 'transaction_id']
    
    def validate_assigned_to(self, value):
        if value and value.role not in ['admin', 'editor']:
            raise serializers.ValidationError("Only admin or editor users can be assigned to transactions")
        return value
    
    def validate_client(self, value):
        if value and value.role != 'client':
            raise serializers.ValidationError("Only client users can be set as transaction clients")
        return value
    
    def validate_due_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = 'draft'
        
        # If no client is specified and user is a client, assign to them
        user = self.context['request'].user
        if not validated_data.get('client') and user.role == 'client':
            validated_data['client'] = user
        
        return super().create(validated_data)


class TransactionStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for transaction status updates
    """
    status = serializers.ChoiceField(choices=settings.TRANSACTION_STATUSES)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_status(self, value):
        transaction = self.context.get('transaction')
        user = self.context.get('request').user
        
        if transaction and not transaction.can_change_status_to(value, user):
            raise serializers.ValidationError(
                f"Cannot change status from {transaction.status} to {value}"
            )
        
        return value


class TransactionAssignmentSerializer(serializers.Serializer):
    """
    Serializer for transaction assignment
    """
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Will be set in __init__
        allow_null=True,
        required=False
    )
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only allow assignment to admin or editor users
        from users.models import User
        self.fields['assigned_to'].queryset = User.objects.filter(
            role__in=['admin', 'editor'],
            is_active=True
        )


class TransactionFilterSerializer(serializers.Serializer):
    """
    Serializer for transaction filtering parameters
    """
    status = serializers.MultipleChoiceField(
        choices=settings.TRANSACTION_STATUSES,
        required=False
    )
    priority = serializers.MultipleChoiceField(
        choices=settings.TRANSACTION_PRIORITIES,
        required=False
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Will be set in __init__
        many=True,
        required=False
    )
    client = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Will be set in __init__
        many=True,
        required=False
    )
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Will be set in __init__
        many=True,
        required=False
    )
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    due_date_from = serializers.DateField(required=False)
    due_date_to = serializers.DateField(required=False)
    overdue = serializers.BooleanField(required=False)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from users.models import User
        
        # Set querysets for user fields
        active_users = User.objects.filter(is_active=True)
        self.fields['assigned_to'].queryset = active_users.filter(role__in=['admin', 'editor'])
        self.fields['client'].queryset = active_users.filter(role='client')
        self.fields['created_by'].queryset = active_users
    
    def validate(self, attrs):
        # Validate date ranges
        if attrs.get('date_from') and attrs.get('date_to'):
            if attrs['date_from'] > attrs['date_to']:
                raise serializers.ValidationError("date_from must be before date_to")
        
        if attrs.get('due_date_from') and attrs.get('due_date_to'):
            if attrs['due_date_from'] > attrs['due_date_to']:
                raise serializers.ValidationError("due_date_from must be before due_date_to")
        
        return attrs


class BulkTransactionOperationSerializer(serializers.Serializer):
    """
    Serializer for bulk transaction operations
    """
    transaction_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100
    )
    action = serializers.ChoiceField(
        choices=['assign', 'change_status', 'delete', 'bulk_update']
    )
    
    # Optional fields based on action
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Will be set in __init__
        allow_null=True,
        required=False
    )
    status = serializers.ChoiceField(
        choices=settings.TRANSACTION_STATUSES,
        required=False
    )
    priority = serializers.ChoiceField(
        choices=settings.TRANSACTION_PRIORITIES,
        required=False
    )
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from users.models import User
        self.fields['assigned_to'].queryset = User.objects.filter(
            role__in=['admin', 'editor'],
            is_active=True
        )
    
    def validate_transaction_ids(self, value):
        # Check if all transaction IDs exist
        existing_transactions = Transaction.objects.filter(
            id__in=value,
            is_deleted=False
        ).count()
        if existing_transactions != len(value):
            raise serializers.ValidationError("Some transaction IDs don't exist")
        return value
    
    def validate(self, attrs):
        action = attrs.get('action')
        
        # Validate required fields for each action
        if action == 'assign' and not attrs.get('assigned_to'):
            raise serializers.ValidationError("assigned_to is required for assign action")
        
        if action == 'change_status' and not attrs.get('status'):
            raise serializers.ValidationError("status is required for change_status action")
        
        return attrs


class TransactionStatisticsSerializer(serializers.Serializer):
    """
    Serializer for transaction statistics
    """
    total_transactions = serializers.IntegerField()
    by_status = serializers.DictField()
    by_priority = serializers.DictField()
    overdue_count = serializers.IntegerField()
    completed_this_month = serializers.IntegerField()
    created_this_month = serializers.IntegerField()
    avg_completion_time = serializers.FloatField()
    pending_assignments = serializers.IntegerField()
    top_clients = serializers.ListField()
    recent_activity = serializers.ListField()