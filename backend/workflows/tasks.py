"""
Background tasks for workflow escalation and automation
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, F, Count
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

from .models import (
    WorkflowInstance, WorkflowStageHistory, WorkflowEscalation,
    WorkflowStage, WorkflowTemplate
)
from notifications.models import EmailNotification
from audit.models import AuditLog

logger = logging.getLogger(__name__)

User = get_user_model()


def process_workflow_escalations_sync():
    """
    Process all workflow escalations that are due (synchronous version)
    """
    processed_count = 0
    
    # Get all active workflow instances
    active_instances = WorkflowInstance.objects.filter(
        status='active',
        current_stage__isnull=False
    ).select_related(
        'current_stage', 'workflow_template', 'transaction'
    ).prefetch_related(
        'current_stage__escalations'
    )
    
    for instance in active_instances:
        try:
            # Get current stage history entry
            current_history = WorkflowStageHistory.objects.filter(
                workflow_instance=instance,
                stage=instance.current_stage,
                exited_at__isnull=True
            ).first()
            
            if not current_history:
                continue
            
            # Check if any escalations are due for this stage
            escalations = instance.current_stage.escalations.filter(
                is_active=True
            ).order_by('escalation_after_hours')
            
            for escalation in escalations:
                escalation_due_time = current_history.entered_at + timedelta(
                    hours=escalation.escalation_after_hours
                )
                
                if timezone.now() >= escalation_due_time:
                    if execute_escalation(instance, escalation, current_history):
                        processed_count += 1
                    
        except Exception as e:
            logger.error(f"Error processing escalation for workflow instance {instance.id}: {str(e)}")
    
    logger.info(f"Processed {processed_count} workflow escalations")
    return processed_count


def execute_escalation(workflow_instance, escalation, stage_history):
    """
    Execute a specific escalation for a workflow instance
    """
    try:
        # Check if this escalation has already been triggered
        escalation_count = AuditLog.objects.filter(
            object_type='WorkflowEscalation',
            object_id=escalation.id,
            action='escalation_triggered',
            details__workflow_instance_id=workflow_instance.id
        ).count()
        
        if escalation_count >= escalation.max_escalations:
            logger.info(f"Max escalations ({escalation.max_escalations}) reached for escalation {escalation.id}")
            return False
        
        # Determine escalation recipients
        recipients = []
        
        # Add users based on escalation role
        if escalation.escalate_to_role == 'admin':
            recipients.extend(
                User.objects.filter(role='admin', is_active=True).values_list('email', flat=True)
            )
        elif escalation.escalate_to_role == 'manager':
            # For now, escalate to admins as managers
            recipients.extend(
                User.objects.filter(role='admin', is_active=True).values_list('email', flat=True)
            )
        
        # Add specific users
        if escalation.escalate_to_users.exists():
            recipients.extend(
                escalation.escalate_to_users.filter(is_active=True).values_list('email', flat=True)
            )
        
        recipients = list(set(recipients))  # Remove duplicates
        
        if not recipients:
            logger.warning(f"No recipients found for escalation {escalation.id}")
            return False
        
        # Send escalation notifications
        escalation_context = {
            'workflow_instance': workflow_instance,
            'escalation': escalation,
            'stage_history': stage_history,
            'transaction': workflow_instance.transaction,
            'stage': workflow_instance.current_stage,
            'hours_overdue': escalation.escalation_after_hours,
            'escalation_count': escalation_count + 1,
        }
        
        subject = f"Workflow Escalation: {workflow_instance.workflow_template.name}"
        
        # Use custom template if provided, otherwise use default
        if escalation.notification_template:
            message = escalation.notification_template.format(**{
                'workflow_name': workflow_instance.workflow_template.name,
                'transaction_id': workflow_instance.transaction.transaction_id,
                'stage_name': workflow_instance.current_stage.name,
                'hours_overdue': escalation.escalation_after_hours,
                'escalation_count': escalation_count + 1,
            })
        else:
            message = f"""
Workflow Escalation Alert

Workflow: {workflow_instance.workflow_template.name}
Transaction: {workflow_instance.transaction.transaction_id}
Current Stage: {workflow_instance.current_stage.name}
Time in Stage: {escalation.escalation_after_hours}+ hours
Escalation Level: {escalation_count + 1}

The workflow has been in the current stage longer than expected and requires attention.

Please review and take appropriate action.

System: MDC Transaction Tracking System
"""
        
        # Send email notifications
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False,
            )
            
            # Create notification records
            for email in recipients:
                try:
                    user = User.objects.get(email=email)
                    EmailNotification.objects.create(
                        user=user,
                        subject=subject,
                        message=message,
                        notification_type='workflow_escalation',
                        status='sent'
                    )
                except User.DoesNotExist:
                    pass
            
        except Exception as e:
            logger.error(f"Failed to send escalation email: {str(e)}")
        
        # Log the escalation
        AuditLog.objects.create(
            user=None,  # System action
            action='escalation_triggered',
            object_type='WorkflowEscalation',
            object_id=escalation.id,
            details={
                'workflow_instance_id': workflow_instance.id,
                'transaction_id': workflow_instance.transaction.id,
                'stage_id': workflow_instance.current_stage.id,
                'escalation_after_hours': escalation.escalation_after_hours,
                'escalation_count': escalation_count + 1,
                'recipients': recipients,
                'escalate_to_role': escalation.escalate_to_role,
            }
        )
        
        logger.info(
            f"Escalation triggered for workflow {workflow_instance.id}, "
            f"stage {workflow_instance.current_stage.name}, "
            f"sent to {len(recipients)} recipients"
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to execute escalation {escalation.id}: {str(e)}")
        return False


def process_workflow_rules_sync():
    """
    Process all workflow rules for active instances (synchronous version)
    """
    processed_count = 0
    
    # Get all active workflow instances
    active_instances = WorkflowInstance.objects.filter(
        status='active'
    ).select_related(
        'workflow_template', 'current_stage'
    ).prefetch_related(
        'workflow_template__rules'
    )
    
    for instance in active_instances:
        try:
            # Process rules for this instance
            rules = instance.workflow_template.rules.filter(
                is_active=True
            ).order_by('priority')
            
            for rule in rules:
                if should_trigger_rule(instance, rule):
                    if execute_workflow_rule(instance, rule):
                        processed_count += 1
                        
        except Exception as e:
            logger.error(f"Error processing rules for workflow instance {instance.id}: {str(e)}")
    
    logger.info(f"Processed {processed_count} workflow rules")
    return processed_count


def should_trigger_rule(workflow_instance, rule):
    """
    Check if a workflow rule should be triggered
    """
    try:
        # Check trigger event
        if rule.trigger_event == 'stage_enter':
            # Check if we just entered the trigger stage
            if rule.trigger_stage and workflow_instance.current_stage == rule.trigger_stage:
                # Check if this is a recent entry (within last hour)
                recent_entry = WorkflowStageHistory.objects.filter(
                    workflow_instance=workflow_instance,
                    stage=rule.trigger_stage,
                    entered_at__gte=timezone.now() - timedelta(hours=1),
                    exited_at__isnull=True
                ).exists()
                return recent_entry
                
        elif rule.trigger_event == 'time_elapsed':
            # Check if enough time has elapsed
            condition = rule.condition
            hours_threshold = condition.get('hours', 24)
            
            current_history = WorkflowStageHistory.objects.filter(
                workflow_instance=workflow_instance,
                stage=workflow_instance.current_stage,
                exited_at__isnull=True
            ).first()
            
            if current_history:
                time_in_stage = timezone.now() - current_history.entered_at
                return time_in_stage >= timedelta(hours=hours_threshold)
                
        elif rule.trigger_event == 'condition_met':
            # Check custom conditions
            # This is a placeholder for more complex condition checking
            return evaluate_custom_condition(workflow_instance, rule.condition)
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking rule trigger for rule {rule.id}: {str(e)}")
        return False


def evaluate_custom_condition(workflow_instance, condition):
    """
    Evaluate custom conditions for workflow rules
    This is a placeholder for more complex condition evaluation
    """
    # Example condition evaluations
    if 'transaction_priority' in condition:
        required_priority = condition['transaction_priority']
        return workflow_instance.transaction.priority == required_priority
    
    if 'days_since_created' in condition:
        days_threshold = condition['days_since_created']
        days_since_created = (timezone.now() - workflow_instance.transaction.created_at).days
        return days_since_created >= days_threshold
    
    return False


def execute_workflow_rule(workflow_instance, rule):
    """
    Execute a workflow rule action
    """
    try:
        action = rule.action
        
        if rule.rule_type == 'notification':
            # Send notification
            return send_rule_notification(workflow_instance, rule, action)
            
        elif rule.rule_type == 'assignment':
            # Auto-assign to user or role
            return execute_auto_assignment(workflow_instance, action)
            
        elif rule.rule_type == 'escalation':
            # Trigger escalation
            return trigger_rule_escalation(workflow_instance, action)
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to execute workflow rule {rule.id}: {str(e)}")
        return False


def send_rule_notification(workflow_instance, rule, action):
    """
    Send notification based on workflow rule
    """
    try:
        recipients = action.get('recipients', [])
        subject = action.get('subject', f'Workflow Notification: {workflow_instance.workflow_template.name}')
        message_template = action.get('message', 'Workflow notification triggered.')
        
        # Format message with context
        message = message_template.format(
            workflow_name=workflow_instance.workflow_template.name,
            transaction_id=workflow_instance.transaction.transaction_id,
            current_stage=workflow_instance.current_stage.name,
        )
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
        
        # Log the notification
        AuditLog.objects.create(
            user=None,  # System action
            action='workflow_rule_notification',
            object_type='WorkflowRule',
            object_id=rule.id,
            details={
                'workflow_instance_id': workflow_instance.id,
                'recipients': recipients,
                'subject': subject,
            }
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send rule notification: {str(e)}")
        return False


def execute_auto_assignment(workflow_instance, action):
    """
    Execute auto-assignment rule
    """
    try:
        assignment_type = action.get('type', 'role')
        
        if assignment_type == 'role':
            role = action.get('role')
            if role:
                # Find available user with the specified role
                available_users = User.objects.filter(
                    role=role,
                    is_active=True
                ).order_by('?')  # Random order
                
                if available_users.exists():
                    assigned_user = available_users.first()
                    workflow_instance.transaction.assigned_to = assigned_user
                    workflow_instance.transaction.save()
                    
                    # Log the assignment
                    AuditLog.objects.create(
                        user=None,  # System action
                        action='workflow_auto_assignment',
                        object_type='WorkflowRule',
                        object_id=action.get('rule_id'),
                        details={
                            'workflow_instance_id': workflow_instance.id,
                            'assigned_to_user_id': assigned_user.id,
                            'assignment_type': assignment_type,
                            'role': role,
                        }
                    )
                    
                    return True
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to execute auto-assignment: {str(e)}")
        return False


def trigger_rule_escalation(workflow_instance, action):
    """
    Trigger escalation based on workflow rule
    """
    try:
        escalate_to_role = action.get('escalate_to_role', 'admin')
        
        # Find escalation recipients
        recipients = []
        if escalate_to_role == 'admin':
            recipients = list(User.objects.filter(
                role='admin', 
                is_active=True
            ).values_list('email', flat=True))
        
        if recipients:
            subject = f"Workflow Rule Escalation: {workflow_instance.workflow_template.name}"
            message = f"""
Rule-based escalation triggered for:

Workflow: {workflow_instance.workflow_template.name}
Transaction: {workflow_instance.transaction.transaction_id}
Current Stage: {workflow_instance.current_stage.name}

Please review and take appropriate action.
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False,
            )
            
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to trigger rule escalation: {str(e)}")
        return False


# Try to use Celery if available, otherwise use synchronous execution
try:
    from celery import shared_task
    
    @shared_task
    def process_workflow_escalations():
        """
        Celery task for processing workflow escalations
        """
        return process_workflow_escalations_sync()
    
    @shared_task
    def process_workflow_rules():
        """
        Celery task for processing workflow rules
        """
        return process_workflow_rules_sync()
        
except ImportError:
    # Fallback to synchronous execution if Celery is not available
    logger.warning("Celery not available, using synchronous workflow processing")
    
    class MockTask:
        def delay(self, *args, **kwargs):
            # Return a mock result that has an id attribute
            class MockResult:
                def __init__(self, result):
                    import uuid
                    self.id = str(uuid.uuid4())
                    self.result = result
            
            # Execute synchronously
            if hasattr(self, 'func'):
                result = self.func(*args, **kwargs)
                return MockResult(result)
            return MockResult(None)
    
    # Create mock tasks
    process_workflow_escalations = MockTask()
    process_workflow_escalations.func = process_workflow_escalations_sync
    
    process_workflow_rules = MockTask()
    process_workflow_rules.func = process_workflow_rules_sync