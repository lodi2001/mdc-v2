#!/usr/bin/env python
"""
Test script to identify transaction API field requirements
"""
import requests
import json

# API configuration
BASE_URL = 'http://localhost:8000/api/v1'
LOGIN_URL = f'{BASE_URL}/auth/login/'
TRANSACTIONS_URL = f'{BASE_URL}/transactions/'

# Test credentials - auth expects email not username
credentials = {
    'email': 'admin@mdc.com',
    'password': 'admin123'
}

# Login to get token
print("1. Logging in...")
login_response = requests.post(LOGIN_URL, json=credentials)
if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()['access']
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

print(f"Login successful. Token: {token[:20]}...")

# Test minimal transaction creation
print("\n2. Testing minimal transaction creation...")
minimal_data = {
    'reference_number': 'TEST-001',
    'client_name': 'Test Client',
    'transaction_type': 'standard'
}

response = requests.post(TRANSACTIONS_URL, json=minimal_data, headers=headers)
print(f"Response status: {response.status_code}")
if response.status_code == 400:
    print("Validation errors:")
    print(json.dumps(response.json(), indent=2))
elif response.status_code == 201:
    print("Success! Created with minimal fields:")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Unexpected response: {response.text}")

# Test with all frontend fields mapped
print("\n3. Testing with all frontend fields...")
frontend_mapped_data = {
    'reference_number': 'TEST-002',  # Was 'external_id' in frontend
    'client_name': 'Test Client Name',
    'transaction_type': 'standard',
    'category': 'documents',
    'description': 'Test description from frontend',
    'priority': 'normal',
    'due_date': '2025-12-31',
    'department': 'IT',
    'project_id': 'PROJ-123',
    'tags': 'test,frontend,integration'
}

response = requests.post(TRANSACTIONS_URL, json=frontend_mapped_data, headers=headers)
print(f"Response status: {response.status_code}")
if response.status_code == 400:
    print("Validation errors:")
    print(json.dumps(response.json(), indent=2))
elif response.status_code == 201:
    print("Success! Created with frontend fields:")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Unexpected response: {response.text}")

# Check what fields the serializer expects
print("\n4. Testing with empty data to see all required fields...")
response = requests.post(TRANSACTIONS_URL, json={}, headers=headers)
if response.status_code == 400:
    print("Required fields:")
    print(json.dumps(response.json(), indent=2))