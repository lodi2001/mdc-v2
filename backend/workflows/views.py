"""
Views for Workflow management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import (
    WorkflowTemplate, WorkflowStage, WorkflowTransition,
    WorkflowRule, WorkflowInstance, WorkflowStageHistory,
    WorkflowEscalation
)
from .serializers import (
    WorkflowTemplateSerializer, WorkflowTemplateListSerializer,
    WorkflowStageSerializer, WorkflowTransitionSerializer,
    WorkflowRuleSerializer, WorkflowInstanceSerializer,
    WorkflowInstanceListSerializer, WorkflowStageHistorySerializer,
    WorkflowEscalationSerializer, WorkflowBuilderSerializer,
    WorkflowTransitionRequestSerializer
)
from transactions.models import Transaction
from core.permissions import IsAdminUser, IsActiveUser
from audit.models import AuditLog


class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow templates
    """
    queryset = WorkflowTemplate.objects.all()
    serializer_class = WorkflowTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = WorkflowTemplate.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Add counts
        queryset = queryset.annotate(
            stages_count=Count('stages'),
            instances_count=Count('instances')
        )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkflowTemplateListSerializer
        return WorkflowTemplateSerializer
    
    @extend_schema(
        summary="Clone a workflow template",
        description="Create a copy of an existing workflow template with all its components"
    )
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """Clone a workflow template"""
        template = self.get_object()
        
        # Clone template
        new_template = WorkflowTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            category=template.category,
            is_active=False,  # Start as inactive
            allow_parallel_stages=template.allow_parallel_stages,
            auto_assign=template.auto_assign,
            notification_enabled=template.notification_enabled,
            created_by=request.user
        )
        
        # Clone stages
        stage_mapping = {}
        for stage in template.stages.all():
            new_stage = WorkflowStage.objects.create(
                workflow=new_template,
                name=stage.name,
                description=stage.description,
                order=stage.order,
                stage_type=stage.stage_type,
                assigned_role=stage.assigned_role,
                duration_days=stage.duration_days,
                is_optional=stage.is_optional,
                requires_attachment=stage.requires_attachment,
                requires_comment=stage.requires_comment,
                auto_complete=stage.auto_complete,
                auto_complete_conditions=stage.auto_complete_conditions
            )
            new_stage.assigned_users.set(stage.assigned_users.all())
            stage_mapping[stage.id] = new_stage
        
        # Clone transitions
        for transition in template.transitions.all():
            WorkflowTransition.objects.create(
                workflow=new_template,
                from_stage=stage_mapping[transition.from_stage.id],
                to_stage=stage_mapping[transition.to_stage.id],
                condition_type=transition.condition_type,
                condition_data=transition.condition_data,
                priority=transition.priority
            )
        
        # Clone rules
        for rule in template.rules.all():
            trigger_stage = None
            if rule.trigger_stage:
                trigger_stage = stage_mapping.get(rule.trigger_stage.id)
            
            WorkflowRule.objects.create(
                workflow=new_template,
                name=rule.name,
                description=rule.description,
                rule_type=rule.rule_type,
                trigger_stage=trigger_stage,
                trigger_event=rule.trigger_event,
                condition=rule.condition,
                action=rule.action,
                is_active=rule.is_active,
                priority=rule.priority
            )
        
        # Log the action
        AuditLog.objects.create(
            user=request.user,
            action='workflow_cloned',
            model_name='WorkflowTemplate',
            object_id=str(new_template.id),
            message=f"Cloned workflow template: {template.name}"
        )
        
        serializer = WorkflowTemplateSerializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Get workflow statistics",
        description="Get usage statistics for a workflow template"
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get workflow statistics"""
        template = self.get_object()
        
        instances = template.instances.all()
        completed_instances = instances.filter(status='completed')
        
        # Calculate average completion time
        avg_completion_time = None
        if completed_instances.exists():
            completion_times = []
            for instance in completed_instances:
                if instance.started_at and instance.completed_at:
                    delta = instance.completed_at - instance.started_at
                    completion_times.append(delta.total_seconds() / 3600)  # in hours
            
            if completion_times:
                avg_completion_time = sum(completion_times) / len(completion_times)
        
        # Stage statistics
        stage_stats = []
        for stage in template.stages.all():
            histories = WorkflowStageHistory.objects.filter(stage=stage)
            avg_duration = histories.aggregate(Avg('duration_hours'))['duration_hours__avg']
            
            stage_stats.append({
                'stage_name': stage.name,
                'total_entries': histories.count(),
                'average_duration_hours': avg_duration,
                'current_instances': stage.current_instances.count()
            })
        
        stats = {
            'total_instances': instances.count(),
            'active_instances': instances.filter(status='active').count(),
            'completed_instances': completed_instances.count(),
            'cancelled_instances': instances.filter(status='cancelled').count(),
            'average_completion_hours': avg_completion_time,
            'stage_statistics': stage_stats,
            'most_used_path': self._get_most_used_path(template)
        }
        
        return Response(stats)
    
    def _get_most_used_path(self, template):
        """Get the most commonly used path through the workflow"""
        # This is a simplified version - could be made more sophisticated
        transitions = []
        for instance in template.instances.filter(status='completed')[:100]:
            history = instance.stage_history.order_by('entered_at')
            path = [h.stage.name for h in history]
            transitions.append(' -> '.join(path))
        
        if transitions:
            from collections import Counter
            most_common = Counter(transitions).most_common(1)
            if most_common:
                return most_common[0][0]
        
        return None


class WorkflowStageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow stages
    """
    queryset = WorkflowStage.objects.all()
    serializer_class = WorkflowStageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['workflow', 'stage_type', 'assigned_role']
    ordering_fields = ['order', 'name']
    ordering = ['workflow', 'order']


class WorkflowTransitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow transitions
    """
    queryset = WorkflowTransition.objects.all()
    serializer_class = WorkflowTransitionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['workflow', 'condition_type']
    ordering = ['workflow', 'from_stage', 'priority']


class WorkflowRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow rules
    """
    queryset = WorkflowRule.objects.all()
    serializer_class = WorkflowRuleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['workflow', 'rule_type', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['workflow', 'priority']


class WorkflowInstanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow instances
    """
    permission_classes = [IsAuthenticated, IsActiveUser]
    filterset_fields = ['workflow_template', 'transaction', 'status']
    search_fields = ['transaction__transaction_id', 'transaction__title']
    ordering_fields = ['created_at', 'started_at', 'completed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = WorkflowInstance.objects.all()
        
        # Filter based on user role
        if not user.is_admin():
            if user.is_editor():
                # Editors can see workflows they're involved in
                queryset = queryset.filter(
                    Q(started_by=user) |
                    Q(workflow_template__stages__assigned_users=user)
                ).distinct()
            else:
                # Clients can only see their transaction workflows
                queryset = queryset.filter(transaction__created_by=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset.select_related(
            'workflow_template', 'transaction', 'current_stage',
            'started_by', 'completed_by'
        ).prefetch_related('stage_history')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkflowInstanceListSerializer
        return WorkflowInstanceSerializer
    
    @extend_schema(
        summary="Start a workflow instance",
        description="Start a pending workflow instance"
    )
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a workflow instance"""
        instance = self.get_object()
        
        if instance.status != 'pending':
            return Response(
                {'error': 'Workflow can only be started from pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instance.start(user=request.user)
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action='workflow_started',
                model_name='WorkflowInstance',
                object_id=str(instance.id),
                message=f"Started workflow: {instance.workflow_template.name} for transaction {instance.transaction.transaction_id}"
            )
            
            serializer = WorkflowInstanceSerializer(instance)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Transition to next stage",
        description="Move workflow to the next stage",
        request=WorkflowTransitionRequestSerializer
    )
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        """Transition to next stage"""
        instance = self.get_object()
        serializer = WorkflowTransitionRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        next_stage_id = serializer.validated_data['next_stage_id']
        comment = serializer.validated_data.get('comment', '')
        
        try:
            next_stage = WorkflowStage.objects.get(id=next_stage_id)
            instance.transition_to(next_stage, user=request.user, comment=comment)
            
            # Handle attachments if provided
            attachment_ids = serializer.validated_data.get('attachments', [])
            if attachment_ids:
                history = instance.stage_history.filter(
                    stage=next_stage,
                    exited_at__isnull=True
                ).first()
                if history:
                    history.attachments.add(*attachment_ids)
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action='workflow_transitioned',
                model_name='WorkflowInstance',
                object_id=str(instance.id),
                message=f"Transitioned workflow to stage: {next_stage.name}"
            )
            
            serializer = WorkflowInstanceSerializer(instance)
            return Response(serializer.data)
        except WorkflowStage.DoesNotExist:
            return Response(
                {'error': 'Invalid stage ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Pause workflow",
        description="Pause an active workflow instance"
    )
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause workflow"""
        instance = self.get_object()
        
        if instance.status != 'active':
            return Response(
                {'error': 'Only active workflows can be paused'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.status = 'paused'
        instance.save()
        
        # Log the action
        AuditLog.objects.create(
            user=request.user,
            action='workflow_paused',
            model_name='WorkflowInstance',
            object_id=str(instance.id),
            message=f"Paused workflow for transaction {instance.transaction.transaction_id}"
        )
        
        serializer = WorkflowInstanceSerializer(instance)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Resume workflow",
        description="Resume a paused workflow instance"
    )
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume workflow"""
        instance = self.get_object()
        
        if instance.status != 'paused':
            return Response(
                {'error': 'Only paused workflows can be resumed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.status = 'active'
        instance.save()
        
        # Log the action
        AuditLog.objects.create(
            user=request.user,
            action='workflow_resumed',
            model_name='WorkflowInstance',
            object_id=str(instance.id),
            message=f"Resumed workflow for transaction {instance.transaction.transaction_id}"
        )
        
        serializer = WorkflowInstanceSerializer(instance)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Cancel workflow",
        description="Cancel a workflow instance"
    )
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel workflow"""
        instance = self.get_object()
        
        if instance.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'Workflow is already completed or cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.status = 'cancelled'
        instance.completed_at = timezone.now()
        instance.completed_by = request.user
        instance.save()
        
        # Log the action
        AuditLog.objects.create(
            user=request.user,
            action='workflow_cancelled',
            model_name='WorkflowInstance',
            object_id=str(instance.id),
            message=f"Cancelled workflow for transaction {instance.transaction.transaction_id}"
        )
        
        serializer = WorkflowInstanceSerializer(instance)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get available transitions",
        description="Get available transitions from current stage"
    )
    @action(detail=True, methods=['get'])
    def available_transitions(self, request, pk=None):
        """Get available transitions"""
        instance = self.get_object()
        
        if not instance.current_stage:
            return Response({'transitions': []})
        
        transitions = WorkflowTransition.objects.filter(
            workflow=instance.workflow_template,
            from_stage=instance.current_stage
        ).order_by('priority')
        
        serializer = WorkflowTransitionSerializer(transitions, many=True)
        return Response({'transitions': serializer.data})


class WorkflowEscalationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing workflow escalations
    """
    queryset = WorkflowEscalation.objects.all()
    serializer_class = WorkflowEscalationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['stage', 'escalate_to_role', 'is_active']
    ordering = ['stage', 'escalation_after_hours']


class WorkflowBuilderViewSet(viewsets.GenericViewSet):
    """
    ViewSet for workflow builder - creates complete workflows
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = WorkflowBuilderSerializer
    
    @extend_schema(
        summary="Create complete workflow",
        description="Create a workflow template with all its components in one request"
    )
    def create(self, request):
        """Create complete workflow"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            template = serializer.save()
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action='workflow_created',
                model_name='WorkflowTemplate',
                object_id=str(template.id),
                message=f"Created workflow template: {template.name}"
            )
            
            # Return the created template
            template_serializer = WorkflowTemplateSerializer(template)
            return Response(
                template_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Get workflow templates",
        description="Get list of available workflow templates for selection"
    )
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get available workflow templates"""
        templates = WorkflowTemplate.objects.filter(is_active=True)
        serializer = WorkflowTemplateListSerializer(templates, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Validate workflow",
        description="Validate a workflow configuration without saving"
    )
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate workflow configuration"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Additional validation logic
            errors = []
            
            # Check for start and end stages
            stages = request.data.get('stages', [])
            has_start = any(s.get('stage_type') == 'start' for s in stages)
            has_end = any(s.get('stage_type') == 'end' for s in stages)
            
            if not has_start:
                errors.append("Workflow must have at least one start stage")
            if not has_end:
                errors.append("Workflow must have at least one end stage")
            
            # Check for orphaned stages
            if len(stages) > 1:
                transitions = request.data.get('transitions', [])
                for stage in stages:
                    stage_order = stage.get('order')
                    has_incoming = any(
                        t.get('to_stage_order') == stage_order
                        for t in transitions
                    )
                    has_outgoing = any(
                        t.get('from_stage_order') == stage_order
                        for t in transitions
                    )
                    
                    if stage.get('stage_type') != 'start' and not has_incoming:
                        errors.append(f"Stage {stage.get('name')} has no incoming transitions")
                    if stage.get('stage_type') != 'end' and not has_outgoing:
                        errors.append(f"Stage {stage.get('name')} has no outgoing transitions")
            
            if errors:
                return Response(
                    {'valid': False, 'errors': errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({'valid': True, 'message': 'Workflow configuration is valid'})
        
        return Response(
            {'valid': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @extend_schema(
        summary="Process escalations",
        description="Manually trigger escalation processing for all active workflows"
    )
    @action(detail=False, methods=['post'])
    def process_escalations(self, request):
        """Process escalations for all active workflows"""
        from .tasks import process_workflow_escalations_sync
        
        try:
            processed_count = process_workflow_escalations_sync()
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action='escalations_processed',
                model_name='WorkflowInstance',
                object_id=None,
                message=f"Manually triggered escalation processing, {processed_count} escalations processed"
            )
            
            return Response({
                'success': True,
                'processed_count': processed_count,
                'message': f'Processed {processed_count} escalations'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process escalations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Get escalation status",
        description="Get escalation status for all active workflows"
    )
    @action(detail=False, methods=['get'])
    def escalation_status(self, request):
        """Get escalation status for active workflows"""
        from datetime import timedelta
        
        # Get all active workflow instances with current stage
        active_instances = WorkflowInstance.objects.filter(
            status='active',
            current_stage__isnull=False
        ).select_related(
            'current_stage', 'workflow_template', 'transaction'
        ).prefetch_related(
            'current_stage__escalations'
        )
        
        escalation_data = []
        
        for instance in active_instances:
            # Get current stage history
            current_history = WorkflowStageHistory.objects.filter(
                workflow_instance=instance,
                stage=instance.current_stage,
                exited_at__isnull=True
            ).first()
            
            if current_history:
                time_in_stage = timezone.now() - current_history.entered_at
                
                # Check escalations for this stage
                for escalation in instance.current_stage.escalations.filter(is_active=True):
                    escalation_due_time = current_history.entered_at + timedelta(
                        hours=escalation.escalation_after_hours
                    )
                    
                    # Get escalation count from audit logs
                    escalation_count = AuditLog.objects.filter(
                        object_type='WorkflowEscalation',
                        object_id=escalation.id,
                        action='escalation_triggered',
                        details__workflow_instance_id=instance.id
                    ).count()
                    
                    escalation_data.append({
                        'workflow_instance_id': instance.id,
                        'transaction_id': instance.transaction.transaction_id,
                        'workflow_name': instance.workflow_template.name,
                        'current_stage': instance.current_stage.name,
                        'time_in_stage_hours': time_in_stage.total_seconds() / 3600,
                        'escalation_id': escalation.id,
                        'escalation_after_hours': escalation.escalation_after_hours,
                        'is_overdue': timezone.now() >= escalation_due_time,
                        'escalation_count': escalation_count,
                        'max_escalations': escalation.max_escalations,
                        'escalate_to_role': escalation.escalate_to_role,
                        'can_escalate': escalation_count < escalation.max_escalations
                    })
        
        # Sort by most overdue first
        escalation_data.sort(key=lambda x: x['time_in_stage_hours'], reverse=True)
        
        return Response({
            'escalation_status': escalation_data,
            'total_active_workflows': active_instances.count(),
            'overdue_escalations': len([e for e in escalation_data if e['is_overdue']]),
            'summary': {
                'total_escalations_configured': len(escalation_data),
                'overdue_count': len([e for e in escalation_data if e['is_overdue']]),
                'can_escalate_count': len([e for e in escalation_data if e['can_escalate']]),
            }
        })


# Additional API views for escalation notifications


@extend_schema(
    summary="Trigger escalation",
    description="Manually trigger a specific escalation for a workflow instance"
)
class TriggerEscalationView(APIView):
    """
    API view to manually trigger escalations
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, instance_id, escalation_id):
        """
        Trigger a specific escalation for a workflow instance
        """
        try:
            # Get the workflow instance
            instance = get_object_or_404(WorkflowInstance, id=instance_id)
            
            # Get the escalation
            escalation = get_object_or_404(WorkflowEscalation, id=escalation_id)
            
            # Verify escalation belongs to current stage
            if escalation.stage != instance.current_stage:
                return Response(
                    {'error': 'Escalation does not belong to current workflow stage'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get current stage history
            current_history = WorkflowStageHistory.objects.filter(
                workflow_instance=instance,
                stage=instance.current_stage,
                exited_at__isnull=True
            ).first()
            
            if not current_history:
                return Response(
                    {'error': 'No active stage history found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Import and execute escalation
            from .tasks import execute_escalation
            
            success = execute_escalation(instance, escalation, current_history)
            
            if success:
                # Log the manual trigger
                AuditLog.objects.create(
                    user=request.user,
                    action='manual_escalation_triggered',
                    object_type='WorkflowEscalation',
                    object_id=escalation.id,
                    details={
                        'workflow_instance_id': instance.id,
                        'transaction_id': instance.transaction.id,
                        'triggered_manually': True
                    }
                )
                
                return Response({
                    'success': True,
                    'message': f'Escalation triggered successfully for {instance.workflow_template.name}'
                })
            else:
                return Response(
                    {'error': 'Failed to trigger escalation'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error triggering escalation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )