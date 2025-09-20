"""
Custom throttling classes for MDC Transaction Tracking System
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AuthThrottle(UserRateThrottle):
    """
    Throttling for authentication endpoints
    """
    scope = 'auth'


class UploadThrottle(UserRateThrottle):
    """
    Throttling for file upload endpoints
    """
    scope = 'upload'


class BulkOperationThrottle(UserRateThrottle):
    """
    Throttling for bulk operations
    """
    scope = 'bulk'


class StrictAnonRateThrottle(AnonRateThrottle):
    """
    Strict throttling for anonymous users
    """
    scope = 'anon'


class NotificationThrottle(UserRateThrottle):
    """
    Throttling for notification endpoints
    """
    scope = 'notifications'
    rate = '50/hour'


class AdminThrottle(UserRateThrottle):
    """
    Throttling for admin-only endpoints
    """
    scope = 'admin'
    rate = '200/hour'