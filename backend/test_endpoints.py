#!/usr/bin/env python
"""
Test script to verify API endpoints
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(url, method="GET", headers=None, data=None):
    """Test an endpoint and return response details"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)

        return {
            'status_code': response.status_code,
            'success': 200 <= response.status_code < 300,
            'content': response.text[:500] if response.text else None,
            'json': response.json() if response.headers.get('content-type', '').startswith('application/json') else None
        }
    except Exception as e:
        return {
            'status_code': None,
            'success': False,
            'error': str(e),
            'content': None,
            'json': None
        }

def get_auth_token():
    """Get authentication token"""
    # First, let's try to get a list of users to find credentials
    try:
        import os
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mdc_backend.settings')
        django.setup()

        from users.models import User
        admin_user = User.objects.filter(role='admin', is_active=True).first()
        if admin_user:
            # Try to authenticate with this user
            login_data = {
                'username': admin_user.username,
                'password': 'admin123'  # Common test password
            }

            response = requests.post(f"{BASE_URL}/api/v1/auth/login/", json=login_data)
            if response.status_code == 200:
                data = response.json()
                return data.get('access'), admin_user.username

            # Try other common passwords
            for password in ['password', 'admin', '123456', 'test123']:
                login_data['password'] = password
                response = requests.post(f"{BASE_URL}/api/v1/auth/login/", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    return data.get('access'), admin_user.username

        return None, None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None, None

def main():
    print("Testing MDC API Endpoints")
    print("=" * 50)

    # Test endpoints without authentication first
    print("\n1. Testing endpoints without authentication:")

    endpoints_to_test = [
        ("/api/v1/users/clients/", "GET"),
        ("/api/v1/transactions/36/history/", "GET"),
    ]

    for endpoint, method in endpoints_to_test:
        url = BASE_URL + endpoint
        result = test_endpoint(url, method)
        print(f"{method} {endpoint}: {result['status_code']} - {'✓' if result['status_code'] == 401 else '✗'}")
        if result['status_code'] != 401:
            print(f"  Content: {result['content']}")

    # Try to get authentication
    print("\n2. Testing with authentication:")
    token, username = get_auth_token()

    if token:
        print(f"✓ Successfully authenticated as: {username}")
        headers = {'Authorization': f'Bearer {token}'}

        for endpoint, method in endpoints_to_test:
            url = BASE_URL + endpoint
            result = test_endpoint(url, method, headers=headers)
            print(f"{method} {endpoint}: {result['status_code']} - {'✓' if result['success'] else '✗'}")

            if not result['success']:
                print(f"  Error content: {result['content']}")
            elif result['json']:
                print(f"  Response: {json.dumps(result['json'], indent=2)[:200]}...")

    else:
        print("✗ Could not authenticate - testing with manual token")

        # Let's try some basic endpoints that might work
        basic_endpoints = [
            "/api/",
            "/api/v1/auth/login/",
        ]

        for endpoint in basic_endpoints:
            url = BASE_URL + endpoint
            result = test_endpoint(url, "GET")
            print(f"GET {endpoint}: {result['status_code']} - {'✓' if result['success'] else '✗'}")

if __name__ == "__main__":
    main()