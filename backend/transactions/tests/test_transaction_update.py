"""
Comprehensive tests for transaction update functionality.

Tests focus on:
1. Transaction update endpoint (PATCH /api/v1/transactions/{id}/)
2. internal_notes field update
3. Status transitions validation
4. Field validation (due_date, priority, etc.)
5. Permission checks (admin/editor can update, clients cannot)
6. Audit logging on updates
"""

import json
from datetime import datetime, timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from transactions.models import Transaction, TransactionStatusHistory
from audit.models import AuditLog
from .fixtures import TestFixtures

User = get_user_model()


class TransactionUpdateAPITests(APITestCase):
    """Test cases for transaction update API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.users = TestFixtures.create_users()
        self.transactions = TestFixtures.create_transactions(self.users)
        self.client = APIClient()

        # Create a specific test transaction for updates
        self.test_transaction = Transaction.objects.create(
            transaction_id='TRX-2025-00021',
            client_name='Update Test Client',
            transaction_type='Import',
            description='Transaction for update testing',
            status='draft',
            priority='normal',
            created_by=self.users['admin'],
            assigned_to=self.users['editor1'],
            client=self.users['client1'],
            due_date=timezone.now().date() + timedelta(days=7),
            internal_notes='Initial internal notes'
        )

    def test_update_transaction_as_admin(self):
        """Test that admin can update all transaction fields"""
        self.client.force_authenticate(user=self.users['admin'])

        update_data = {
            'title': 'Updated Transaction Title',
            'description': 'Updated description',
            'priority': 'high',
            'due_date': (timezone.now().date() + timedelta(days=14)).isoformat(),
            'internal_notes': 'Updated internal notes by admin',
            'department': 'Updated Department',
            'project_id': 'PROJ-2025-001',
            'tags': 'urgent,update,test'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.test_transaction.refresh_from_db()

        # Verify updates
        self.assertEqual(self.test_transaction.title, 'Updated Transaction Title')
        self.assertEqual(self.test_transaction.description, 'Updated description')
        self.assertEqual(self.test_transaction.priority, 'high')
        self.assertEqual(self.test_transaction.internal_notes, 'Updated internal notes by admin')
        self.assertEqual(self.test_transaction.department, 'Updated Department')
        self.assertEqual(self.test_transaction.project_id, 'PROJ-2025-001')
        self.assertEqual(self.test_transaction.tags, 'urgent,update,test')

        # Verify audit log was created
        audit_logs = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id,
            action='update'
        )
        self.assertTrue(audit_logs.exists())

    def test_update_internal_notes_field(self):
        """Test specific update of internal_notes field"""
        self.client.force_authenticate(user=self.users['admin'])

        original_notes = self.test_transaction.internal_notes
        new_notes = 'These are completely new internal notes with detailed information about the transaction progress.'

        update_data = {
            'internal_notes': new_notes
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.test_transaction.refresh_from_db()

        # Verify internal_notes was updated
        self.assertEqual(self.test_transaction.internal_notes, new_notes)
        self.assertNotEqual(self.test_transaction.internal_notes, original_notes)

        # Verify response contains updated field
        self.assertEqual(response.data['internal_notes'], new_notes)

    def test_update_transaction_status_with_validation(self):
        """Test status updates with proper validation"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test valid status transition: draft -> submitted
        update_data = {'status': 'submitted'}
        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.status, 'submitted')

        # Verify status history was created
        status_history = TransactionStatusHistory.objects.filter(
            transaction=self.test_transaction,
            new_status='submitted'
        )
        self.assertTrue(status_history.exists())

        # Test invalid status transition: submitted -> completed (should go through in_progress)
        update_data = {'status': 'completed'}
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot change status', str(response.data))

    def test_update_due_date_validation(self):
        """Test due date validation (no past dates)"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test valid future date
        future_date = timezone.now().date() + timedelta(days=30)
        update_data = {'due_date': future_date.isoformat()}

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.due_date, future_date)

        # Test invalid past date
        past_date = timezone.now().date() - timedelta(days=1)
        update_data = {'due_date': past_date.isoformat()}

        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Due date cannot be in the past', str(response.data))

    def test_update_priority_validation(self):
        """Test priority field validation"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test valid priority values
        valid_priorities = ['low', 'normal', 'high', 'urgent']
        url = f'/api/v1/transactions/{self.test_transaction.id}/'

        for priority in valid_priorities:
            update_data = {'priority': priority}
            response = self.client.patch(url, update_data, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.test_transaction.refresh_from_db()
            self.assertEqual(self.test_transaction.priority, priority)

        # Test invalid priority
        update_data = {'priority': 'invalid_priority'}
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_assigned_to_validation(self):
        """Test assigned_to field validation (only admin/editor)"""
        self.client.force_authenticate(user=self.users['admin'])

        # Test valid assignment to editor
        update_data = {'assigned_to': self.users['editor2'].id}
        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.assigned_to, self.users['editor2'])

        # Test valid assignment to admin
        update_data = {'assigned_to': self.users['admin'].id}
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.assigned_to, self.users['admin'])

        # Test invalid assignment to client
        update_data = {'assigned_to': self.users['client1'].id}
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only admin or editor users can be assigned', str(response.data))

    def test_admin_permission_update_any_transaction(self):
        """Test that admin can update any transaction"""
        self.client.force_authenticate(user=self.users['admin'])

        # Update transaction created by different user
        other_transaction = self.transactions['assigned_to_editor2']
        update_data = {
            'description': 'Updated by admin',
            'internal_notes': 'Admin notes'
        }

        url = f'/api/v1/transactions/{other_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        other_transaction.refresh_from_db()
        self.assertEqual(other_transaction.description, 'Updated by admin')
        self.assertEqual(other_transaction.internal_notes, 'Admin notes')

    def test_editor_permission_update_assigned_transaction(self):
        """Test that editor can update transactions assigned to them"""
        self.client.force_authenticate(user=self.users['editor1'])

        # Editor1 updating their assigned transaction
        update_data = {
            'description': 'Updated by assigned editor',
            'internal_notes': 'Editor internal notes',
            'status': 'completed'  # Valid transition from in_progress
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.description, 'Updated by assigned editor')
        self.assertEqual(self.test_transaction.internal_notes, 'Editor internal notes')
        self.assertEqual(self.test_transaction.status, 'completed')

    def test_editor_permission_update_created_transaction(self):
        """Test that editor can update transactions they created"""
        # Create transaction by editor2
        editor_transaction = Transaction.objects.create(
            client_name='Editor Created Transaction',
            transaction_type='Export',
            description='Created by editor2',
            status='draft',
            priority='normal',
            created_by=self.users['editor2'],
            client=self.users['client1']
        )

        self.client.force_authenticate(user=self.users['editor2'])

        update_data = {
            'description': 'Updated by creator editor',
            'internal_notes': 'Creator editor notes'
        }

        url = f'/api/v1/transactions/{editor_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        editor_transaction.refresh_from_db()
        self.assertEqual(editor_transaction.description, 'Updated by creator editor')
        self.assertEqual(editor_transaction.internal_notes, 'Creator editor notes')

    def test_editor_permission_denied_other_transaction(self):
        """Test that editor cannot update transactions not assigned to them"""
        self.client.force_authenticate(user=self.users['editor1'])

        # Try to update transaction assigned to editor2
        other_transaction = self.transactions['assigned_to_editor2']
        update_data = {
            'description': 'Trying to update other editor transaction'
        }

        url = f'/api/v1/transactions/{other_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("don't have access", str(response.data))

    def test_client_permission_update_own_draft_transaction(self):
        """Test that client can update their own draft transactions"""
        # Create draft transaction for client
        client_transaction = Transaction.objects.create(
            client_name='Client Transaction',
            transaction_type='Import',
            description='Client created transaction',
            status='draft',
            priority='normal',
            created_by=self.users['client1'],
            client=self.users['client1']
        )

        self.client.force_authenticate(user=self.users['client1'])

        update_data = {
            'description': 'Updated by client',
            'reference_number': 'REF-2025-001'
        }

        url = f'/api/v1/transactions/{client_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        client_transaction.refresh_from_db()
        self.assertEqual(client_transaction.description, 'Updated by client')
        self.assertEqual(client_transaction.reference_number, 'REF-2025-001')

    def test_client_permission_denied_non_draft_transaction(self):
        """Test that client cannot update non-draft transactions"""
        self.client.force_authenticate(user=self.users['client1'])

        # Try to update in_progress transaction
        update_data = {
            'description': 'Trying to update in_progress transaction'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('can only modify draft transactions', str(response.data))

    def test_client_permission_denied_other_client_transaction(self):
        """Test that client cannot update other client's transactions"""
        self.client.force_authenticate(user=self.users['client2'])

        # Try to update client1's transaction
        update_data = {
            'description': 'Trying to update other client transaction'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("don't have access", str(response.data))

    def test_client_cannot_update_internal_notes(self):
        """Test that client cannot see or update internal_notes field"""
        # Create draft transaction for client
        client_transaction = Transaction.objects.create(
            client_name='Client Transaction',
            transaction_type='Import',
            description='Client created transaction',
            status='draft',
            priority='normal',
            created_by=self.users['client1'],
            client=self.users['client1'],
            internal_notes='Secret admin notes'
        )

        self.client.force_authenticate(user=self.users['client1'])

        # First, verify client cannot see internal_notes in GET response
        url = f'/api/v1/transactions/{client_transaction.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # internal_notes should not be in response for clients
        self.assertNotIn('internal_notes', response.data)

        # Try to update internal_notes
        update_data = {
            'description': 'Updated description',
            'internal_notes': 'Client trying to set internal notes'
        }

        response = self.client.patch(url, update_data, format='json')

        # Update should succeed but internal_notes should be ignored
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        client_transaction.refresh_from_db()
        self.assertEqual(client_transaction.description, 'Updated description')
        self.assertEqual(client_transaction.internal_notes, 'Secret admin notes')  # Unchanged

    def test_audit_logging_on_transaction_update(self):
        """Test that audit logs are created on transaction updates"""
        self.client.force_authenticate(user=self.users['admin'])

        # Get initial audit log count
        initial_count = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id
        ).count()

        update_data = {
            'description': 'Audit log test update',
            'priority': 'urgent',
            'internal_notes': 'Updated for audit testing'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify audit log was created
        final_count = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id
        ).count()

        self.assertEqual(final_count, initial_count + 1)

        # Verify audit log details
        audit_log = AuditLog.objects.filter(
            table_name='Transaction',
            record_id=self.test_transaction.id,
            action='update'
        ).latest('created_at')

        self.assertEqual(audit_log.user, self.users['admin'])
        self.assertIn('updated_fields', audit_log.new_values)
        self.assertIn('transaction_id', audit_log.new_values)

    def test_bulk_field_update(self):
        """Test updating multiple fields in single request"""
        self.client.force_authenticate(user=self.users['admin'])

        update_data = {
            'title': 'Bulk Update Title',
            'description': 'Bulk update description',
            'priority': 'urgent',
            'due_date': (timezone.now().date() + timedelta(days=21)).isoformat(),
            'internal_notes': 'Bulk update internal notes',
            'department': 'Bulk Department',
            'project_id': 'BULK-2025-001',
            'tags': 'bulk,update,comprehensive,test'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh and verify all updates
        self.test_transaction.refresh_from_db()

        self.assertEqual(self.test_transaction.title, 'Bulk Update Title')
        self.assertEqual(self.test_transaction.description, 'Bulk update description')
        self.assertEqual(self.test_transaction.priority, 'urgent')
        self.assertEqual(self.test_transaction.internal_notes, 'Bulk update internal notes')
        self.assertEqual(self.test_transaction.department, 'Bulk Department')
        self.assertEqual(self.test_transaction.project_id, 'BULK-2025-001')
        self.assertEqual(self.test_transaction.tags, 'bulk,update,comprehensive,test')

    def test_partial_update_preserves_other_fields(self):
        """Test that partial updates don't modify unspecified fields"""
        self.client.force_authenticate(user=self.users['admin'])

        # Store original values
        original_description = self.test_transaction.description
        original_priority = self.test_transaction.priority
        original_internal_notes = self.test_transaction.internal_notes

        # Update only title
        update_data = {'title': 'Only Title Updated'}

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh and verify
        self.test_transaction.refresh_from_db()

        # Title should be updated
        self.assertEqual(self.test_transaction.title, 'Only Title Updated')

        # Other fields should remain unchanged
        self.assertEqual(self.test_transaction.description, original_description)
        self.assertEqual(self.test_transaction.priority, original_priority)
        self.assertEqual(self.test_transaction.internal_notes, original_internal_notes)

    def test_update_with_invalid_transaction_id(self):
        """Test update attempt with non-existent transaction ID"""
        self.client.force_authenticate(user=self.users['admin'])

        url = f'/api/v1/transactions/99999/'
        update_data = {'description': 'Should not work'}

        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_soft_deleted_transaction(self):
        """Test that soft-deleted transactions cannot be updated"""
        # Soft delete the transaction
        self.test_transaction.soft_delete(self.users['admin'], 'Test deletion')

        self.client.force_authenticate(user=self.users['admin'])

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        update_data = {'description': 'Should not work on deleted transaction'}

        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_concurrent_update_handling(self):
        """Test handling of concurrent updates"""
        self.client.force_authenticate(user=self.users['admin'])

        # Simulate concurrent update by modifying transaction directly
        self.test_transaction.description = 'Modified concurrently'
        self.test_transaction.save()

        # Now try to update via API
        update_data = {'priority': 'urgent'}

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        # Should still succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify both changes are present
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.description, 'Modified concurrently')
        self.assertEqual(self.test_transaction.priority, 'urgent')


class TransactionUpdateEdgeCaseTests(APITestCase):
    """Test edge cases and error scenarios for transaction updates"""

    def setUp(self):
        """Set up test data"""
        self.users = TestFixtures.create_users()
        self.client = APIClient()

        self.test_transaction = Transaction.objects.create(
            client_name='Edge Case Test Client',
            transaction_type='Import',
            description='Transaction for edge case testing',
            status='draft',
            priority='normal',
            created_by=self.users['admin'],
            client=self.users['client1']
        )

    def test_update_with_empty_request_body(self):
        """Test update with empty request body"""
        self.client.force_authenticate(user=self.users['admin'])

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, {}, format='json')

        # Should succeed but not change anything
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_with_invalid_json(self):
        """Test update with malformed JSON"""
        self.client.force_authenticate(user=self.users['admin'])

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, 'invalid json', content_type='application/json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_with_extra_fields(self):
        """Test update with fields not in model"""
        self.client.force_authenticate(user=self.users['admin'])

        update_data = {
            'description': 'Valid update',
            'nonexistent_field': 'Should be ignored',
            'another_invalid_field': 123
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        # Should succeed, ignoring invalid fields
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()
        self.assertEqual(self.test_transaction.description, 'Valid update')

    def test_update_with_null_values(self):
        """Test update with null values for optional fields"""
        self.client.force_authenticate(user=self.users['admin'])

        update_data = {
            'description': '',  # Empty string
            'due_date': None,  # Null date
            'assigned_to': None,  # Unassign
            'internal_notes': ''  # Empty notes
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()

        self.assertEqual(self.test_transaction.description, '')
        self.assertIsNone(self.test_transaction.due_date)
        self.assertIsNone(self.test_transaction.assigned_to)
        self.assertEqual(self.test_transaction.internal_notes, '')

    def test_update_read_only_fields(self):
        """Test that read-only fields cannot be updated"""
        self.client.force_authenticate(user=self.users['admin'])

        original_transaction_id = self.test_transaction.transaction_id
        original_created_at = self.test_transaction.created_at

        update_data = {
            'transaction_id': 'HACKED-2025-001',
            'created_at': '2020-01-01T00:00:00Z',
            'updated_at': '2020-01-01T00:00:00Z',
            'id': 99999,
            'description': 'Valid update'
        }

        url = f'/api/v1/transactions/{self.test_transaction.id}/'
        response = self.client.patch(url, update_data, format='json')

        # Should succeed but ignore read-only fields
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_transaction.refresh_from_db()

        # Read-only fields should be unchanged
        self.assertEqual(self.test_transaction.transaction_id, original_transaction_id)
        self.assertEqual(self.test_transaction.created_at, original_created_at)

        # Valid field should be updated
        self.assertEqual(self.test_transaction.description, 'Valid update')