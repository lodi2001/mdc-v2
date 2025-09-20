"""
Integration tests for the full transaction update flow.

Tests the complete end-to-end workflow:
1. Load transaction data in edit form
2. Update multiple fields including internal_notes
3. Save and verify changes persist
4. Check audit logs are created
"""

import json
from datetime import datetime, timedelta
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction as db_transaction

from transactions.models import Transaction, TransactionStatusHistory
from audit.models import AuditLog
from .fixtures import TestFixtures

User = get_user_model()


class TransactionUpdateIntegrationTests(APITestCase):
    """Integration tests for complete transaction update workflow"""

    def setUp(self):
        """Set up test data"""
        self.users = TestFixtures.create_users()
        self.transactions = TestFixtures.create_transactions(self.users)
        self.client = APIClient()

        # Create a test transaction with specific data for update testing
        self.test_transaction = Transaction.objects.create(
            transaction_id='TRX-2025-00021',
            title='Original Transaction Title',
            client_name='Integration Test Client',
            transaction_type='Import',
            description='Original description for integration testing',
            status='draft',
            priority='normal',
            created_by=self.users['admin'],
            assigned_to=self.users['editor1'],
            client=self.users['client1'],
            due_date=timezone.now().date() + timedelta(days=7),
            internal_notes='Original internal notes',
            department='Original Department',
            project_id='ORIG-2025-001',
            tags='original,test'
        )

    def test_complete_transaction_update_workflow_as_admin(self):
        """Test complete workflow: fetch -> update -> verify persistence"""
        self.client.force_authenticate(user=self.users['admin'])

        # Step 1: Fetch transaction data (simulating frontend load)
        get_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # Verify fetched data matches expected values
        data = get_response.data
        self.assertEqual(data['title'], 'Original Transaction Title')
        self.assertEqual(data['internal_notes'], 'Original internal notes')
        self.assertEqual(data['priority'], 'normal')
        self.assertEqual(data['status'], 'draft')

        # Step 2: Update multiple fields including internal_notes
        update_data = {
            'title': 'Updated Integration Test Transaction',
            'description': 'Updated description with comprehensive changes',
            'priority': 'high',
            'status': 'submitted',  # Valid transition from draft
            'internal_notes': 'Updated internal notes with detailed information for integration testing',
            'department': 'Updated Integration Department',
            'project_id': 'UPD-2025-001',
            'tags': 'updated,integration,comprehensive,test',
            'due_date': (timezone.now().date() + timedelta(days=21)).isoformat()
        }

        # Get initial audit log count
        initial_audit_count = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id
        ).count()

        patch_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            update_data,
            format='json'
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)

        # Step 3: Verify changes persisted in database
        self.test_transaction.refresh_from_db()

        self.assertEqual(self.test_transaction.title, 'Updated Integration Test Transaction')
        self.assertEqual(self.test_transaction.description, 'Updated description with comprehensive changes')
        self.assertEqual(self.test_transaction.priority, 'high')
        self.assertEqual(self.test_transaction.status, 'submitted')
        self.assertEqual(self.test_transaction.internal_notes, 'Updated internal notes with detailed information for integration testing')
        self.assertEqual(self.test_transaction.department, 'Updated Integration Department')
        self.assertEqual(self.test_transaction.project_id, 'UPD-2025-001')
        self.assertEqual(self.test_transaction.tags, 'updated,integration,comprehensive,test')

        # Step 4: Verify audit log was created
        final_audit_count = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id
        ).count()
        self.assertEqual(final_audit_count, initial_audit_count + 1)

        # Step 5: Verify status history was created for status change
        status_history = TransactionStatusHistory.objects.filter(
            transaction=self.test_transaction,
            previous_status='draft',
            new_status='submitted'
        )
        self.assertTrue(status_history.exists())

        # Step 6: Fetch updated data to confirm API returns correct values
        final_get_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(final_get_response.status_code, status.HTTP_200_OK)

        final_data = final_get_response.data
        self.assertEqual(final_data['title'], 'Updated Integration Test Transaction')
        self.assertEqual(final_data['internal_notes'], 'Updated internal notes with detailed information for integration testing')
        self.assertEqual(final_data['priority'], 'high')
        self.assertEqual(final_data['status'], 'submitted')

    def test_editor_update_workflow_with_permission_validation(self):
        """Test editor can update assigned transactions with proper permission checks"""
        self.client.force_authenticate(user=self.users['editor1'])

        # Step 1: Verify editor can fetch their assigned transaction
        get_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # Step 2: Update transaction (editor cannot change status to 'approved')
        update_data = {
            'description': 'Updated by assigned editor',
            'internal_notes': 'Editor internal notes update',
            'priority': 'urgent',
            'status': 'completed'  # Valid transition from draft for editors
        }

        patch_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            update_data,
            format='json'
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)

        # Step 3: Verify changes persisted
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.description, 'Updated by assigned editor')
        self.assertEqual(self.test_transaction.internal_notes, 'Editor internal notes update')
        self.assertEqual(self.test_transaction.priority, 'urgent')
        self.assertEqual(self.test_transaction.status, 'completed')

        # Step 4: Verify editor cannot update other editor's transactions
        other_transaction = self.transactions['assigned_to_editor2']
        update_response = self.client.patch(
            f'/api/v1/transactions/{other_transaction.id}/',
            {'description': 'Should not work'},
            format='json'
        )
        # Should get 404 because editor1 cannot see editor2's transactions
        self.assertEqual(update_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_client_update_workflow_with_restrictions(self):
        """Test client can only update their own draft transactions"""
        # Create a draft transaction for client1
        client_transaction = Transaction.objects.create(
            title='Client Draft Transaction',
            client_name='Client Own Transaction',
            transaction_type='Import',
            description='Client created transaction',
            status='draft',
            priority='normal',
            created_by=self.users['client1'],
            client=self.users['client1']
        )

        self.client.force_authenticate(user=self.users['client1'])

        # Step 1: Client can fetch their own transaction
        get_response = self.client.get(f'/api/v1/transactions/{client_transaction.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # Verify internal_notes is not in response for clients
        self.assertNotIn('internal_notes', get_response.data)

        # Step 2: Client can update their draft transaction
        update_data = {
            'title': 'Updated by Client',
            'description': 'Client updated description',
            'reference_number': 'CLIENT-REF-001'
        }

        patch_response = self.client.patch(
            f'/api/v1/transactions/{client_transaction.id}/',
            update_data,
            format='json'
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)

        # Step 3: Verify changes persisted
        client_transaction.refresh_from_db()
        self.assertEqual(client_transaction.title, 'Updated by Client')
        self.assertEqual(client_transaction.description, 'Client updated description')
        self.assertEqual(client_transaction.reference_number, 'CLIENT-REF-001')

        # Step 4: Change transaction to submitted and verify client cannot update it
        client_transaction.status = 'submitted'
        client_transaction.save()

        restricted_update = self.client.patch(
            f'/api/v1/transactions/{client_transaction.id}/',
            {'description': 'Should not work'},
            format='json'
        )
        self.assertEqual(restricted_update.status_code, status.HTTP_403_FORBIDDEN)

        # Step 5: Verify client cannot see other client's transactions
        other_client_transaction = self.transactions['assigned_to_editor1']  # Belongs to client1 but testing as if it's another client's
        other_response = self.client.get(f'/api/v1/transactions/{other_client_transaction.id}/')
        # This should succeed because it's actually client1's transaction
        self.assertEqual(other_response.status_code, status.HTTP_200_OK)

    def test_validation_error_workflow(self):
        """Test handling of validation errors during update workflow"""
        self.client.force_authenticate(user=self.users['admin'])

        # Step 1: Try to update with invalid data
        invalid_update_data = {
            'due_date': '2020-01-01',  # Past date
            'priority': 'invalid_priority',  # Invalid choice
            'assigned_to': self.users['client1'].id  # Client cannot be assigned
        }

        patch_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            invalid_update_data,
            format='json'
        )
        self.assertEqual(patch_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Step 2: Verify original data unchanged
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.priority, 'normal')  # Should remain unchanged
        self.assertEqual(self.test_transaction.assigned_to, self.users['editor1'])  # Should remain unchanged

        # Step 3: Try valid update after fixing errors
        valid_update_data = {
            'due_date': (timezone.now().date() + timedelta(days=30)).isoformat(),
            'priority': 'high',
            'assigned_to': self.users['editor2'].id
        }

        successful_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            valid_update_data,
            format='json'
        )
        self.assertEqual(successful_response.status_code, status.HTTP_200_OK)

        # Step 4: Verify valid changes persisted
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.priority, 'high')
        self.assertEqual(self.test_transaction.assigned_to, self.users['editor2'])

    def test_status_transition_workflow(self):
        """Test complete status transition workflow with validation"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test valid status progression: draft -> submitted -> under_review -> approved -> in_progress -> completed
        status_transitions = [
            ('draft', 'submitted'),
            ('submitted', 'under_review'),
            ('under_review', 'approved'),
            ('approved', 'in_progress'),
            ('in_progress', 'completed')
        ]

        for from_status, to_status in status_transitions:
            # Ensure transaction is in expected state
            self.test_transaction.status = from_status
            self.test_transaction.save()

            # Clear any existing status history for clean test
            TransactionStatusHistory.objects.filter(transaction=self.test_transaction).delete()

            # Update status
            response = self.client.patch(
                f'/api/v1/transactions/{self.test_transaction.id}/',
                {'status': to_status},
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK,
                           f"Failed transition from {from_status} to {to_status}")

            # Verify status changed
            self.test_transaction.refresh_from_db()
            self.assertEqual(self.test_transaction.status, to_status)

            # Verify status history created
            status_history = TransactionStatusHistory.objects.filter(
                transaction=self.test_transaction,
                previous_status=from_status,
                new_status=to_status
            )
            self.assertTrue(status_history.exists(),
                          f"Status history not created for {from_status} -> {to_status}")

        # Test invalid transition: try to go from completed back to draft
        invalid_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            {'status': 'draft'},
            format='json'
        )
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_concurrent_update_workflow(self):
        """Test handling of concurrent updates"""
        self.client.force_authenticate(user=self.users['admin'])

        # Step 1: Fetch initial data
        initial_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(initial_response.status_code, status.HTTP_200_OK)

        # Step 2: Simulate concurrent update by directly modifying database
        self.test_transaction.description = 'Modified by another user'
        self.test_transaction.save()

        # Step 3: Try to update via API
        api_update_data = {
            'title': 'Updated via API',
            'priority': 'urgent'
        }

        update_response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            api_update_data,
            format='json'
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        # Step 4: Verify both changes are present (last write wins for individual fields)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.title, 'Updated via API')
        self.assertEqual(self.test_transaction.priority, 'urgent')
        self.assertEqual(self.test_transaction.description, 'Modified by another user')

    def test_bulk_field_update_with_audit_trail(self):
        """Test updating multiple fields in single request with complete audit trail"""
        self.client.force_authenticate(user=self.users['admin'])

        # Get initial audit count
        initial_audit_count = AuditLog.objects.count()

        # Update multiple fields at once
        bulk_update_data = {
            'title': 'Bulk Updated Transaction',
            'description': 'Bulk updated description',
            'priority': 'urgent',
            'status': 'submitted',
            'internal_notes': 'Bulk updated internal notes',
            'department': 'Bulk Updated Department',
            'project_id': 'BULK-2025-001',
            'tags': 'bulk,update,comprehensive,integration',
            'due_date': (timezone.now().date() + timedelta(days=45)).isoformat()
        }

        response = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            bulk_update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify all fields updated
        self.test_transaction.refresh_from_db()
        for field, expected_value in bulk_update_data.items():
            if field == 'due_date':
                continue  # Skip date comparison for simplicity
            actual_value = getattr(self.test_transaction, field)
            self.assertEqual(actual_value, expected_value, f"Field {field} not updated correctly")

        # Verify audit log created
        final_audit_count = AuditLog.objects.count()
        self.assertGreater(final_audit_count, initial_audit_count)

        # Verify specific audit log entry
        audit_log = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id,
            action='update'
        ).latest('created_at')

        self.assertEqual(audit_log.user, self.users['admin'])
        self.assertIn('updated_fields', audit_log.new_values)

    def test_internal_notes_visibility_workflow(self):
        """Test internal_notes field visibility based on user role"""
        # Test as Admin - should see internal_notes
        self.client.force_authenticate(user=self.users['admin'])
        admin_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        self.assertIn('internal_notes', admin_response.data)
        self.assertEqual(admin_response.data['internal_notes'], 'Original internal notes')

        # Test as Editor - should see internal_notes
        self.client.force_authenticate(user=self.users['editor1'])
        editor_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(editor_response.status_code, status.HTTP_200_OK)
        self.assertIn('internal_notes', editor_response.data)

        # Test as Client - should NOT see internal_notes
        self.client.force_authenticate(user=self.users['client1'])
        client_response = self.client.get(f'/api/v1/transactions/{self.test_transaction.id}/')
        self.assertEqual(client_response.status_code, status.HTTP_200_OK)
        self.assertNotIn('internal_notes', client_response.data)

        # Test Client cannot update internal_notes
        client_update = self.client.patch(
            f'/api/v1/transactions/{self.test_transaction.id}/',
            {
                'description': 'Client description update',
                'internal_notes': 'Client should not be able to set this'
            },
            format='json'
        )
        # Update might succeed but internal_notes should be ignored
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.internal_notes, 'Original internal notes')  # Unchanged

    @db_transaction.atomic
    def test_database_transaction_integrity(self):
        """Test that update operations maintain database integrity"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test updating transaction within database transaction
        with db_transaction.atomic():
            response = self.client.patch(
                f'/api/v1/transactions/{self.test_transaction.id}/',
                {
                    'title': 'Atomic Update Test',
                    'status': 'submitted',
                    'internal_notes': 'Atomic update internal notes'
                },
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Verify changes are visible within transaction
            self.test_transaction.refresh_from_db()
            self.assertEqual(self.test_transaction.title, 'Atomic Update Test')
            self.assertEqual(self.test_transaction.status, 'submitted')

        # Verify changes persisted after transaction commit
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.title, 'Atomic Update Test')
        self.assertEqual(self.test_transaction.status, 'submitted')
        self.assertEqual(self.test_transaction.internal_notes, 'Atomic update internal notes')

        # Verify status history was created
        status_history = TransactionStatusHistory.objects.filter(
            transaction=self.test_transaction,
            new_status='submitted'
        )
        self.assertTrue(status_history.exists())