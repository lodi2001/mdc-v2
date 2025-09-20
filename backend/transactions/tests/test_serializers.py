"""
Test cases for transaction serializers focusing on assignment functionality
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from transactions.serializers import (
    TransactionAssignmentSerializer,
    BulkTransactionOperationSerializer,
    TransactionFilterSerializer
)
from transactions.models import Transaction
from .fixtures import TestFixtures

User = get_user_model()


class TransactionAssignmentSerializerTest(TestCase):
    """
    Test TransactionAssignmentSerializer to ensure proper user filtering
    """
    
    def setUp(self):
        """Set up test data"""
        self.factory = APIRequestFactory()
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
        self.transactions = self.fixtures.create_transactions(self.users)
    
    def test_assigned_to_queryset_filters_correctly(self):
        """
        Test that assigned_to field only includes active editors and admins
        """
        serializer = TransactionAssignmentSerializer()
        
        # Get the queryset for assigned_to field
        assigned_to_queryset = serializer.fields['assigned_to'].queryset
        
        # Should include active admin and editors
        self.assertIn(self.users['admin'], assigned_to_queryset)
        self.assertIn(self.users['editor1'], assigned_to_queryset)
        self.assertIn(self.users['editor2'], assigned_to_queryset)
        
        # Should NOT include inactive editor
        self.assertNotIn(self.users['inactive_editor'], assigned_to_queryset)
        
        # Should NOT include client users
        self.assertNotIn(self.users['client1'], assigned_to_queryset)
        self.assertNotIn(self.users['client2'], assigned_to_queryset)
    
    def test_uses_is_active_not_status(self):
        """
        Test that the serializer uses is_active=True, not status='active'
        This was the critical bug that was fixed
        """
        serializer = TransactionAssignmentSerializer()
        queryset = serializer.fields['assigned_to'].queryset
        
        # Verify the queryset filters by is_active=True
        # This should work without errors (no 'status' field exists)
        active_users = list(queryset.filter(is_active=True))
        
        # Should have exactly 3 active editor/admin users
        self.assertEqual(len(active_users), 3)
        
        # Verify roles
        for user in active_users:
            self.assertIn(user.role, ['admin', 'editor'])
            self.assertTrue(user.is_active)
    
    def test_valid_assignment_data(self):
        """Test valid assignment data passes validation"""
        data = {
            'assigned_to': self.users['editor1'].id,
            'reason': 'Reassigning for expertise'
        }
        
        serializer = TransactionAssignmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_assignment_to_client_fails(self):
        """Test that assigning to a client user fails validation"""
        # Try to assign to a client (should fail)
        data = {
            'assigned_to': self.users['client1'].id,
            'reason': 'Invalid assignment'
        }
        
        serializer = TransactionAssignmentSerializer(data=data)
        # Client is not in the allowed queryset, so this should be invalid
        self.assertFalse(serializer.is_valid())
        if serializer.errors:
            self.assertIn('assigned_to', serializer.errors)
    
    def test_null_assignment_allowed(self):
        """Test that null assignment (unassign) is allowed"""
        data = {
            'assigned_to': None,
            'reason': 'Unassigning transaction'
        }
        
        serializer = TransactionAssignmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class BulkTransactionOperationSerializerTest(TestCase):
    """
    Test BulkTransactionOperationSerializer for bulk assignment operations
    """
    
    def setUp(self):
        """Set up test data"""
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
        self.transactions = self.fixtures.create_transactions(self.users)
    
    def test_bulk_assignment_queryset_filters_correctly(self):
        """
        Test that assigned_to field only includes active editors and admins for bulk operations
        """
        serializer = BulkTransactionOperationSerializer()
        
        # Get the queryset for assigned_to field
        assigned_to_queryset = serializer.fields['assigned_to'].queryset
        
        # Should include active admin and editors
        self.assertIn(self.users['admin'], assigned_to_queryset)
        self.assertIn(self.users['editor1'], assigned_to_queryset)
        self.assertIn(self.users['editor2'], assigned_to_queryset)
        
        # Should NOT include inactive editor
        self.assertNotIn(self.users['inactive_editor'], assigned_to_queryset)
        
        # Should NOT include client users
        self.assertNotIn(self.users['client1'], assigned_to_queryset)
        self.assertNotIn(self.users['client2'], assigned_to_queryset)
    
    def test_bulk_uses_is_active_filter(self):
        """
        Verify bulk operations also use is_active=True filtering
        """
        serializer = BulkTransactionOperationSerializer()
        queryset = serializer.fields['assigned_to'].queryset
        
        # All users in queryset should be active
        for user in queryset:
            self.assertTrue(user.is_active)
            self.assertIn(user.role, ['admin', 'editor'])
    
    def test_valid_bulk_assignment(self):
        """Test valid bulk assignment data"""
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
        
        serializer = BulkTransactionOperationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_bulk_assignment_requires_assigned_to(self):
        """Test that assign action requires assigned_to field"""
        transaction_ids = [self.transactions['bulk_1'].id]
        
        data = {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            # Missing assigned_to
            'reason': 'Missing assignee'
        }
        
        serializer = BulkTransactionOperationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('assigned_to', str(serializer.errors))
    
    def test_transaction_ids_validation(self):
        """Test validation of transaction IDs"""
        # Try with non-existent transaction ID
        data = {
            'transaction_ids': [99999],  # Non-existent ID
            'action': 'assign',
            'assigned_to': self.users['editor1'].id
        }
        
        serializer = BulkTransactionOperationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('transaction_ids', serializer.errors)


class TransactionFilterSerializerTest(TestCase):
    """
    Test TransactionFilterSerializer for proper user filtering in filter operations
    """
    
    def setUp(self):
        """Set up test data"""
        self.fixtures = TestFixtures()
        self.users = self.fixtures.create_users()
    
    def test_filter_assigned_to_queryset(self):
        """
        Test that filter serializer properly filters assigned_to field
        """
        serializer = TransactionFilterSerializer()
        
        # Get the queryset for assigned_to field
        assigned_to_queryset = serializer.fields['assigned_to'].queryset
        
        # Should only include active editors and admins
        for user in assigned_to_queryset:
            self.assertTrue(user.is_active)
            self.assertIn(user.role, ['admin', 'editor'])
        
        # Should not include clients
        self.assertNotIn(self.users['client1'], assigned_to_queryset)
        self.assertNotIn(self.users['client2'], assigned_to_queryset)
    
    def test_filter_client_queryset(self):
        """
        Test that filter serializer properly filters client field
        """
        serializer = TransactionFilterSerializer()
        
        # Get the queryset for client field
        client_queryset = serializer.fields['client'].queryset
        
        # Should only include active clients
        for user in client_queryset:
            self.assertTrue(user.is_active)
            self.assertEqual(user.role, 'client')
        
        # Should not include editors or admins
        self.assertNotIn(self.users['admin'], client_queryset)
        self.assertNotIn(self.users['editor1'], client_queryset)
        self.assertNotIn(self.users['editor2'], client_queryset)