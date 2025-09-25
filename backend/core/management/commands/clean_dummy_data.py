"""
Management command to clean dummy/injected data
Keeps only data created by admin user
"""

from django.core.management.base import BaseCommand
from django.db import transaction, models
from users.models import User
from transactions.models import Transaction, TransactionStatusHistory, Comment
from attachments.models import Attachment
from notifications.models import Notification, EmailNotification
from audit.models import AuditLog


class Command(BaseCommand):
    help = 'Clean dummy/injected data and keep only admin-created data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--keep-users',
            action='store_true',
            help='Keep all users (only clean transactions)',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        keep_users = options.get('keep_users', False)

        self.stdout.write(self.style.WARNING('Starting data cleanup...'))

        # Get admin user
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found!'))
            return

        with transaction.atomic():
            # Statistics before cleanup
            self.stdout.write(self.style.SUCCESS('\n=== Current Statistics ==='))
            self._print_statistics()

            # Clean transactions not created by admin
            self._clean_transactions(admin_user, dry_run)

            # Clean users (except admin and users created by admin)
            if not keep_users:
                self._clean_users(admin_user, dry_run)

            # Clean orphaned data
            self._clean_orphaned_data(dry_run)

            # Statistics after cleanup
            if not dry_run:
                self.stdout.write(self.style.SUCCESS('\n=== Statistics After Cleanup ==='))
                self._print_statistics()

            if dry_run:
                self.stdout.write(self.style.WARNING('\nDRY RUN - No data was actually deleted'))
                # Rollback the transaction in dry run mode
                transaction.set_rollback(True)
            else:
                self.stdout.write(self.style.SUCCESS('\nData cleanup completed successfully!'))

    def _print_statistics(self):
        """Print current database statistics"""
        stats = {
            'Users': User.objects.count(),
            'Transactions': Transaction.objects.filter(is_deleted=False).count(),
            'Comments': Comment.objects.filter(is_deleted=False).count(),
            'Attachments': Attachment.objects.filter(is_deleted=False).count(),
            'Notifications': Notification.objects.count(),
            'Audit Logs': AuditLog.objects.count(),
        }

        for model, count in stats.items():
            self.stdout.write(f'{model}: {count}')

        # Transaction breakdown by status
        self.stdout.write('\nTransactions by status:')
        status_counts = Transaction.objects.filter(is_deleted=False).values('status').annotate(
            count=models.Count('id')
        )
        for item in status_counts:
            self.stdout.write(f"  {item['status']}: {item['count']}")

    def _clean_transactions(self, admin_user, dry_run):
        """Clean transactions not created by admin"""
        self.stdout.write(self.style.WARNING('\n=== Cleaning Transactions ==='))

        # Get transactions to delete (not created by admin)
        transactions_to_delete = Transaction.objects.exclude(
            created_by=admin_user
        ).filter(is_deleted=False)

        count = transactions_to_delete.count()
        self.stdout.write(f'Found {count} transactions not created by admin')

        if count > 0:
            # Get IDs for cascading deletes
            transaction_ids = list(transactions_to_delete.values_list('id', flat=True))

            # Delete related data
            comments_deleted = Comment.objects.filter(transaction_id__in=transaction_ids).count()
            attachments_deleted = Attachment.objects.filter(transaction_id__in=transaction_ids).count()
            history_deleted = TransactionStatusHistory.objects.filter(transaction_id__in=transaction_ids).count()

            self.stdout.write(f'  - {comments_deleted} comments will be deleted')
            self.stdout.write(f'  - {attachments_deleted} attachments will be deleted')
            self.stdout.write(f'  - {history_deleted} status history records will be deleted')

            if not dry_run:
                # Soft delete transactions
                transactions_to_delete.update(is_deleted=True)
                # Hard delete related data
                Comment.objects.filter(transaction_id__in=transaction_ids).delete()
                Attachment.objects.filter(transaction_id__in=transaction_ids).delete()
                TransactionStatusHistory.objects.filter(transaction_id__in=transaction_ids).delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {count} transactions and related data'))
        else:
            self.stdout.write('No transactions to delete')

    def _clean_users(self, admin_user, dry_run):
        """Clean users not created by admin (keep admin and essential users)"""
        self.stdout.write(self.style.WARNING('\n=== Cleaning Users ==='))

        # Keep admin and users created by admin
        users_to_keep = User.objects.filter(
            models.Q(username='admin') |
            models.Q(created_by=admin_user) if hasattr(User, 'created_by') else models.Q()
        )

        # Users to delete
        users_to_delete = User.objects.exclude(
            id__in=users_to_keep.values_list('id', flat=True)
        ).exclude(
            username__in=['admin', 'editor', 'client']  # Keep these essential test users if you want
        )

        count = users_to_delete.count()
        self.stdout.write(f'Found {count} users to delete')

        if count > 0:
            # Get user IDs for cascading operations
            user_ids = list(users_to_delete.values_list('id', flat=True))

            # First, clean up transactions created by these users
            transactions_by_deleted_users = Transaction.objects.filter(
                created_by_id__in=user_ids
            ).filter(is_deleted=False)
            trans_count = transactions_by_deleted_users.count()

            if trans_count > 0:
                self.stdout.write(f'  - {trans_count} transactions created by these users will be deleted')
                if not dry_run:
                    transactions_by_deleted_users.update(is_deleted=True)

            # List users to be deleted
            for user in users_to_delete[:10]:  # Show first 10
                self.stdout.write(f'  - {user.username} ({user.email})')
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')

            if not dry_run:
                # Now we can safely delete users
                users_to_delete.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {count} users'))
        else:
            self.stdout.write('No users to delete')

    def _clean_orphaned_data(self, dry_run):
        """Clean orphaned notifications and audit logs"""
        self.stdout.write(self.style.WARNING('\n=== Cleaning Orphaned Data ==='))

        # Clean old notifications
        from datetime import timedelta
        from django.utils import timezone

        old_date = timezone.now() - timedelta(days=30)
        old_notifications = Notification.objects.filter(created_at__lt=old_date)
        notif_count = old_notifications.count()

        if notif_count > 0:
            self.stdout.write(f'Found {notif_count} old notifications (>30 days)')
            if not dry_run:
                old_notifications.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {notif_count} old notifications'))

        # Clean orphaned email notifications
        orphaned_emails = EmailNotification.objects.filter(
            transaction__is_deleted=True
        )
        email_count = orphaned_emails.count()

        if email_count > 0:
            self.stdout.write(f'Found {email_count} orphaned email notifications')
            if not dry_run:
                orphaned_emails.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {email_count} orphaned email notifications'))

        # Keep audit logs for reference (optional: clean very old ones)
        old_audit_logs = AuditLog.objects.filter(created_at__lt=old_date)
        audit_count = old_audit_logs.count()
        if audit_count > 0:
            self.stdout.write(f'Found {audit_count} old audit logs (>30 days) - keeping for reference')