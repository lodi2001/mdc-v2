#!/usr/bin/env python
"""
Test script for user creation API
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mdc_backend.settings')
django.setup()

from django.test import Client
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import json

# Get admin user and token
admin = User.objects.filter(role='admin').first()
if not admin:
    print("No admin user found!")
    sys.exit(1)

# Generate token for admin
refresh = RefreshToken.for_user(admin)
access_token = str(refresh.access_token)

# Create test client
client = Client()

# Test user creation
test_user_data = {
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "role": "client",
    "password": "TestPass123!",
    "status": "active"
}

print(f"Testing user creation as admin: {admin.email}")
print(f"Creating user with email: {test_user_data['email']}")

# Make the API request with proper host header
response = client.post(
    '/api/v1/users/',
    json.dumps(test_user_data),
    content_type='application/json',
    HTTP_AUTHORIZATION=f'Bearer {access_token}',
    HTTP_HOST='localhost'  # Use localhost which is in ALLOWED_HOSTS
)

print(f"\nResponse Status: {response.status_code}")
if response.status_code == 201:
    print("✅ User created successfully!")
    data = response.json()
    print(f"Created user ID: {data.get('id')}")
    print(f"Created username: {data.get('username')}")
    
    # Clean up - delete the test user
    User.objects.filter(email="testuser@example.com").delete()
    print("Test user cleaned up")
else:
    print("❌ User creation failed!")
    print(f"Response: {response.content.decode()}")
    
    # If it's a validation error, show details
    if response.status_code == 400:
        try:
            error_data = response.json()
            print("\nValidation errors:")
            for field, errors in error_data.items():
                print(f"  - {field}: {errors}")
        except:
            pass