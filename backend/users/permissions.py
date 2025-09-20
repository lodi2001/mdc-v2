"""
Custom permission classes for user-based access control.
"""

from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    """
    Permission to check if user is active.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active


class IsAdminUser(BasePermission):
    """
    Permission to check if user has admin role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active and
            getattr(request.user, 'role', None) == 'admin'
        )


class IsEditorUser(BasePermission):
    """
    Permission to check if user has editor role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active and
            getattr(request.user, 'role', None) == 'editor'
        )


class IsClientUser(BasePermission):
    """
    Permission to check if user has client role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active and
            getattr(request.user, 'role', None) == 'client'
        )


class IsAdminOrEditor(BasePermission):
    """
    Permission to check if user is admin or editor.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active and
            getattr(request.user, 'role', None) in ['admin', 'editor']
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Permission to check if user is owner of object or admin.
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is admin
        if getattr(request.user, 'role', None) == 'admin':
            return True
        
        # Check if user is owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'client'):
            return obj.client == request.user
            
        return False