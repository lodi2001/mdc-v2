"""
Utility functions for MDC Transaction Tracking System
"""

import os
import qrcode
import logging
import mimetypes
from io import BytesIO
from PIL import Image
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from rest_framework.response import Response
from rest_framework import status


logger = logging.getLogger(__name__)


def generate_transaction_id():
    """
    Generate unique transaction ID with prefix
    """
    prefix = settings.MDC_SETTINGS.get('TRANSACTION_ID_PREFIX', 'TRX')
    random_part = get_random_string(8, allowed_chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    return f"{prefix}-{random_part}"


def generate_qr_code(data, size=None, border=None):
    """
    Generate QR code for transaction data
    """
    qr_size = size or settings.MDC_SETTINGS.get('QR_CODE_SIZE', 10)
    qr_border = border or settings.MDC_SETTINGS.get('QR_CODE_BORDER', 4)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=qr_size,
        border=qr_border,
    )
    
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return ContentFile(buffer.getvalue(), name='qr_code.png')


def validate_file_extension(filename):
    """
    Validate file extension against allowed extensions
    """
    if not filename:
        return False
    
    ext = filename.split('.')[-1].lower()
    allowed_extensions = settings.ALLOWED_FILE_EXTENSIONS
    
    return ext in allowed_extensions


def validate_file_size(file):
    """
    Validate file size against maximum allowed size
    """
    max_size = settings.MAX_FILE_SIZE
    return file.size <= max_size


def validate_mime_type(file):
    """
    Validate MIME type against allowed types
    """
    mime_type, _ = mimetypes.guess_type(file.name)
    if not mime_type:
        return False
    
    allowed_mime_types = settings.ALLOWED_MIME_TYPES
    return mime_type in allowed_mime_types


def scan_file_for_virus(file):
    """
    Simulate virus scanning (placeholder for actual implementation)
    In production, integrate with ClamAV or similar
    """
    # Placeholder - always returns True (no virus)
    # In production, implement actual virus scanning
    logger.info(f"Scanning file {file.name} for viruses")
    return True


def send_notification_email(recipient_email, subject, template_name, context, from_email=None):
    """
    Send notification email using HTML template
    """
    try:
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        # Render HTML template
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=from_email,
            to=[recipient_email]
        )
        email.attach_alternative(html_message, "text/html")
        
        # Send email
        email.send()
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False


def send_bulk_notification_emails(recipients, subject, template_name, context, from_email=None):
    """
    Send bulk notification emails
    """
    success_count = 0
    for recipient in recipients:
        if send_notification_email(recipient, subject, template_name, context, from_email):
            success_count += 1
    
    return success_count


def create_audit_log_entry(user, action, object_type, object_id, details=None):
    """
    Create audit log entry
    """
    try:
        from audit.models import AuditLog
        from django.contrib.contenttypes.models import ContentType
        
        # Map actions to valid choices
        action_map = {
            'upload': 'file_upload',
            'download': 'file_download',
            'delete': 'delete',
            'create': 'create',
            'update': 'update',
            'virus_scan': 'other',
            'bulk_delete': 'delete',
            'bulk_toggle_visibility': 'update',
            'bulk_update_description': 'update',
        }
        mapped_action = action_map.get(action, action)
        
        # Ensure action is valid
        valid_actions = dict(AuditLog.ACTION_CHOICES).keys()
        if mapped_action not in valid_actions:
            mapped_action = 'other'
        
        # Create audit log with available fields
        AuditLog.objects.create(
            user=user,
            action=mapped_action,
            table_name=object_type or '',
            record_id=int(object_id) if object_id and str(object_id).isdigit() else None,
            new_values=details or {},
            description=f"{action} {object_type} {object_id}",
            ip_address=getattr(user, '_ip_address', None) or '127.0.0.1',
            user_agent=getattr(user, '_user_agent', None) or 'MDC-System/1.0'
        )
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}")


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """
    Get user agent from request
    """
    return request.META.get('HTTP_USER_AGENT', '')


def paginate_queryset(request, queryset, page_size=None):
    """
    Paginate queryset with custom page size
    """
    from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
    
    page_size = page_size or settings.MDC_SETTINGS.get('PAGINATION_SIZE', 20)
    
    # Allow client to specify page size (with limits)
    requested_page_size = request.GET.get('page_size')
    if requested_page_size:
        try:
            page_size = min(int(requested_page_size), 100)  # Max 100 items per page
        except ValueError:
            pass
    
    paginator = Paginator(queryset, page_size)
    page = request.GET.get('page')
    
    try:
        paginated_items = paginator.page(page)
    except PageNotAnInteger:
        paginated_items = paginator.page(1)
    except EmptyPage:
        paginated_items = paginator.page(paginator.num_pages)
    
    return {
        'items': paginated_items,
        'paginator': paginator,
        'page_number': paginated_items.number,
        'total_pages': paginator.num_pages,
        'total_items': paginator.count,
        'has_next': paginated_items.has_next(),
        'has_previous': paginated_items.has_previous(),
    }


def create_success_response(message, data=None, status_code=status.HTTP_200_OK):
    """
    Create standardized success response
    """
    response_data = {
        'success': True,
        'message': message,
    }
    
    if data is not None:
        response_data['data'] = data
    
    return Response(response_data, status=status_code)


def create_error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Create standardized error response
    """
    response_data = {
        'success': False,
        'message': message,
    }
    
    if errors:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)


def format_file_size(size_bytes):
    """
    Format file size in human readable format
    """
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


def clean_filename(filename):
    """
    Clean filename by removing special characters
    """
    import re
    # Remove path separators and special characters
    filename = re.sub(r'[^\w\.-]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:90] + ext
    
    return filename


def get_file_icon(filename):
    """
    Get file icon based on extension
    """
    if not filename:
        return 'file'
    
    ext = filename.split('.')[-1].lower()
    
    icon_mapping = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'docx': 'file-word',
        'xls': 'file-excel',
        'xlsx': 'file-excel',
        'txt': 'file-text',
        'csv': 'file-csv',
        'jpg': 'file-image',
        'jpeg': 'file-image',
        'png': 'file-image',
        'gif': 'file-image',
    }
    
    return icon_mapping.get(ext, 'file')


def log_user_action(user, action, resource_type=None, resource_id=None, metadata=None):
    """
    Log user action using create_audit_log_entry
    """
    return create_audit_log_entry(
        user=user,
        action=action,
        object_type=resource_type,
        object_id=resource_id,
        details=metadata
    )


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip