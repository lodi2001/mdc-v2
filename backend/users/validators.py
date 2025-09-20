"""
Custom validators for Users app
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_saudi_id(value):
    """
    Validate Saudi National ID format
    Saudi ID should be 10 digits
    """
    if not value:
        return value
    
    # Remove any spaces or dashes
    value = re.sub(r'[-\s]', '', value)
    
    # Check if it's 10 digits
    if not re.match(r'^\d{10}$', value):
        raise ValidationError(
            _('Saudi ID must be 10 digits long'),
            code='invalid_saudi_id'
        )
    
    # Additional validation for Saudi ID algorithm can be added here
    return value


def validate_phone_number(value):
    """
    Validate phone number format
    Supports international format starting with +
    """
    if not value:
        return value
    
    # Remove spaces and dashes
    value = re.sub(r'[-\s]', '', value)
    
    # Check international format
    if not re.match(r'^\+?1?\d{9,15}$', value):
        raise ValidationError(
            _('Phone number must be in international format (+1234567890) and 9-15 digits'),
            code='invalid_phone_number'
        )
    
    return value


class ComplexityValidator:
    """
    Password complexity validator
    Requires at least one uppercase, lowercase, digit, and special character
    """
    
    def __init__(self, min_length=8):
        self.min_length = min_length
    
    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _('Password must be at least %(min_length)d characters long.') % {
                    'min_length': self.min_length
                },
                code='password_too_short',
            )
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _('Password must contain at least one uppercase letter.'),
                code='password_no_upper',
            )
        
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _('Password must contain at least one lowercase letter.'),
                code='password_no_lower',
            )
        
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _('Password must contain at least one digit.'),
                code='password_no_digit',
            )
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\'\\:"|,.<>\?]', password):
            raise ValidationError(
                _('Password must contain at least one special character.'),
                code='password_no_special',
            )
    
    def get_help_text(self):
        return _(
            'Your password must contain at least %(min_length)d characters, '
            'including uppercase and lowercase letters, digits, and special characters.'
        ) % {'min_length': self.min_length}