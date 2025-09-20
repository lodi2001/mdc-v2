"""
Audit middleware for the MDC Transaction Tracking System.

This middleware automatically logs certain actions and provides
audit trail capabilities for security and compliance.
"""

import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import AuditLog


class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log certain actions for audit trail.
    
    This middleware logs authentication events and can be extended
    to log other relevant system activities.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Connect to authentication signals
        user_logged_in.connect(self.log_login)
        user_logged_out.connect(self.log_logout)
    
    def process_request(self, request):
        """Process incoming request for audit logging."""
        # Store request start time for performance tracking
        from django.utils import timezone
        request._audit_start_time = timezone.now()
        return None
    
    def process_response(self, request, response):
        """Process response for audit logging."""
        # Log certain types of requests
        if self.should_log_request(request, response):
            self.log_request(request, response)
        
        return response
    
    def should_log_request(self, request, response):
        """
        Determine if a request should be logged.
        
        Args:
            request: Django request object
            response: Django response object
            
        Returns:
            bool: True if request should be logged
        """
        # Log failed authentication attempts
        if (request.path.endswith('/login/') and 
            request.method == 'POST' and 
            response.status_code in [400, 401, 403]):
            return True
        
        # Log permission denied responses
        if response.status_code in [401, 403]:
            return True
        
        # Log file download requests
        if '/download/' in request.path and response.status_code == 200:
            return True
        
        # Log admin panel access
        if request.path.startswith('/admin/') and request.method == 'GET':
            return True
        
        return False
    
    def log_request(self, request, response):
        """
        Log a request to the audit trail.
        
        Args:
            request: Django request object
            response: Django response object
        """
        try:
            user = getattr(request, 'user', None)
            if user and not user.is_authenticated:
                user = None
            
            action = self.determine_action(request, response)
            
            AuditLog.log_action(
                user=user,
                action=action,
                table_name='request',
                description=f"{request.method} {request.path}",
                request=request
            )
        except Exception as e:
            # Don't let audit logging break the application
            import logging
            logger = logging.getLogger('mdc_backend.audit')
            logger.error(f"Failed to log request: {e}")
    
    def determine_action(self, request, response):
        """
        Determine the action type for a request.
        
        Args:
            request: Django request object
            response: Django response object
            
        Returns:
            str: Action type
        """
        if response.status_code in [401, 403]:
            return 'permission_denied'
        elif '/download/' in request.path:
            return 'file_download'
        elif request.path.startswith('/admin/'):
            return 'view'
        elif request.path.endswith('/login/') and response.status_code in [400, 401, 403]:
            return 'login_failed'
        else:
            return 'other'
    
    @staticmethod
    def log_login(sender, request, user, **kwargs):
        """Signal handler for user login."""
        AuditLog.log_login(user, request, success=True)
    
    @staticmethod
    def log_logout(sender, request, user, **kwargs):
        """Signal handler for user logout."""
        AuditLog.log_logout(user, request)