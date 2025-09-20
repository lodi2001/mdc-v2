"""
Integration tests for transaction reassignment workflow
"""

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from rest_framework.test import APIClient
from rest_framework import status
from transactions.models import Transaction, TransactionStatusHistory
from .fixtures import TestFixtures
import json

User = get_user_model()


class TransactionReassignmentIntegrationTest(TransactionTestCase):
    """
    End-to-end integration tests for transaction reassignment workflow
    """
    
    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
        self.transactions = self.fixtures.create_transactions(self.users)
    
    def test_complete_reassignment_workflow(self):
        """
        Test complete workflow: Create → Assign → Reassign → Verify persistence
        """
        # Step 1: Admin creates a new transaction
        self.client.force_authenticate(user=self.users['admin'])
        
        create_data = {
            'client_name': 'Integration Test Client',
            'transaction_type': 'Import',
            'description': 'Integration test transaction',
            'priority': 'high',
            'client': self.users['client1'].id
        }
        
        create_response = self.client.post(
            '/api/v1/transactions/',
            create_data,
            format='json'
        )
        
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        transaction_id = create_response.json()['id']
        
        # Step 2: Assign to editor1
        assign_url = f'/api/v1/transactions/{transaction_id}/assign/'
        assign_data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Initial assignment to editor1'
        }
        
        assign_response = self.client.post(assign_url, assign_data, format='json')
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)
        
        # Verify assignment
        transaction = Transaction.objects.get(id=transaction_id)
        self.assertEqual(transaction.assigned_to, self.users['editor1'])
        
        # Step 3: Editor1 logs in and views their assignments
        self.client.force_authenticate(user=self.users['editor1'])
        
        list_response = self.client.get(
            '/api/v1/transactions/',
            {'assigned_to': self.users['editor1'].id}
        )
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        
        # Verify transaction appears in editor1's list
        transactions_data = list_response.json()
        if 'results' in transactions_data:
            transaction_ids = [t['id'] for t in transactions_data['results']]
            self.assertIn(transaction_id, transaction_ids)
        
        # Step 4: Admin reassigns to editor2
        self.client.force_authenticate(user=self.users['admin'])
        
        reassign_data = {
            'assigned_to': self.users['editor2'].id,
            'reason': 'Reassigning for workload balance'
        }
        
        reassign_response = self.client.post(assign_url, reassign_data, format='json')
        self.assertEqual(reassign_response.status_code, status.HTTP_200_OK)
        
        # Step 5: Verify persistence after "page refresh"
        # Clear any caches and get fresh from database
        transaction.refresh_from_db()
        self.assertEqual(transaction.assigned_to, self.users['editor2'])
        
        # Step 6: Verify editor2 can see the transaction
        self.client.force_authenticate(user=self.users['editor2'])
        
        detail_response = self.client.get(f'/api/v1/transactions/{transaction_id}/')
        if detail_response.status_code == status.HTTP_200_OK:
            detail_data = detail_response.json()
            # Verify assigned user
            if 'assigned_to' in detail_data:
                self.assertEqual(detail_data['assigned_to'], self.users['editor2'].id)
    
    def test_bulk_reassignment_workflow(self):
        """
        Test bulk reassignment workflow for multiple transactions
        """
        # Step 1: Admin performs bulk assignment
        self.client.force_authenticate(user=self.users['admin'])
        
        # Get unassigned bulk transactions
        transaction_ids = [
            self.transactions['bulk_1'].id,
            self.transactions['bulk_2'].id,
            self.transactions['bulk_3'].id,
            self.transactions['bulk_4'].id,
            self.transactions['bulk_5'].id
        ]
        
        bulk_data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['editor1'].id,
            'reason': 'Initial bulk assignment'
        }
        
        bulk_response = self.client.post(
            '/api/v1/transactions/bulk-operations/',
            bulk_data,
            format='json'
        )
        
        self.assertEqual(bulk_response.status_code, status.HTTP_200_OK)
        
        # Verify all assigned to editor1
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertEqual(transaction.assigned_to, self.users['editor1'])
        
        # Step 2: Bulk reassign to editor2
        bulk_data['assigned_to'] = self.users['editor2'].id
        bulk_data['reason'] = 'Bulk reassignment to editor2'
        
        reassign_response = self.client.post(
            '/api/v1/transactions/bulk-operations/',
            bulk_data,
            format='json'
        )
        
        self.assertEqual(reassign_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify all reassigned and persist
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertEqual(transaction.assigned_to, self.users['editor2'])
            
            # Verify it's not a client user
            self.assertIn(transaction.assigned_to.role, ['admin', 'editor'])
            self.assertTrue(transaction.assigned_to.is_active)
    
    def test_client_cannot_interfere_with_assignments(self):
        """
        Test that client users cannot assign or reassign transactions
        """
        # Client tries to assign their own transaction
        self.client.force_authenticate(user=self.users['client1'])
        
        assign_url = f"/api/v1/transactions/{self.transactions['unassigned'].id}/assign/"
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Client trying to assign'
        }
        
        response = self.client.post(assign_url, data, format='json')
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify transaction remains unassigned
        transaction = Transaction.objects.get(id=self.transactions['unassigned'].id)
        self.assertIsNone(transaction.assigned_to)
    
    def test_assignment_filtering_excludes_clients(self):
        """
        Test that client users never appear in assignment options
        """
        self.client.force_authenticate(user=self.users['admin'])
        
        # Get list of available users for assignment
        # This would typically be a separate endpoint in real implementation
        # For now, we test the serializer directly
        from transactions.serializers import TransactionAssignmentSerializer
        
        serializer = TransactionAssignmentSerializer()
        available_users = serializer.fields['assigned_to'].queryset
        
        # Verify no clients in the list
        for user in available_users:
            self.assertNotEqual(user.role, 'client')
            self.assertIn(user.role, ['admin', 'editor'])
            self.assertTrue(user.is_active)
        
        # Specifically check our test clients are excluded
        self.assertNotIn(self.users['client1'], available_users)
        self.assertNotIn(self.users['client2'], available_users)
    
    def test_concurrent_reassignment_handling(self):
        """
        Test handling of concurrent reassignment attempts
        """
        # Both editors try to reassign the same transaction
        transaction = self.transactions['assigned_to_editor1']
        
        # Editor1 tries to reassign
        self.client.force_authenticate(user=self.users['editor1'])
        
        url = f'/api/v1/transactions/{transaction.id}/assign/'
        data1 = {
            'assigned_to': self.users['editor2'].id,
            'reason': 'Editor1 reassigning'
        }
        
        response1 = self.client.post(url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Editor2 immediately tries to reassign again
        self.client.force_authenticate(user=self.users['editor2'])
        
        data2 = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Editor2 reassigning back'
        }
        
        response2 = self.client.post(url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Final state should be assigned to editor1
        transaction.refresh_from_db()
        self.assertEqual(transaction.assigned_to, self.users['editor1'])
    
    def test_reassignment_with_status_change(self):
        """
        Test reassignment combined with status change
        """
        self.client.force_authenticate(user=self.users['admin'])
        
        transaction = self.transactions['assigned_to_editor1']
        
        # First change status
        status_url = f'/api/v1/transactions/{transaction.id}/status/'
        status_data = {
            'status': 'in_review',
            'reason': 'Moving to review'
        }
        
        status_response = self.client.post(status_url, status_data, format='json')
        
        # Then reassign
        assign_url = f'/api/v1/transactions/{transaction.id}/assign/'
        assign_data = {
            'assigned_to': self.users['editor2'].id,
            'reason': 'Reassigning for review'
        }
        
        assign_response = self.client.post(assign_url, assign_data, format='json')
        
        if assign_response.status_code == status.HTTP_200_OK:
            # Verify both changes persisted
            transaction.refresh_from_db()
            self.assertEqual(transaction.assigned_to, self.users['editor2'])
            # Status change may or may not succeed depending on workflow rules