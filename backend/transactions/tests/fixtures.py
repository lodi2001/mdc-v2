"""
Test fixtures for transaction tests
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from transactions.models import Transaction

User = get_user_model()


class TestFixtures:
    """
    Reusable test fixtures for transaction tests
    """
    
    @staticmethod
    def create_users():
        """
        Create test users with different roles
        """
        users = {}
        
        # Admin user - can assign and manage all transactions
        users['admin'] = User.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_active=True,
            status='active'
        )
        
        # Editor users - can be assigned and can assign transactions
        users['editor1'] = User.objects.create_user(
            username='editor1',
            email='editor1@test.com',
            password='testpass123',
            first_name='Editor',
            last_name='One',
            role='editor',
            is_active=True,
            status='active'
        )

        users['editor2'] = User.objects.create_user(
            username='editor2',
            email='editor2@test.com',
            password='testpass123',
            first_name='Editor',
            last_name='Two',
            role='editor',
            is_active=True,
            status='active'
        )
        
        # Inactive editor - should not appear in assignment dropdown
        users['inactive_editor'] = User.objects.create_user(
            username='inactive_editor',
            email='inactive@test.com',
            password='testpass123',
            first_name='Inactive',
            last_name='Editor',
            role='editor',
            is_active=False  # This user should be filtered out
        )
        
        # Client users - cannot be assigned and cannot assign
        users['client1'] = User.objects.create_user(
            username='client1',
            email='client1@test.com',
            password='testpass123',
            first_name='Client',
            last_name='One',
            role='client',
            is_active=True,
            status='active',
            company_name='Test Company 1'
        )

        users['client2'] = User.objects.create_user(
            username='client2',
            email='client2@test.com',
            password='testpass123',
            first_name='Client',
            last_name='Two',
            role='client',
            is_active=True,
            status='active',
            company_name='Test Company 2'
        )
        
        return users
    
    @staticmethod
    def create_transactions(users):
        """
        Create test transactions in various states
        """
        transactions = {}
        
        # Transaction assigned to editor1
        transactions['assigned_to_editor1'] = Transaction.objects.create(
            client_name='Test Client 1',
            transaction_type='Import',
            description='Test transaction assigned to editor1',
            status='in_progress',
            priority='high',
            created_by=users['admin'],
            assigned_to=users['editor1'],
            client=users['client1'],
            due_date=timezone.now().date() + timedelta(days=7)
        )
        
        # Transaction assigned to editor2
        transactions['assigned_to_editor2'] = Transaction.objects.create(
            client_name='Test Client 2',
            transaction_type='Export',
            description='Test transaction assigned to editor2',
            status='in_progress',
            priority='medium',
            created_by=users['admin'],
            assigned_to=users['editor2'],
            client=users['client2'],
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        # Unassigned transaction
        transactions['unassigned'] = Transaction.objects.create(
            client_name='Test Client 1',
            transaction_type='Import',
            description='Unassigned test transaction',
            status='pending',
            priority='low',
            created_by=users['client1'],
            assigned_to=None,
            client=users['client1'],
            due_date=timezone.now().date() + timedelta(days=30)
        )
        
        # Multiple transactions for bulk operations
        for i in range(1, 6):
            transactions[f'bulk_{i}'] = Transaction.objects.create(
                client_name=f'Bulk Client {i}',
                transaction_type='Import' if i % 2 == 0 else 'Export',
                    description=f'Bulk test transaction {i}',
                status='pending',
                priority='medium',
                created_by=users['admin'],
                assigned_to=None,
                client=users['client1'] if i % 2 == 0 else users['client2'],
                due_date=timezone.now().date() + timedelta(days=i * 5)
            )
        
        return transactions
    
    @staticmethod
    def get_valid_assignment_data():
        """
        Get valid data for assignment serializer
        """
        return {
            'reason': 'Reassigning for load balancing'
        }
    
    @staticmethod
    def get_bulk_assignment_data(transaction_ids, assigned_to_id):
        """
        Get valid data for bulk assignment operation
        """
        return {
            'transaction_ids': transaction_ids,
            'action': 'assign',
            'assigned_to': assigned_to_id,
            'reason': 'Bulk reassignment for efficiency'
        }