"""
Custom exception handler for MDC API
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats errors consistently
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'success': False,
            'message': 'An error occurred',
            'errors': {}
        }

        if response.status_code == 400:
            if isinstance(response.data, dict):
                custom_response_data['errors'] = response.data
                custom_response_data['message'] = 'Validation error'
            else:
                custom_response_data['message'] = str(response.data)
                
        elif response.status_code == 401:
            custom_response_data['message'] = 'Authentication failed'
            
        elif response.status_code == 403:
            custom_response_data['message'] = 'Permission denied'
            
        elif response.status_code == 404:
            custom_response_data['message'] = 'Resource not found'
            
        elif response.status_code == 500:
            custom_response_data['message'] = 'Internal server error'
        else:
            custom_response_data['message'] = str(response.data)

        response.data = custom_response_data

    return response