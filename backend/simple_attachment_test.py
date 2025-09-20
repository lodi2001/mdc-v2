#!/usr/bin/env python
"""
Simple test for attachment functionality
"""
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import User
from transactions.models import Transaction
from attachments.models import Attachment
from attachments.serializers import AttachmentUploadSerializer

# Get admin user and a transaction
admin_user = User.objects.filter(role='admin', is_active=True).first()
transaction = Transaction.objects.filter(is_deleted=False).first()

if not admin_user or not transaction:
    print("❌ No admin user or transaction found")
    exit(1)

print(f"Using admin: {admin_user.email}")
print(f"Using transaction: {transaction.transaction_id} (ID: {transaction.id})")

# Count existing attachments
initial_count = Attachment.objects.filter(transaction=transaction).count()
print(f"Initial attachments: {initial_count}")

# Create a test file
test_file = SimpleUploadedFile(
    "test_document.txt",
    b"This is a test file content for attachment testing.",
    content_type="text/plain"
)

# Use the AttachmentUploadSerializer to upload
upload_data = {
    'file': test_file,
    'transaction_id': transaction.id,
    'is_client_visible': True,
    'description': 'Test attachment from script'
}

# Create a mock request context
class MockRequest:
    def __init__(self, user):
        self.user = user

mock_request = MockRequest(admin_user)

serializer = AttachmentUploadSerializer(
    data=upload_data,
    context={'request': mock_request}
)

if serializer.is_valid():
    attachment = serializer.save()
    print(f"✅ Attachment created successfully!")
    print(f"   ID: {attachment.id}")
    print(f"   File: {attachment.original_filename}")
    print(f"   Path: {attachment.file_path}")
    print(f"   Hash: {attachment.file_hash[:10]}..." if attachment.file_hash else "   Hash: None")
    print(f"   Size: {attachment.file_size} bytes")
    print(f"   Virus Scan: {attachment.virus_scan_status}")

    # Check if it's in the database
    final_count = Attachment.objects.filter(transaction=transaction).count()
    print(f"\nFinal attachments: {final_count}")

    if final_count > initial_count:
        print("✅ Attachment successfully saved to database!")

        # Now check if it appears in transaction serialization
        from transactions.serializers import TransactionSerializer

        # Refresh transaction from DB
        transaction.refresh_from_db()

        serializer = TransactionSerializer(transaction, context={'request': mock_request})
        data = serializer.data

        if 'attachments' in data:
            print(f"✅ Transaction has 'attachments' field with {len(data['attachments'])} items")
            if len(data['attachments']) > 0:
                print("✅ ✅ ✅ ATTACHMENT SYSTEM IS WORKING! ✅ ✅ ✅")
            else:
                print("⚠️ Attachments field exists but is empty")
        else:
            print("❌ Transaction serializer doesn't include attachments field")

        if 'attachments_count' in data:
            print(f"✅ Attachments count: {data['attachments_count']}")
    else:
        print("❌ Attachment not saved to database")
else:
    print(f"❌ Serializer validation failed: {serializer.errors}")