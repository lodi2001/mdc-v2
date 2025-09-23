#!/usr/bin/env python
"""
Test export functionality
"""
import requests

# API base URL
BASE_URL = 'http://localhost:8000/api/v1'

# Test credentials
test_creds = {'email': 'admin@mdc.com', 'password': 'admin123'}

# Login and get token
response = requests.post(f'{BASE_URL}/auth/login/', json=test_creds)
if response.status_code == 200:
    data = response.json()
    if 'data' in data and 'access' in data['data']:
        token = data['data']['access']
    elif 'access' in data:
        token = data['access']
    else:
        print(f"Login failed: {data}")
        exit(1)

    print(f"✅ Logged in successfully")

    # Test export endpoint
    headers = {'Authorization': f'Bearer {token}'}

    # Test Excel export  - try with trailing slash
    print("\n📥 Testing Excel export with trailing slash...")
    response = requests.get(f'{BASE_URL}/transactions/export/?format=excel', headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response headers: Content-Type={response.headers.get('Content-Type')}")

    if response.status_code == 200:
        print(f"✅ Excel export successful! File size: {len(response.content)} bytes")
        with open('test_export.xlsx', 'wb') as f:
            f.write(response.content)
        print("File saved as test_export.xlsx")
    else:
        print(f"❌ Export failed: {response.text}")

    # Test CSV export
    print("\n📥 Testing CSV export...")
    response = requests.get(f'{BASE_URL}/transactions/export/?format=csv', headers=headers)
    print(f"Response status: {response.status_code}")

    if response.status_code == 200:
        print(f"✅ CSV export successful! File size: {len(response.content)} bytes")
    else:
        print(f"❌ Export failed: {response.text}")

else:
    print(f"Login failed: {response.text}")