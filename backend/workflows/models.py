from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
import json

User = get_user_model()


class WorkflowTemplate(models.Model):
    """Template for defining workflow processes"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=[
        ('translation', 'Translation'),
        ('documentation', 'Documentation'),
        ('review', 'Review'),
        ('approval', 'Approval'),
        ('custom', 'Custom'),
    ])
    is_active = models.BooleanField(default=True)
    allow_parallel_stages = models.BooleanField(default=False)
    auto_assign = models.BooleanField(default=False)
    notification_enabled = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_workflows')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        
    def __str__(self):
        return self.name


class WorkflowStage(models.Model):
    """Individual stages within a workflow"""
    workflow = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    stage_type = models.CharField(max_length=50, choices=[
        ('start', 'Start'),
        ('task', 'Task'),
        ('review', 'Review'),
        ('approval', 'Approval'),
        ('conditional', 'Conditional'),
        ('parallel', 'Parallel'),
        ('end', 'End'),
    ])
    assigned_role = models.CharField(max_length=50, blank=True, choices=[
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('client', 'Client'),
        ('auto', 'Auto Assign'),
    ])
    assigned_users = models.ManyToManyField(User, blank=True, related_name='workflow_stages')
    duration_days = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    is_optional = models.BooleanField(default=False)
    requires_attachment = models.BooleanField(default=False)
    requires_comment = models.BooleanField(default=False)
    auto_complete = models.BooleanField(default=False)
    auto_complete_conditions = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['workflow', 'order']
        unique_together = ['workflow', 'order']
        
    def __str__(self):
        return f"{self.workflow.name} - {self.name}"


class WorkflowTransition(models.Model):
    """Allowed transitions between workflow stages"""
    workflow = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='transitions')
    from_stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='outgoing_transitions')
    to_stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='incoming_transitions')
    condition_type = models.CharField(max_length=50, choices=[
        ('always', 'Always'),
        ('approval', 'On Approval'),
        ('rejection', 'On Rejection'),
        ('condition', 'Conditional'),
        ('manual', 'Manual'),
    ], default='always')
    condition_data = models.JSONField(default=dict, blank=True)
    priority = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['workflow', 'from_stage', 'priority']
        unique_together = ['workflow', 'from_stage', 'to_stage']
        
    def __str__(self):
        return f"{self.from_stage.name} -> {self.to_stage.name}"


class WorkflowRule(models.Model):
    """Business rules for workflow automation"""
    workflow = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='rules')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    rule_type = models.CharField(max_length=50, choices=[
        ('assignment', 'Auto Assignment'),
        ('escalation', 'Escalation'),
        ('notification', 'Notification'),
        ('validation', 'Validation'),
        ('calculation', 'Calculation'),
    ])
    trigger_stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, null=True, blank=True, related_name='rules')
    trigger_event = models.CharField(max_length=50, choices=[
        ('stage_enter', 'Stage Enter'),
        ('stage_exit', 'Stage Exit'),
        ('time_elapsed', 'Time Elapsed'),
        ('condition_met', 'Condition Met'),
    ])
    condition = models.JSONField(default=dict)
    action = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['workflow', 'priority']
        
    def __str__(self):
        return f"{self.workflow.name} - {self.name}"


class WorkflowInstance(models.Model):
    """Instance of a workflow execution for a transaction"""
    workflow_template = models.ForeignKey(WorkflowTemplate, on_delete=models.PROTECT, related_name='instances')
    transaction = models.ForeignKey('transactions.Transaction', on_delete=models.CASCADE, related_name='workflow_instances')
    current_stage = models.ForeignKey(WorkflowStage, on_delete=models.SET_NULL, null=True, related_name='current_instances')
    status = models.CharField(max_length=50, choices=[
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ], default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='started_workflows')
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='completed_workflows')
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.workflow_template.name} - {self.transaction.transaction_id}"
    
    def start(self, user=None):
        """Start the workflow instance"""
        if self.status != 'pending':
            raise ValueError("Workflow can only be started from pending status")
        
        first_stage = self.workflow_template.stages.filter(stage_type='start').first()
        if not first_stage:
            first_stage = self.workflow_template.stages.order_by('order').first()
        
        self.current_stage = first_stage
        self.status = 'active'
        self.started_at = timezone.now()
        self.started_by = user
        self.save()
        
        # Create stage history
        WorkflowStageHistory.objects.create(
            workflow_instance=self,
            stage=first_stage,
            entered_at=timezone.now(),
            entered_by=user
        )
    
    def transition_to(self, next_stage, user=None, comment=None):
        """Transition to the next stage"""
        if self.status != 'active':
            raise ValueError("Can only transition active workflows")
        
        # Check if transition is allowed
        transition = WorkflowTransition.objects.filter(
            workflow=self.workflow_template,
            from_stage=self.current_stage,
            to_stage=next_stage
        ).first()
        
        if not transition:
            raise ValueError(f"Transition from {self.current_stage} to {next_stage} not allowed")
        
        # Update current stage history
        history = WorkflowStageHistory.objects.filter(
            workflow_instance=self,
            stage=self.current_stage,
            exited_at__isnull=True
        ).first()
        
        if history:
            history.exited_at = timezone.now()
            history.exited_by = user
            history.exit_comment = comment
            history.save()
        
        # Move to next stage
        self.current_stage = next_stage
        
        # Check if workflow is complete
        if next_stage.stage_type == 'end':
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.completed_by = user
        
        self.save()
        
        # Create new stage history
        WorkflowStageHistory.objects.create(
            workflow_instance=self,
            stage=next_stage,
            entered_at=timezone.now(),
            entered_by=user
        )


class WorkflowStageHistory(models.Model):
    """History of stage transitions in a workflow instance"""
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='stage_history')
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE)
    entered_at = models.DateTimeField()
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stage_entries')
    exited_at = models.DateTimeField(null=True, blank=True)
    exited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stage_exits')
    duration_hours = models.FloatField(null=True, blank=True)
    exit_comment = models.TextField(blank=True)
    attachments = models.ManyToManyField('attachments.Attachment', blank=True)
    
    class Meta:
        ordering = ['workflow_instance', 'entered_at']
        
    def save(self, *args, **kwargs):
        if self.exited_at and self.entered_at:
            delta = self.exited_at - self.entered_at
            self.duration_hours = delta.total_seconds() / 3600
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.workflow_instance} - {self.stage.name}"


class WorkflowEscalation(models.Model):
    """Escalation configuration for workflow stages"""
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='escalations')
    escalation_after_hours = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    escalate_to_role = models.CharField(max_length=50, choices=[
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
    ])
    escalate_to_users = models.ManyToManyField(User, blank=True, related_name='escalations')
    notification_template = models.TextField(blank=True)
    max_escalations = models.PositiveIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['stage', 'escalation_after_hours']
        
    def __str__(self):
        return f"{self.stage} - Escalate after {self.escalation_after_hours} hours"