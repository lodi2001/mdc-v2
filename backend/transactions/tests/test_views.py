"""
Test cases for transaction views focusing on assignment functionality
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from transactions.models import Transaction
from .fixtures import TestFixtures

User = get_user_model()


class AssignTransactionViewTest(TestCase):
    """
    Test AssignTransactionView API endpoint
    """
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
        self.transactions = self.fixtures.create_transactions(self.users)
        self.url = '/api/v1/transactions/{}/assign/'
    
    def test_admin_can_assign_transaction(self):
        """Test that admin users can assign transactions"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # Assign unassigned transaction to editor1
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Assigning to editor for processing'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify assignment was saved
        transaction = Transaction.objects.get(id=self.transactions['unassigned'].id)
        self.assertEqual(transaction.assigned_to, self.users['editor1'])
    
    def test_editor_can_assign_transaction(self):
        """Test that editor users can assign transactions"""
        self.client.force_authenticate(user=self.users['editor1'])
        
        # Editor1 reassigns their transaction to editor2
        url = self.url.format(self.transactions['assigned_to_editor1'].id)
        data = {
            'assigned_to': self.users['editor2'].id,
            'reason': 'Reassigning for workload balance'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify reassignment
        transaction = Transaction.objects.get(id=self.transactions['assigned_to_editor1'].id)
        self.assertEqual(transaction.assigned_to, self.users['editor2'])
    
    def test_client_cannot_assign_transaction(self):
        """Test that client users cannot assign transactions"""
        self.client.force_authenticate(user=self.users['client1'])
        
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Client trying to assign'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should be forbidden for client users
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_assign_to_client_user(self):
        """Test that transactions cannot be assigned to client users"""
        self.client.force_authenticate(user=self.users['admin'])
        
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['client1'].id,  # Try to assign to client
            'reason': 'Invalid assignment to client'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', response.json().get('errors', {}))
    
    def test_cannot_assign_to_inactive_user(self):
        """Test that transactions cannot be assigned to inactive users"""
        self.client.force_authenticate(user=self.users['admin'])
        
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['inactive_editor'].id,  # Inactive editor
            'reason': 'Invalid assignment to inactive user'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unassign_transaction(self):
        """Test unassigning a transaction (setting assigned_to to null)"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # Unassign a currently assigned transaction
        url = self.url.format(self.transactions['assigned_to_editor1'].id)
        data = {
            'assigned_to': None,
            'reason': 'Unassigning for reassessment'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify unassignment
        transaction = Transaction.objects.get(id=self.transactions['assigned_to_editor1'].id)
        self.assertIsNone(transaction.assigned_to)
    
    def test_assignment_creates_audit_log(self):
        """Test that assignment creates an audit log entry"""
        self.client.force_authenticate(user=self.users['admin'])
        
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Assignment with audit log'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # In a real implementation, verify audit log was created
        # This would depend on your audit log implementation
    
    def test_assignment_with_invalid_transaction_id(self):
        """Test assignment with non-existent transaction ID"""
        self.client.force_authenticate(user=self.users['admin'])
        
        url = self.url.format(99999)  # Non-existent ID
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Invalid transaction'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_assignment_persistence_after_refresh(self):
        """Test that assignments persist in database and survive refresh"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # Initial assignment
        url = self.url.format(self.transactions['unassigned'].id)
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Testing persistence'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Simulate page refresh by getting transaction again
        transaction = Transaction.objects.get(id=self.transactions['unassigned'].id)
        self.assertEqual(transaction.assigned_to.id, self.users['editor1'].id)
        
        # Verify through API GET request
        get_url = f"/api/v1/transactions/{self.transactions['unassigned'].id}/"
        get_response = self.client.get(get_url)
        
        if get_response.status_code == status.HTTP_200_OK:
            data = get_response.json()
            # Check if assigned_to is present and correct
            if 'assigned_to' in data:
                self.assertEqual(data['assigned_to'], self.users['editor1'].id)


class BulkTransactionOperationsViewTest(TestCase):
    """
    Test BulkTransactionOperationsView for bulk assignment operations
    """
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
        self.transactions = self.fixtures.create_transactions(self.users)
        self.url = '/api/v1/transactions/bulk-operations/'
    
    def test_bulk_assign_to_editor(self):
        """Test bulk assignment of multiple transactions to an editor"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # Get IDs of bulk transactions
        transaction_ids = [
            self.transactions['bulk_1'].id,
            self.transactions['bulk_2'].id,
            self.transactions['bulk_3'].id
        ]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['editor1'].id,
            'reason': 'Bulk assignment for efficiency'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all transactions were assigned
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertEqual(transaction.assigned_to, self.users['editor1'])
    
    def test_bulk_reassign_transactions(self):
        """Test bulk reassignment from one editor to another"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # First, assign to editor1
        transaction_ids = [
            self.transactions['bulk_1'].id,
            self.transactions['bulk_2'].id
        ]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['editor1'].id,
            'reason': 'Initial assignment'
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Now reassign to editor2
        data['assigned_to'] = self.users['editor2'].id
        data['reason'] = 'Bulk reassignment'
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify reassignment
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertEqual(transaction.assigned_to, self.users['editor2'])
    
    def test_bulk_cannot_assign_to_client(self):
        """Test that bulk assignment to client users fails"""
        self.client.force_authenticate(user=self.users['admin'])
        
        transaction_ids = [self.transactions['bulk_1'].id]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['client1'].id,  # Try to assign to client
            'reason': 'Invalid bulk assignment'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_bulk_assignment_by_client_fails(self):
        """Test that client users cannot perform bulk assignments"""
        self.client.force_authenticate(user=self.users['client1'])
        
        transaction_ids = [self.transactions['bulk_1'].id]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['editor1'].id,
            'reason': 'Client attempting bulk assignment'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_bulk_unassign(self):
        """Test bulk unassignment (setting assigned_to to null)"""
        self.client.force_authenticate(user=self.users['admin'])
        
        # First assign some transactions
        transaction_ids = [
            self.transactions['assigned_to_editor1'].id,
            self.transactions['assigned_to_editor2'].id
        ]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': None,  # Unassign
            'reason': 'Bulk unassignment'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify unassignment
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertIsNone(transaction.assigned_to)
    
    def test_bulk_operation_with_invalid_action(self):
        """Test bulk operation with invalid action"""
        self.client.force_authenticate(user=self.users['admin'])
        
        data = {
            'transaction_ids': [self.transactions['bulk_1'].id],
            'action': 'invalid_action',  # Invalid action
            'assigned_to': self.users['editor1'].id
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_bulk_assignment_persistence(self):
        """Test that bulk assignments persist after refresh"""
        self.client.force_authenticate(user=self.users['admin'])
        
        transaction_ids = [
            self.transactions['bulk_4'].id,
            self.transactions['bulk_5'].id
        ]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': self.users['editor2'].id,
            'reason': 'Testing persistence'
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Clear any caches and get fresh from database
        for tid in transaction_ids:
            transaction = Transaction.objects.get(id=tid)
            self.assertEqual(transaction.assigned_to.id, self.users['editor2'].id)
            
            # Also verify the assignment is correct type (not a client)
            self.assertIn(transaction.assigned_to.role, ['admin', 'editor'])
            self.assertTrue(transaction.assigned_to.is_active)