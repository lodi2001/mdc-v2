"""
Signal handlers for transaction-related events to trigger notifications
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Comment, TransactionStatusHistory
from notifications.models import Notification
from users.models import User


@receiver(post_save, sender=Comment)
def notify_on_comment_created(sender, instance, created, **kwargs):
    """
    Send notifications when a comment is added to a transaction
    """
    if created:
        comment = instance
        transaction = comment.transaction

        # Get all stakeholders who should be notified
        stakeholders = set()

        # Add transaction client
        if transaction.client and transaction.client != comment.user:
            stakeholders.add(transaction.client)

        # Add assigned user
        if transaction.assigned_to and transaction.assigned_to != comment.user:
            stakeholders.add(transaction.assigned_to)

        # Add transaction creator
        if transaction.created_by and transaction.created_by != comment.user:
            stakeholders.add(transaction.created_by)

        # Add admins if it's an important comment
        if not comment.is_internal:
            admin_users = User.objects.filter(role='admin', is_active=True).exclude(id=comment.user.id)
            for admin in admin_users[:3]:  # Limit to 3 admins to avoid spam
                stakeholders.add(admin)

        # Create notifications for all stakeholders
        for user in stakeholders:
            # Don't show internal comments to clients
            if comment.is_internal and user.role == 'client':
                continue

            Notification.create_for_user(
                user=user,
                title='New Comment on Transaction',
                message=f'{comment.user.get_full_name()} commented on transaction {transaction.transaction_id}: "{comment.content[:50]}..."',
                type='transaction',
                category='info',
                transaction=transaction,
                action_link=f'/transactions/{transaction.id}',
                metadata={
                    'comment_id': comment.id,
                    'comment_by': comment.user.get_full_name(),
                    'is_internal': comment.is_internal
                }
            )


@receiver(post_save, sender=TransactionStatusHistory)
def notify_on_status_history(sender, instance, created, **kwargs):
    """
    Send notifications when transaction status history is created
    This provides additional notification for status changes
    """
    if created:
        history = instance
        transaction = history.transaction

        # Only notify if there's a status change
        if history.previous_status != history.new_status:
            # Notify client about status change
            if transaction.client and history.changed_by != transaction.client:
                category = 'success' if history.new_status == 'completed' else 'warning' if history.new_status in ['cancelled', 'on-hold'] else 'info'

                Notification.create_for_user(
                    user=transaction.client,
                    title='Transaction Status Updated',
                    message=f'Your transaction {transaction.transaction_id} status changed to {transaction.get_status_display()}',
                    type='transaction',
                    category=category,
                    transaction=transaction,
                    action_link=f'/transactions/{transaction.id}',
                    metadata={
                        'from_status': history.previous_status,
                        'to_status': history.new_status,
                        'changed_by': history.changed_by.get_full_name() if history.changed_by else 'System'
                    }
                )