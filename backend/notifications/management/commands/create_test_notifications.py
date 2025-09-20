"""
Management command to create test notifications
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates test notifications for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Username to create notifications for',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of notifications to create',
        )

    def handle(self, *args, **options):
        username = options.get('user')
        count = options['count']
        
        # Get user
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User {username} not found'))
                return
        else:
            # Get first user
            user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR('No users found in database'))
                return
        
        self.stdout.write(f'Creating {count} test notifications for user {user.username}...')
        
        # Sample notification data
        notification_templates = [
            {
                'type': 'transaction',
                'category': 'info',
                'title': 'New Transaction Created',
                'message': 'Transaction #{} has been created and assigned to you for processing.'
            },
            {
                'type': 'transaction',
                'category': 'success',
                'title': 'Transaction Completed',
                'message': 'Transaction #{} has been successfully completed and approved.'
            },
            {
                'type': 'transaction',
                'category': 'warning',
                'title': 'Transaction Pending Review',
                'message': 'Transaction #{} requires your immediate review and approval.'
            },
            {
                'type': 'transaction',
                'category': 'danger',
                'title': 'Transaction Failed',
                'message': 'Transaction #{} has failed validation. Please review the errors and resubmit.'
            },
            {
                'type': 'system',
                'category': 'info',
                'title': 'System Maintenance',
                'message': 'Scheduled maintenance will occur on {} from 2:00 AM to 4:00 AM.'
            },
            {
                'type': 'system',
                'category': 'success',
                'title': 'System Updated',
                'message': 'The system has been successfully updated to version {}.'
            },
            {
                'type': 'system',
                'category': 'warning',
                'title': 'High System Load',
                'message': 'System is experiencing high load. Response times may be slower than usual.'
            },
            {
                'type': 'user',
                'category': 'info',
                'title': 'Profile Update',
                'message': 'Your profile has been updated successfully.'
            },
            {
                'type': 'user',
                'category': 'success',
                'title': 'Login Successful',
                'message': 'You have successfully logged in from IP address {}.'
            },
            {
                'type': 'user',
                'category': 'warning',
                'title': 'Password Expiring Soon',
                'message': 'Your password will expire in {} days. Please update it soon.'
            },
            {
                'type': 'report',
                'category': 'success',
                'title': 'Report Generated',
                'message': 'Your requested report "{}" has been generated and is ready for download.'
            },
            {
                'type': 'report',
                'category': 'info',
                'title': 'Report Processing',
                'message': 'Your report "{}" is being processed. You will be notified when complete.'
            },
            {
                'type': 'report',
                'category': 'danger',
                'title': 'Report Generation Failed',
                'message': 'Failed to generate report "{}". Please check your parameters and try again.'
            }
        ]
        
        notifications_created = []
        now = timezone.now()
        
        for i in range(count):
            template = random.choice(notification_templates)
            
            # Create time variations (notifications from different times)
            if i < 5:
                # Recent notifications (today)
                created_at = now - timedelta(minutes=random.randint(1, 300))
            elif i < 10:
                # Yesterday
                created_at = now - timedelta(days=1, minutes=random.randint(1, 1440))
            elif i < 15:
                # This week
                created_at = now - timedelta(days=random.randint(2, 7))
            else:
                # Older
                created_at = now - timedelta(days=random.randint(8, 30))
            
            # Format message with random data
            message = template['message']
            if '{}' in message:
                if 'transaction' in template['type']:
                    message = message.format(f'TRX{random.randint(1000, 9999)}')
                elif 'system' in template['type']:
                    if 'version' in message:
                        message = message.format(f'{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 99)}')
                    elif 'maintenance' in message.lower():
                        message = message.format((now + timedelta(days=random.randint(1, 7))).strftime('%Y-%m-%d'))
                elif 'user' in template['type']:
                    if 'IP' in message:
                        message = message.format(f'{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}')
                    elif 'days' in message:
                        message = message.format(random.randint(1, 30))
                elif 'report' in template['type']:
                    report_names = ['Monthly Sales Report', 'Transaction Summary', 'User Activity Report', 'System Performance Report']
                    message = message.format(random.choice(report_names))
            
            # Randomly mark some as read (older ones more likely to be read)
            is_read = random.random() < (0.7 if created_at < now - timedelta(days=1) else 0.3)
            read_at = created_at + timedelta(minutes=random.randint(1, 60)) if is_read else None
            
            notification = Notification.objects.create(
                user=user,
                title=template['title'],
                message=message,
                type=template['type'],
                category=template['category'],
                is_read=is_read,
                read_at=read_at,
                created_at=created_at,
                action_link=f'/transactions/{random.randint(1, 100)}' if template['type'] == 'transaction' and random.random() > 0.5 else '',
                metadata={
                    'test': True,
                    'batch': i // 5,
                    'template_index': notification_templates.index(template)
                }
            )
            
            # Need to update created_at after creation since auto_now_add overrides it
            Notification.objects.filter(id=notification.id).update(created_at=created_at)
            
            notifications_created.append(notification)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(notifications_created)} test notifications for user {user.username}'
            )
        )
        
        # Print summary
        unread_count = sum(1 for n in notifications_created if not n.is_read)
        self.stdout.write(f'  - Unread: {unread_count}')
        self.stdout.write(f'  - Read: {len(notifications_created) - unread_count}')
        
        by_type = {}
        for n in notifications_created:
            by_type[n.type] = by_type.get(n.type, 0) + 1
        
        self.stdout.write('By type:')
        for type_name, count in by_type.items():
            self.stdout.write(f'  - {type_name}: {count}')