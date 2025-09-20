"""
Transaction models for the MDC Transaction Tracking System.

This module contains the Transaction model and related functionality for managing
transactions, status history, and comments according to the system architecture.
"""

import uuid
import qrcode
import base64
from io import BytesIO
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.conf import settings
from django.urls import reverse
from users.models import User

try:
    from django.contrib.postgres.fields import ArrayField
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False


def generate_transaction_id():
    """Generate unique transaction ID in format TRX-YYYY-NNNNN"""
    from django.utils import timezone
    
    year = timezone.now().year
    prefix = f"{settings.MDC_SETTINGS['TRANSACTION_ID_PREFIX']}-{year}-"
    
    # Get the last transaction ID for this year
    last_transaction = Transaction.objects.filter(
        transaction_id__startswith=prefix
    ).order_by('-created_at').first()
    
    if last_transaction:
        # Extract the number part and increment
        last_number = int(last_transaction.transaction_id.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:05d}"


class Transaction(models.Model):
    """
    Main transaction model representing work processes in the system.

    Each transaction has a lifecycle with status changes, can be assigned
    to editors, and supports file attachments and comments.
    """

    STATUS_CHOICES = settings.TRANSACTION_STATUSES
    PRIORITY_CHOICES = settings.TRANSACTION_PRIORITIES
    
    # Core identification
    transaction_id = models.CharField(
        _('transaction ID'),
        max_length=20,
        unique=True,
        help_text=_('Auto-generated unique transaction identifier')
    )
    
    reference_number = models.CharField(
        _('reference number'),
        max_length=50,
        blank=True,
        help_text=_('External client reference number')
    )

    title = models.CharField(
        _('title'),
        max_length=255,
        default='',
        help_text=_('Transaction title or brief description')
    )

    # Basic information
    client_name = models.CharField(
        _('client name'),
        max_length=255,
        help_text=_('Name of the client or organization')
    )
    
    transaction_type = models.CharField(
        _('transaction type'),
        max_length=50,
        help_text=_('Type of work or process')
    )

    description = models.TextField(
        _('description'),
        max_length=2000,
        blank=True,
        help_text=_('Detailed description of the transaction')
    )
    
    # Status and priority
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text=_('Current transaction status')
    )
    
    priority = models.CharField(
        _('priority'),
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        help_text=_('Transaction priority level')
    )
    
    # Dates
    due_date = models.DateField(
        _('due date'),
        null=True,
        blank=True,
        help_text=_('Expected completion date')
    )
    
    # User relationships
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_transactions',
        verbose_name=_('created by'),
        help_text=_('User who created this transaction')
    )
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_transactions',
        verbose_name=_('assigned to'),
        limit_choices_to={'role__in': ['admin', 'editor']},
        help_text=_('Editor responsible for processing this transaction')
    )
    
    client = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_transactions',
        verbose_name=_('client'),
        limit_choices_to={'role': 'client'},
        help_text=_('Client user associated with this transaction')
    )
    
    # Additional fields
    department = models.CharField(
        _('department'),
        max_length=100,
        blank=True,
        help_text=_('Responsible department')
    )
    
    project_id = models.CharField(
        _('project ID'),
        max_length=50,
        blank=True,
        help_text=_('Related project identifier')
    )
    
    qr_code = models.TextField(
        _('QR code'),
        blank=True,
        help_text=_('Base64 encoded QR code for quick access')
    )
    
    # For now, use a simple text field for tags (comma-separated)
    tags = models.TextField(
        _('tags'),
        blank=True,
        help_text=_('Searchable keywords (comma-separated)')
    )

    internal_notes = models.TextField(
        _('internal notes'),
        blank=True,
        help_text=_('Internal notes not visible to clients')
    )

    # Timestamps
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )

    # Version for optimistic locking
    version = models.IntegerField(
        _('version'),
        default=1,
        help_text=_('Version number for optimistic locking')
    )
    
    # Soft delete
    is_deleted = models.BooleanField(
        _('is deleted'),
        default=False,
        help_text=_('Soft delete flag')
    )
    
    deleted_at = models.DateTimeField(
        _('deleted at'),
        null=True,
        blank=True
    )
    
    deleted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_transactions',
        verbose_name=_('deleted by')
    )
    
    class Meta:
        verbose_name = _('Transaction')
        verbose_name_plural = _('Transactions')
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['client']),
            models.Index(fields=['created_at']),
            models.Index(fields=['due_date']),
            # Full-text search index will be added in migration
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.client_name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate transaction ID if not set
        if not self.transaction_id:
            self.transaction_id = generate_transaction_id()

        # Generate QR code if not exists
        if not self.qr_code:
            self.generate_qr_code()

        # Increment version if updating existing record
        if self.pk:
            self.version = models.F('version') + 1

        super().save(*args, **kwargs)

        # Refresh from db to get the actual version value
        if self.pk:
            self.refresh_from_db(fields=['version'])
    
    def generate_qr_code(self):
        """Generate QR code for transaction."""
        qr_data = {
            'transaction_id': self.transaction_id,
            'url': f"{settings.MDC_SETTINGS['FRONTEND_URL']}/transactions/{self.id}",
            'type': 'transaction'
        }
        
        qr = qrcode.QRCode(
            version=1,
            box_size=settings.MDC_SETTINGS['QR_CODE_SIZE'],
            border=settings.MDC_SETTINGS['QR_CODE_BORDER']
        )
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        # Generate image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        self.qr_code = f"data:image/png;base64,{img_base64}"
    
    def get_absolute_url(self):
        """Get absolute URL for transaction."""
        return reverse('transaction-detail', kwargs={'pk': self.pk})
    
    def get_status_display_with_color(self):
        """Get status display with appropriate color class."""
        status_colors = {
            'draft': 'secondary',
            'submitted': 'info',
            'under_review': 'warning',
            'approved': 'success',
            'in_progress': 'primary',
            'completed': 'success',
            'cancelled': 'danger',
            'on_hold': 'warning',
        }
        return {
            'status': self.get_status_display(),
            'color': status_colors.get(self.status, 'secondary')
        }
    
    def get_priority_display_with_color(self):
        """Get priority display with appropriate color class."""
        priority_colors = {
            'low': 'success',
            'normal': 'info',
            'high': 'warning',
            'urgent': 'danger',
        }
        return {
            'priority': self.get_priority_display(),
            'color': priority_colors.get(self.priority, 'info')
        }
    
    @property
    def is_overdue(self):
        """Check if transaction is overdue."""
        from django.utils import timezone
        if self.due_date and self.status not in ['completed', 'cancelled']:
            return timezone.now().date() > self.due_date
        return False
    
    @property
    def days_until_due(self):
        """Calculate days until due date."""
        from django.utils import timezone
        if self.due_date:
            delta = self.due_date - timezone.now().date()
            return delta.days
        return None
    
    def generate_qr_code(self):
        """
        Generate QR code for transaction.
        
        Returns:
            str: Base64 encoded QR code image
        """
        import qrcode
        from io import BytesIO
        import base64
        
        # Create QR code data
        qr_data = {
            'transaction_id': self.transaction_id,
            'reference_number': self.reference_number,
            'status': self.status,
            'client': self.client_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    @property
    def qr_code_url(self):
        """Get URL for QR code generation endpoint."""
        return f"/api/v1/transactions/{self.id}/qr-code/"
    
    def can_change_status_to(self, new_status, user):
        """
        Check if status can be changed to new_status by user.

        Args:
            new_status: Target status
            user: User attempting the change

        Returns:
            bool: True if status change is allowed
        """
        # If status is not changing, always allow
        if new_status == self.status:
            return True

        # Check user permissions first
        # Admin can bypass workflow restrictions
        if user.role == 'admin':
            # Admin can reopen cancelled transactions but not completed ones
            if self.status == 'completed':
                return False  # Completed is permanently closed
            # Admin can transition cancelled back to any status except completed
            if self.status == 'cancelled':
                return new_status != 'completed'
            return True  # Admin can make any other transition

        # Define valid status transitions for non-admin users
        valid_transitions = {
            'draft': ['submitted', 'cancelled'],
            'submitted': ['under_review', 'draft', 'cancelled'],
            'under_review': ['approved', 'submitted', 'cancelled'],
            'approved': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'on_hold', 'cancelled'],
            'completed': [],  # Cannot change from completed
            'cancelled': [],  # Cannot change from cancelled
            'on_hold': ['in_progress', 'cancelled'],
        }

        # Check if transition is valid for non-admin users
        if new_status not in valid_transitions.get(self.status, []):
            return False

        # Check permissions for non-admin users
        if user.role == 'editor':
            # Editors can change status of assigned or created transactions
            if self.assigned_to == user or self.created_by == user:
                # Editors cannot approve (under_review -> approved)
                if new_status == 'approved' and self.status == 'under_review':
                    return False
                return True
        elif user.role == 'client':
            # Clients can only change status of their own draft transactions
            if self.client == user and self.status == 'draft':
                # Clients can only submit or cancel draft transactions
                if new_status in ['submitted', 'cancelled']:
                    return True

        return False
    
    def change_status(self, new_status, user, reason=None):
        """
        Change transaction status with proper validation and logging.
        
        Args:
            new_status: Target status
            user: User making the change
            reason: Optional reason for the change
            
        Returns:
            bool: True if status was changed successfully
        """
        if not self.can_change_status_to(new_status, user):
            return False
        
        old_status = self.status
        self.status = new_status
        self.save()
        
        # Create status history record
        TransactionStatusHistory.objects.create(
            transaction=self,
            previous_status=old_status,
            new_status=new_status,
            changed_by=user,
            change_reason=reason or ''
        )
        
        return True
    
    def soft_delete(self, user, reason=None):
        """
        Soft delete the transaction.
        
        Args:
            user: User performing the deletion
            reason: Optional reason for deletion
        """
        from django.utils import timezone
        
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()


class TransactionStatusHistory(models.Model):
    """
    History of transaction status changes for audit trail.
    """
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name=_('transaction')
    )
    
    previous_status = models.CharField(
        _('previous status'),
        max_length=20,
        blank=True,
        help_text=_('Status before the change')
    )
    
    new_status = models.CharField(
        _('new status'),
        max_length=20,
        help_text=_('Status after the change')
    )
    
    changed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='status_changes',
        verbose_name=_('changed by')
    )
    
    change_reason = models.TextField(
        _('change reason'),
        blank=True,
        help_text=_('Optional reason for the status change')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    class Meta:
        verbose_name = _('Transaction Status History')
        verbose_name_plural = _('Transaction Status Histories')
        db_table = 'transaction_status_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction.transaction_id}: {self.previous_status} → {self.new_status}"


class Comment(models.Model):
    """
    Comments on transactions for communication and notes.
    """
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('transaction')
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='transaction_comments',
        verbose_name=_('user')
    )
    
    content = models.TextField(
        _('content'),
        help_text=_('Comment content')
    )
    
    is_internal = models.BooleanField(
        _('is internal'),
        default=True,
        help_text=_('Internal comments are not visible to clients')
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    is_deleted = models.BooleanField(
        _('is deleted'),
        default=False
    )
    
    class Meta:
        verbose_name = _('Comment')
        verbose_name_plural = _('Comments')
        db_table = 'comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Comment on {self.transaction.transaction_id} by {self.user.get_display_name()}"
    
    @property
    def is_visible_to_client(self):
        """Check if comment is visible to client."""
        return not self.is_internal
