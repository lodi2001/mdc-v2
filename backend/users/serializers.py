"""
Serializers for User Management API
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User
from .validators import validate_saudi_id, validate_phone_number


class UserSerializer(serializers.ModelSerializer):
    """
    Full user serializer for CRUD operations
    """
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    username = serializers.CharField(required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'role', 'status',
            'phone_number', 'national_id', 'company_name',
            'date_joined', 'last_login', 'is_active', 'language_preference',
            'created_by', 'email_verified'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_by']
        extra_kwargs = {
            'national_id': {'required': False},
            'phone_number': {'required': False},
            'company_name': {'required': False},
        }
    
    def validate(self, attrs):
        """
        Generate username from email if not provided
        """
        if not attrs.get('username'):
            # Generate username from email
            email = attrs.get('email', '')
            if email:
                attrs['username'] = email.split('@')[0]
                # Ensure uniqueness
                base_username = attrs['username']
                counter = 1
                while User.objects.filter(username=attrs['username']).exists():
                    attrs['username'] = f"{base_username}{counter}"
                    counter += 1
        return attrs
    
    def validate_email(self, value):
        """
        Validate unique email
        """
        if self.instance:
            # Update case - exclude current instance
            if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Email already exists")
        else:
            # Create case
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_username(self, value):
        """
        Validate unique username
        """
        if self.instance:
            if User.objects.filter(username=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Username already exists")
        else:
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_national_id(self, value):
        """
        Validate unique National ID
        """
        if value:
            if self.instance:
                if User.objects.filter(national_id=value).exclude(id=self.instance.id).exists():
                    raise serializers.ValidationError("National ID already exists")
            else:
                if User.objects.filter(national_id=value).exists():
                    raise serializers.ValidationError("National ID already exists")
        return value
    
    def create(self, validated_data):
        """
        Create user with encrypted password
        """
        password = validated_data.pop('password', None)
        
        # If created by admin, set status to active
        request = self.context.get('request')
        if request and request.user.role == 'admin':
            # Admin creating user - use provided status or default to active
            if 'status' not in validated_data:
                validated_data['status'] = 'active'
            if 'is_active' not in validated_data:
                validated_data['is_active'] = True
        else:
            # Self-registration - set as pending
            validated_data['status'] = 'pending'
            validated_data['is_active'] = False
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        return user
    
    def update(self, instance, validated_data):
        """
        Update user with password handling
        """
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list view with role filtering
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role',
            'status', 'company_name', 'date_joined', 'last_login', 'is_active'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile updates
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'company_name',
            'language_preference'
        ]
        read_only_fields = ['id', 'username']
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Email already exists")
        return value


class UserApprovalSerializer(serializers.Serializer):
    """
    Serializer for user approval operations
    """
    user_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value, status='pending')
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or not in pending status")


class PendingUserSerializer(serializers.ModelSerializer):
    """
    Serializer for pending user registrations
    """
    full_name = serializers.SerializerMethodField()
    days_pending = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role',
            'company_name', 'phone_number', 'national_id',
            'date_joined', 'days_pending'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_days_pending(self, obj):
        from django.utils import timezone
        return (timezone.now() - obj.date_joined).days


class BulkUserOperationSerializer(serializers.Serializer):
    """
    Serializer for bulk user operations
    """
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100
    )
    action = serializers.ChoiceField(
        choices=['activate', 'deactivate', 'delete', 'approve', 'reject']
    )
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_user_ids(self, value):
        # Check if all user IDs exist
        existing_users = User.objects.filter(id__in=value).count()
        if existing_users != len(value):
            raise serializers.ValidationError("Some user IDs don't exist")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No active user found with this email")


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone_number', 'national_id',
            'role', 'company_name', 'language_preference'
        ]
        extra_kwargs = {
            'national_id': {'validators': [validate_saudi_id]},
            'phone_number': {'validators': [validate_phone_number]},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_national_id(self, value):
        if value and User.objects.filter(national_id=value).exists():
            raise serializers.ValidationError("National ID already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Set default status for registration
        validated_data['status'] = 'pending'
        validated_data['is_active'] = False
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


# SystemSettingsSerializer removed - now handled by system_settings app


class UserStatisticsSerializer(serializers.Serializer):
    """
    Serializer for user statistics
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    pending_users = serializers.IntegerField()
    suspended_users = serializers.IntegerField()
    users_by_role = serializers.DictField()
    recent_registrations = serializers.IntegerField()
    login_activity = serializers.DictField()