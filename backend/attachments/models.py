"""
Attachment models for the MDC Transaction Tracking System.

This module contains the Attachment model for handling file uploads
and document management with security scanning and access control.
"""

import os
import hashlib
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.files.storage import default_storage
from transactions.models import Transaction
from users.models import User


def upload_to(instance, filename):
    """
    Generate upload path for attachments.
    
    Args:
        instance: Attachment instance
        filename: Original filename
        
    Returns:
        str: Upload path
    """
    # Generate path: attachments/YYYY/MM/transaction_id/filename
    from django.utils import timezone
    
    now = timezone.now()
    return f"attachments/{now.year:04d}/{now.month:02d}/{instance.transaction.transaction_id}/{filename}"


class Attachment(models.Model):
    """
    File attachments for transactions with security and access control.
    
    Supports file upload validation, virus scanning, duplicate detection,
    and role-based visibility controls.
    """
    
    VIRUS_SCAN_STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('clean', _('Clean')),
        ('infected', _('Infected')),
        ('error', _('Error')),
    ]
    
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('transaction'),
        help_text=_('Transaction this attachment belongs to')
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='uploaded_attachments',
        verbose_name=_('uploaded by'),
        help_text=_('User who uploaded this file')
    )
    
    # File information
    original_filename = models.CharField(
        _('original filename'),
        max_length=255,
        help_text=_('Original name of the uploaded file')
    )
    
    stored_filename = models.CharField(
        _('stored filename'),
        max_length=255,
        help_text=_('Name used for storing the file on disk')
    )
    
    file_path = models.CharField(
        _('file path'),
        max_length=500,
        help_text=_('Full path to the stored file')
    )
    
    file_size = models.BigIntegerField(
        _('file size'),
        help_text=_('File size in bytes')
    )
    
    mime_type = models.CharField(
        _('MIME type'),
        max_length=100,
        help_text=_('MIME type of the file')
    )
    
    file_hash = models.CharField(
        _('file hash'),
        max_length=64,
        blank=True,
        help_text=_('SHA-256 hash for duplicate detection')
    )
    
    # Visibility and access control
    is_client_visible = models.BooleanField(
        _('is client visible'),
        default=True,
        help_text=_('Whether clients can see and download this file')
    )
    
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Optional description of the file')
    )
    
    # Security scanning
    virus_scan_status = models.CharField(
        _('virus scan status'),
        max_length=20,
        choices=VIRUS_SCAN_STATUS_CHOICES,
        default='pending',
        help_text=_('Status of virus scanning')
    )
    
    virus_scan_result = models.TextField(
        _('virus scan result'),
        blank=True,
        help_text=_('Details from virus scan')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    # Soft delete
    is_deleted = models.BooleanField(
        _('is deleted'),
        default=False
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
        related_name='deleted_attachments',
        verbose_name=_('deleted by')
    )
    
    class Meta:
        verbose_name = _('Attachment')
        verbose_name_plural = _('Attachments')
        db_table = 'attachments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['file_hash']),
            models.Index(fields=['is_client_visible']),
            models.Index(fields=['virus_scan_status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.transaction.transaction_id})"
    
    def save(self, *args, **kwargs):
        # Generate file hash if not set
        if not self.file_hash and hasattr(self, '_file_content'):
            self.file_hash = self.calculate_file_hash(self._file_content)
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def calculate_file_hash(file_content):
        """Calculate SHA-256 hash of file content."""
        hasher = hashlib.sha256()
        if hasattr(file_content, 'read'):
            # File-like object
            for chunk in iter(lambda: file_content.read(4096), b""):
                hasher.update(chunk)
            file_content.seek(0)  # Reset file pointer
        else:
            # Bytes content
            hasher.update(file_content)
        return hasher.hexdigest()
    
    @property
    def file_extension(self):
        """Get file extension."""
        return os.path.splitext(self.original_filename)[1].lower().lstrip('.')
    
    @property
    def is_image(self):
        """Check if file is an image."""
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        return self.file_extension in image_extensions
    
    @property
    def is_document(self):
        """Check if file is a document."""
        doc_extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
        return self.file_extension in doc_extensions
    
    @property
    def file_type_category(self):
        """Get file type category for display."""
        if self.is_image:
            return 'image'
        elif self.is_document:
            return 'document'
        else:
            return 'other'
    
    @property
    def file_size_formatted(self):
        """Get formatted file size."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    @property
    def is_safe_to_download(self):
        """Check if file is safe to download."""
        return self.virus_scan_status == 'clean'
    
    def can_be_accessed_by(self, user):
        """
        Check if user can access this attachment.
        
        Args:
            user: User instance
            
        Returns:
            bool: True if user can access the file
        """
        # Admins can access all files
        if user.is_admin:
            return True
        
        # Editors can access files on assigned transactions
        if user.is_editor:
            return (self.transaction.assigned_to == user or 
                   self.transaction.created_by == user)
        
        # Clients can only access client-visible files on their transactions
        if user.is_client:
            return (self.is_client_visible and 
                   self.transaction.client == user)
        
        return False
    
    def can_be_deleted_by(self, user):
        """
        Check if user can delete this attachment.
        
        Args:
            user: User instance
            
        Returns:
            bool: True if user can delete the file
        """
        # Admins can delete all files
        if user.is_admin:
            return True
        
        # Editors can delete files they uploaded on assigned transactions
        if user.is_editor:
            return (self.uploaded_by == user and 
                   (self.transaction.assigned_to == user or 
                    self.transaction.created_by == user))
        
        return False
    
    def get_download_url(self):
        """Get secure download URL for the file."""
        from django.urls import reverse
        return reverse('attachments:attachment-download', kwargs={'pk': self.pk})
    
    def soft_delete(self, user):
        """
        Soft delete the attachment.
        
        Args:
            user: User performing the deletion
        """
        from django.utils import timezone
        
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()
    
    def delete_file_from_storage(self):
        """Delete the actual file from storage."""
        if self.file_path and default_storage.exists(self.file_path):
            default_storage.delete(self.file_path)
    
    def get_file_content(self):
        """Get file content from storage."""
        if self.file_path and default_storage.exists(self.file_path):
            return default_storage.open(self.file_path, 'rb')
        return None
    
    def scan_for_virus(self):
        """
        Scan file for viruses using ClamAV or similar.
        
        Returns:
            bool: True if file is clean, False if infected
        """
        try:
            from django.utils import timezone
            # Mock virus scanning for now - in production, integrate with ClamAV
            import random
            import time
            
            # Simulate scanning delay
            time.sleep(0.5)
            
            # For demo purposes, randomly mark some files as infected (1% chance)
            is_infected = random.random() < 0.01
            
            if is_infected:
                self.virus_scan_status = 'infected'
                self.virus_scan_date = timezone.now()
                self.virus_scan_result = 'EICAR-Test-Signature'  # Mock virus name
                self.save()
                return False
            else:
                self.virus_scan_status = 'clean'
                self.virus_scan_date = timezone.now()
                self.virus_scan_result = 'No threats detected'
                self.save()
                return True
                
        except Exception as e:
            from django.utils import timezone
            self.virus_scan_status = 'error'
            self.virus_scan_date = timezone.now()
            self.virus_scan_result = str(e)
            self.save()
            return False
    
    def generate_preview(self):
        """
        Generate preview/thumbnail for the file.
        
        Returns:
            str: Base64 encoded preview image or None
        """
        try:
            if self.is_image:
                return self._generate_image_preview()
            elif self.file_extension == 'pdf':
                return self._generate_pdf_preview()
            else:
                return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate preview for {self.original_filename}: {str(e)}")
            return None
    
    def _generate_image_preview(self):
        """Generate thumbnail for image files."""
        try:
            from PIL import Image
            from io import BytesIO
            import base64
            
            file_content = self.get_file_content()
            if not file_content:
                return None
            
            # Open image
            img = Image.open(file_content)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Create thumbnail
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Save to bytes
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/jpeg;base64,{img_str}"
            
        except Exception as e:
            return None
    
    def _generate_pdf_preview(self):
        """Generate preview for PDF files (first page as image)."""
        try:
            # This would require pdf2image library in production
            # For now, return None
            return None
        except Exception:
            return None
    
    @classmethod
    def find_duplicate(cls, file_hash, transaction_id=None):
        """
        Find duplicate files by hash.
        
        Args:
            file_hash: SHA-256 hash of the file
            transaction_id: Optional transaction ID to exclude
            
        Returns:
            QuerySet: Duplicate attachments
        """
        queryset = cls.objects.filter(file_hash=file_hash, is_deleted=False)
        if transaction_id:
            queryset = queryset.exclude(transaction_id=transaction_id)
        return queryset
    
    @classmethod
    def validate_file_type(cls, filename, mime_type):
        """
        Validate if file type is allowed.
        
        Args:
            filename: Original filename
            mime_type: File MIME type
            
        Returns:
            bool: True if file type is allowed
            
        Raises:
            ValidationError: If file type is not allowed
        """
        from django.core.exceptions import ValidationError
        
        # Check file extension
        extension = os.path.splitext(filename)[1].lower().lstrip('.')
        if extension not in settings.ALLOWED_FILE_EXTENSIONS:
            raise ValidationError(
                _('File type ".%(ext)s" is not allowed. Allowed types: %(types)s') % {
                    'ext': extension,
                    'types': ', '.join(settings.ALLOWED_FILE_EXTENSIONS)
                }
            )
        
        # Check MIME type
        if mime_type not in settings.ALLOWED_MIME_TYPES:
            raise ValidationError(
                _('MIME type "%(mime)s" is not allowed.') % {
                    'mime': mime_type
                }
            )
        
        return True
    
    @classmethod
    def validate_file_size(cls, file_size):
        """
        Validate file size.
        
        Args:
            file_size: File size in bytes
            
        Returns:
            bool: True if file size is acceptable
            
        Raises:
            ValidationError: If file is too large
        """
        from django.core.exceptions import ValidationError
        
        if file_size > settings.MAX_FILE_SIZE:
            max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise ValidationError(
                _('File size (%(size).1f MB) exceeds maximum allowed size (%(max).1f MB).') % {
                    'size': file_size / (1024 * 1024),
                    'max': max_size_mb
                }
            )
        
        return True
