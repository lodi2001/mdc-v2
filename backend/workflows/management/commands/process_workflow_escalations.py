"""
Management command to process workflow escalations
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from workflows.tasks import process_workflow_escalations_sync


class Command(BaseCommand):
    help = 'Process workflow escalations for overdue stages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run in dry-run mode without sending notifications',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Running in dry-run mode - no notifications will be sent')
            )
        
        self.stdout.write('Starting workflow escalation processing...')
        
        start_time = timezone.now()
        
        try:
            if dry_run:
                # In dry-run mode, we would implement a version that doesn't send emails
                self.stdout.write('Dry-run mode not fully implemented yet')
                processed_count = 0
            else:
                processed_count = process_workflow_escalations_sync()
            
            end_time = timezone.now()
            duration = (end_time - start_time).total_seconds()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully processed {processed_count} escalations in {duration:.2f} seconds'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing workflow escalations: {str(e)}')
            )
            raise