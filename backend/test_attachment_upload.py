#!/usr/bin/env python
"""
Test attachment upload functionality
"""
import requests
import json
import tempfile

# API base URL
BASE_URL = 'http://localhost:8000/api/v1'

# Test credentials
test_users = {
    'admin': {'email': 'admin@mdc.com', 'password': 'admin123'},
    'editor': {'email': 'KMS@NUWAS.NET', 'password': 'Test@123'},
}

def login(user_type='admin'):
    """Login and get token"""
    creds = test_users[user_type]
    response = requests.post(f'{BASE_URL}/auth/login/', json=creds)
    if response.status_code == 200:
        data = response.json()
        # Handle both possible response structures
        if 'data' in data and 'access' in data['data']:
            return data['data']['access']
        elif 'access' in data:
            return data['access']
        else:
            print(f"Unexpected login response: {data}")
            return None
    else:
        print(f"Login failed: {response.text}")
        return None

def get_first_transaction(token):
    """Get the first available transaction"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/transactions/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        # Handle both response structures
        if 'data' in data and 'results' in data['data']:
            results = data['data']['results']
        elif 'results' in data:
            results = data['results']
        else:
            print(f"Unexpected response structure: {data.keys()}")
            return None

        if results:
            return results[0]
    return None

def test_attachment_upload(token, transaction_id):
    """Test uploading attachments"""
    headers = {'Authorization': f'Bearer {token}'}

    # Create test files
    test_file1 = tempfile.NamedTemporaryFile(suffix='.txt', mode='w', delete=False)
    test_file1.write('This is a test file for attachment upload.')
    test_file1.close()

    test_file2 = tempfile.NamedTemporaryFile(suffix='.pdf', mode='wb', delete=False)
    test_file2.write(b'%PDF-1.4\nTest PDF content')
    test_file2.close()

    # Prepare files for upload
    files = [
        ('files', ('test_document.txt', open(test_file1.name, 'rb'), 'text/plain')),
        ('files', ('test_report.pdf', open(test_file2.name, 'rb'), 'application/pdf'))
    ]

    data = {
        'transaction': transaction_id
    }

    print(f"\n📤 Uploading attachments to transaction {transaction_id}...")
    response = requests.post(
        f'{BASE_URL}/attachments/attachments/bulk_upload/',
        headers=headers,
        data=data,
        files=files
    )

    print(f"Response status: {response.status_code}")

    if response.status_code in [200, 201]:
        result = response.json()
        print(f"✅ Success: {result.get('message', 'Upload successful')}")

        if 'data' in result and 'attachments' in result['data']:
            print(f"\n📎 Uploaded {len(result['data']['attachments'])} files:")
            for att in result['data']['attachments']:
                print(f"  - {att.get('original_filename', 'Unknown')} ({att.get('file_size_formatted', 'Unknown size')})")
                print(f"    ID: {att.get('id')}")
                print(f"    Hash: {att.get('file_hash', 'No hash')[:10]}...")
                print(f"    Virus scan: {att.get('virus_scan_status', 'Unknown')}")

        if 'data' in result and 'errors' in result['data'] and result['data']['errors']:
            print("\n⚠️ Errors:")
            for err in result['data']['errors']:
                print(f"  - {err}")
    else:
        print(f"❌ Failed: {response.text}")

    # Clean up test files
    import os
    os.unlink(test_file1.name)
    os.unlink(test_file2.name)

    return response.status_code in [200, 201]

def verify_attachments(token, transaction_id):
    """Verify attachments are returned with transaction"""
    headers = {'Authorization': f'Bearer {token}'}

    print(f"\n🔍 Fetching transaction {transaction_id} to verify attachments...")
    response = requests.get(f'{BASE_URL}/transactions/{transaction_id}/', headers=headers)

    if response.status_code == 200:
        resp = response.json()
        # Handle both response structures
        data = resp.get('data', resp)
        print(f"✅ Transaction found: {data.get('transaction_id')}")

        if 'attachments' in data:
            print(f"📎 Attachments count: {len(data['attachments'])}")
            for att in data['attachments']:
                print(f"  - {att.get('original_filename')} (ID: {att.get('id')})")
        else:
            print("⚠️ No 'attachments' field in response")

        if 'attachments_count' in data:
            print(f"📊 Attachments count field: {data['attachments_count']}")

        return 'attachments' in data
    else:
        print(f"❌ Failed to fetch transaction: {response.text}")
        return False

def main():
    print("=" * 60)
    print("Testing Attachment Upload Functionality")
    print("=" * 60)

    # Login as admin
    token = login('admin')
    if not token:
        print("❌ Failed to login")
        return

    print("✅ Logged in successfully")

    # Get a transaction to test with
    transaction = get_first_transaction(token)
    if not transaction:
        print("❌ No transactions found")
        return

    print(f"✅ Using transaction: {transaction['transaction_id']} (ID: {transaction['id']})")

    # Test attachment upload
    upload_success = test_attachment_upload(token, transaction['id'])

    if upload_success:
        # Verify attachments are visible
        verify_success = verify_attachments(token, transaction['id'])

        if verify_success:
            print("\n✅ ✅ ✅ Attachment functionality is working correctly! ✅ ✅ ✅")
        else:
            print("\n⚠️ Attachments uploaded but not visible in transaction response")
    else:
        print("\n❌ Attachment upload failed")

if __name__ == '__main__':
    main()