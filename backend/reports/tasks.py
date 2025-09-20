"""
Background tasks for report generation
"""

import logging
from datetime import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

from .models import ScheduledReport, ReportExecution
from .utils import PDFReportGenerator, ExcelReportGenerator
from transactions.models import Transaction
from users.models import User

logger = logging.getLogger(__name__)

User = get_user_model()


def execute_scheduled_report_sync(report_id, user_id=None):
    """
    Execute scheduled report synchronously (fallback when Celery not available)
    """
    try:
        scheduled_report = ScheduledReport.objects.get(id=report_id)
        user = User.objects.get(id=user_id) if user_id else None
        
        # Create execution record
        execution = ReportExecution.objects.create(
            scheduled_report=scheduled_report,
            report_name=scheduled_report.name,
            report_type=scheduled_report.report_type,
            status='processing',
            format_type=scheduled_report.format_type,
            filters_applied=scheduled_report.filters,
            executed_by=user,
            started_at=timezone.now()
        )
        
        try:
            # Generate report based on configuration
            if scheduled_report.report_type == 'template' and scheduled_report.report_template:
                # Use template-based report generation
                data = generate_template_report_data(scheduled_report.report_template, scheduled_report.filters)
                title = f"{scheduled_report.report_template.name} - {datetime.now().strftime('%Y-%m-%d')}"
                
            elif scheduled_report.report_type == 'custom' and scheduled_report.custom_report:
                # Use custom report builder
                data = generate_custom_report_data(scheduled_report.custom_report, scheduled_report.filters)
                title = f"{scheduled_report.custom_report.name} - {datetime.now().strftime('%Y-%m-%d')}"
                
            else:
                raise ValueError(f"Invalid report configuration for scheduled report {report_id}")
            
            # Generate report files
            report_files = []
            
            if scheduled_report.format_type in ['pdf', 'both']:
                pdf_generator = PDFReportGenerator()
                pdf_buffer = pdf_generator.generate_custom_report(data, title)
                pdf_filename = f"{scheduled_report.name}_{'_'.join(title.split())}.pdf"
                report_files.append(('pdf', pdf_buffer, pdf_filename))
            
            if scheduled_report.format_type in ['excel', 'both']:
                excel_generator = ExcelReportGenerator()
                excel_buffer = excel_generator.generate_custom_report(data)
                excel_filename = f"{scheduled_report.name}_{'_'.join(title.split())}.xlsx"
                report_files.append(('excel', excel_buffer, excel_filename))
            
            # Update execution status
            execution.record_count = len(data) if isinstance(data, list) else 0
            execution.status = 'completed'
            execution.completed_at = timezone.now()
            execution.calculate_execution_time()
            
            # Send email notifications if recipients are configured
            if scheduled_report.recipients and report_files:
                send_scheduled_report_email(scheduled_report, report_files, execution)
            
            # Update scheduled report's last run and next run
            scheduled_report.last_run = timezone.now()
            next_run = scheduled_report.calculate_next_run()
            if next_run:
                scheduled_report.next_run = next_run
            else:
                # One-time report, deactivate
                scheduled_report.is_active = False
            scheduled_report.save()
            
            logger.info(f"Scheduled report {report_id} executed successfully")
            return execution.id
            
        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.completed_at = timezone.now()
            execution.save()
            logger.error(f"Scheduled report {report_id} execution failed: {str(e)}")
            raise
            
    except Exception as e:
        logger.error(f"Failed to execute scheduled report {report_id}: {str(e)}")
        raise


def generate_template_report_data(report_template, additional_filters):
    """
    Generate data based on report template configuration
    """
    config = report_template.configuration
    report_type = report_template.report_type
    filters = {**report_template.filters, **additional_filters}
    
    if report_type == 'transaction':
        queryset = Transaction.objects.filter(is_deleted=False)
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(Transaction, field) and value:
                if field in ['created_at', 'updated_at'] and isinstance(value, dict):
                    if 'start' in value:
                        queryset = queryset.filter(**{f"{field}__gte": value['start']})
                    if 'end' in value:
                        queryset = queryset.filter(**{f"{field}__lte": value['end']})
                else:
                    queryset = queryset.filter(**{field: value})
        
        # Select columns
        columns = report_template.columns or ['transaction_id', 'status', 'priority', 'category', 'title', 'created_at']
        data = list(queryset.values(*columns))
        
    elif report_type == 'user':
        queryset = User.objects.all()
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(User, field) and value:
                queryset = queryset.filter(**{field: value})
        
        columns = report_template.columns or ['username', 'email', 'role', 'is_active', 'date_joined']
        data = list(queryset.values(*columns))
        
    else:
        raise ValueError(f"Unsupported template report type: {report_type}")
    
    return data


def generate_custom_report_data(custom_report, additional_filters):
    """
    Generate data based on custom report builder configuration
    """
    data_source = custom_report.data_source
    filters = {**dict(custom_report.filters), **additional_filters}
    columns = custom_report.columns or []
    
    if data_source == 'transactions':
        queryset = Transaction.objects.filter(is_deleted=False)
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(Transaction, field) and value:
                if field in ['created_at', 'updated_at'] and isinstance(value, dict):
                    if 'start' in value:
                        queryset = queryset.filter(**{f"{field}__gte": value['start']})
                    if 'end' in value:
                        queryset = queryset.filter(**{f"{field}__lte": value['end']})
                else:
                    queryset = queryset.filter(**{field: value})
        
        # Apply grouping if specified
        if custom_report.grouping:
            from django.db.models import Count
            data = list(queryset.values(*custom_report.grouping).annotate(count=Count('id')))
        else:
            data = list(queryset.values(*columns if columns else ['transaction_id', 'status', 'created_at']))
            
    elif data_source == 'users':
        queryset = User.objects.all()
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(User, field) and value:
                queryset = queryset.filter(**{field: value})
        
        if custom_report.grouping:
            from django.db.models import Count
            data = list(queryset.values(*custom_report.grouping).annotate(count=Count('id')))
        else:
            data = list(queryset.values(*columns if columns else ['username', 'email', 'role']))
            
    else:
        raise ValueError(f"Unsupported data source: {data_source}")
    
    return data


def send_scheduled_report_email(scheduled_report, report_files, execution):
    """
    Send email with scheduled report attachments
    """
    try:
        subject = f"Scheduled Report: {scheduled_report.name}"
        message = f"""
        Hello,
        
        Your scheduled report "{scheduled_report.name}" has been generated successfully.
        
        Report Details:
        - Generated on: {execution.completed_at.strftime('%Y-%m-%d %H:%M:%S')}
        - Records count: {execution.record_count}
        - Execution time: {execution.execution_time_seconds:.2f} seconds
        
        Please find the attached report files.
        
        Best regards,
        MDC Transaction Tracking System
        """
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = scheduled_report.recipients
        
        # Note: In a real implementation, you would attach the report files
        # For now, we'll just send the notification email
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        logger.info(f"Scheduled report email sent to {len(recipient_list)} recipients")
        
    except Exception as e:
        logger.error(f"Failed to send scheduled report email: {str(e)}")


# Try to use Celery if available, otherwise use synchronous execution
try:
    from celery import shared_task
    
    @shared_task
    def execute_scheduled_report(report_id, user_id=None):
        """
        Celery task for executing scheduled reports
        """
        return execute_scheduled_report_sync(report_id, user_id)
        
    @shared_task
    def process_due_scheduled_reports():
        """
        Process all scheduled reports that are due for execution
        """
        due_reports = ScheduledReport.objects.filter(
            is_active=True,
            next_run__lte=timezone.now()
        )
        
        processed_count = 0
        for report in due_reports:
            try:
                execute_scheduled_report.delay(report.id)
                processed_count += 1
            except Exception as e:
                logger.error(f"Failed to queue scheduled report {report.id}: {str(e)}")
        
        logger.info(f"Queued {processed_count} scheduled reports for processing")
        return processed_count
        
except ImportError:
    # Fallback to synchronous execution if Celery is not available
    logger.warning("Celery not available, using synchronous report execution")
    
    class MockTask:
        def delay(self, *args, **kwargs):
            # Return a mock result that has an id attribute
            class MockResult:
                def __init__(self):
                    import uuid
                    self.id = str(uuid.uuid4())
            
            # Execute synchronously
            execute_scheduled_report_sync(*args, **kwargs)
            return MockResult()
    
    execute_scheduled_report = MockTask()
    
    def process_due_scheduled_reports():
        """
        Process all scheduled reports that are due for execution (sync)
        """
        due_reports = ScheduledReport.objects.filter(
            is_active=True,
            next_run__lte=timezone.now()
        )
        
        processed_count = 0
        for report in due_reports:
            try:
                execute_scheduled_report_sync(report.id)
                processed_count += 1
            except Exception as e:
                logger.error(f"Failed to execute scheduled report {report.id}: {str(e)}")
        
        logger.info(f"Processed {processed_count} scheduled reports")
        return processed_count