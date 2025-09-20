"""
Custom permissions for MDC Transaction Tracking System
"""

from rest_framework import permissions
from django.contrib.auth.models import AnonymousUser
from users.models import User


class IsActiveUser(permissions.BasePermission):
    """
    Permission to check if user is active and approved
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active'
        )


class IsAdminUser(permissions.BasePermission):
    """
    Permission for admin users only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active' and
            request.user.role == 'admin'
        )


class IsEditorOrAdmin(permissions.BasePermission):
    """
    Permission for editor and admin users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active' and
            request.user.role in ['admin', 'editor']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for object owner or admin users
    """
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if (request.user.role == 'admin' and 
            request.user.status == 'active' and 
            request.user.is_active):
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'client'):
            return obj.client == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif isinstance(obj, User):
            return obj == request.user
        
        return False


class CanApproveUsers(permissions.BasePermission):
    """
    Permission for users who can approve other users (admin only)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active' and
            request.user.role == 'admin'
        )


class CanManageTransactions(permissions.BasePermission):
    """
    Permission for users who can manage transactions (admin and editor)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active' and
            request.user.role in ['admin', 'editor']
        )


class CanViewTransaction(permissions.BasePermission):
    """
    Permission to view transactions based on role
    """
    def has_object_permission(self, request, view, obj):
        # Admin and editors can view all transactions
        if request.user.role in ['admin', 'editor']:
            return True
        
        # Clients can only view their own transactions
        if request.user.role == 'client':
            return obj.client == request.user
        
        return False


class CanModifyTransaction(permissions.BasePermission):
    """
    Permission to modify transactions based on role and status
    """
    def has_object_permission(self, request, view, obj):
        # Admin can modify all transactions
        if request.user.role == 'admin':
            return True
        
        # Editors can modify transactions except completed ones
        if request.user.role == 'editor':
            return obj.status not in ['completed', 'cancelled']
        
        # Clients can only modify their draft transactions
        if request.user.role == 'client':
            return (obj.client == request.user and 
                   obj.status == 'draft')
        
        return False


class CanUploadFiles(permissions.BasePermission):
    """
    Permission to upload files to transactions
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active'
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin and editors can upload to any transaction
        if request.user.role in ['admin', 'editor']:
            return True
        
        # Clients can upload to their own transactions if not completed
        if request.user.role == 'client':
            return (obj.client == request.user and 
                   obj.status not in ['completed', 'cancelled'])
        
        return False


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Read-only permission for all users, admin can modify
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user and 
                not isinstance(request.user, AnonymousUser) and 
                request.user.is_active and 
                request.user.status == 'active'
            )
        
        return (
            request.user and 
            not isinstance(request.user, AnonymousUser) and 
            request.user.is_active and 
            request.user.status == 'active' and
            request.user.role == 'admin'
        )