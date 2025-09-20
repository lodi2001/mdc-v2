#!/usr/bin/env python
"""
Test script for transaction update with internal_notes field
"""
import os
import django
import sys

# Add the backend directory to path
sys.path.insert(0, '/home/kms/dev/mdc-v2/backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Transaction
from users.models import User
from django.utils import timezone

def test_transaction_update():
    print("=" * 60)
    print("Testing Transaction Update with internal_notes")
    print("=" * 60)

    # Get an admin user for testing
    admin_user = User.objects.filter(role='admin', is_active=True).first()
    if not admin_user:
        print("❌ No admin user found for testing")
        return False

    print(f"✓ Using admin user: {admin_user.email}")

    # Get or create a test transaction
    transaction = Transaction.objects.filter(is_deleted=False).first()

    if not transaction:
        # Create a test transaction
        transaction = Transaction.objects.create(
            title="Test Transaction for Internal Notes",
            reference_number="TEST-001",
            client_name="Test Client",
            transaction_type="document-review",
            description="Test transaction to verify internal_notes field",
            status="draft",
            priority="normal",
            created_by=admin_user
        )
        print(f"✓ Created test transaction: {transaction.transaction_id}")
    else:
        print(f"✓ Using existing transaction: {transaction.transaction_id}")

    # Test updating internal_notes
    test_notes = "This is a test internal note added at " + timezone.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        transaction.internal_notes = test_notes
        transaction.save()
        print(f"✓ Successfully updated internal_notes field")

        # Verify the update
        transaction.refresh_from_db()
        if transaction.internal_notes == test_notes:
            print(f"✓ Internal notes verified: '{transaction.internal_notes[:50]}...'")
        else:
            print(f"❌ Internal notes mismatch!")
            return False

        # Test through serializer
        from transactions.serializers import TransactionSerializer
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = admin_user

        serializer = TransactionSerializer(transaction, context={'request': request})
        data = serializer.data

        if 'internal_notes' in data:
            print(f"✓ internal_notes field present in serializer output")
            if data['internal_notes'] == test_notes:
                print(f"✓ Serializer returns correct internal_notes value")
            else:
                print(f"❌ Serializer internal_notes value mismatch!")
                return False
        else:
            print(f"❌ internal_notes field missing from serializer!")
            return False

        # Test update through serializer
        update_data = {
            'internal_notes': 'Updated via serializer at ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        serializer = TransactionSerializer(
            transaction,
            data=update_data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            print(f"✓ Successfully updated internal_notes through serializer")

            transaction.refresh_from_db()
            if transaction.internal_notes == update_data['internal_notes']:
                print(f"✓ Update through serializer verified")
            else:
                print(f"❌ Serializer update verification failed!")
                return False
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
            return False

    except Exception as e:
        print(f"❌ Error updating transaction: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✅ All tests passed successfully!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_transaction_update()
    sys.exit(0 if success else 1)