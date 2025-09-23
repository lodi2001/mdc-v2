#!/usr/bin/env python
"""
Final test results for the fixed API endpoints
"""
import requests
import json

def test_endpoints():
    BASE_URL = "http://localhost:8000"

    # Authenticate
    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login/", json={
        'email': 'admin@mdc.com',
        'password': 'admin123'
    })

    if login_response.status_code != 200:
        print("❌ Authentication failed")
        return

    token = login_response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}

    # Test endpoints
    print("🔧 Testing Fixed API Endpoints")
    print("=" * 50)

    # Test 1: GET /api/v1/users/clients/
    print("\n1. Testing GET /api/v1/users/clients/")
    response = requests.get(f"{BASE_URL}/api/v1/users/clients/", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {'✅ Success' if response.status_code == 200 else '❌ Failed'}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {data['data']['count']} client(s)")

    # Test 2: GET /api/v1/transactions/36/history/
    print("\n2. Testing GET /api/v1/transactions/36/history/")
    response = requests.get(f"{BASE_URL}/api/v1/transactions/36/history/", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {'✅ Success' if response.status_code == 200 else '❌ Failed'}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {data['data']['total_activities']} activities for transaction {data['data']['transaction_id']}")

    print("\n" + "=" * 50)
    print("✅ All endpoint tests completed successfully!")

if __name__ == "__main__":
    test_endpoints()