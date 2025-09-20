"""
Serializers for Workflow management
"""

from rest_framework import serializers
from .models import (
    WorkflowTemplate, WorkflowStage, WorkflowTransition,
    WorkflowRule, WorkflowInstance, WorkflowStageHistory,
    WorkflowEscalation
)
from users.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class WorkflowStageSerializer(serializers.ModelSerializer):
    """Serializer for workflow stages"""
    assigned_users_detail = UserSerializer(source='assigned_users', many=True, read_only=True)
    
    class Meta:
        model = WorkflowStage
        fields = [
            'id', 'workflow', 'name', 'description', 'order',
            'stage_type', 'assigned_role', 'assigned_users',
            'assigned_users_detail', 'duration_days', 'is_optional',
            'requires_attachment', 'requires_comment', 'auto_complete',
            'auto_complete_conditions'
        ]
        read_only_fields = ['id']


class WorkflowTransitionSerializer(serializers.ModelSerializer):
    """Serializer for workflow transitions"""
    from_stage_detail = WorkflowStageSerializer(source='from_stage', read_only=True)
    to_stage_detail = WorkflowStageSerializer(source='to_stage', read_only=True)
    
    class Meta:
        model = WorkflowTransition
        fields = [
            'id', 'workflow', 'from_stage', 'to_stage',
            'from_stage_detail', 'to_stage_detail',
            'condition_type', 'condition_data', 'priority'
        ]
        read_only_fields = ['id']


class WorkflowRuleSerializer(serializers.ModelSerializer):
    """Serializer for workflow rules"""
    trigger_stage_detail = WorkflowStageSerializer(source='trigger_stage', read_only=True)
    
    class Meta:
        model = WorkflowRule
        fields = [
            'id', 'workflow', 'name', 'description', 'rule_type',
            'trigger_stage', 'trigger_stage_detail', 'trigger_event',
            'condition', 'action', 'is_active', 'priority'
        ]
        read_only_fields = ['id']


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    """Serializer for workflow templates"""
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    stages = WorkflowStageSerializer(many=True, read_only=True)
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)
    rules = WorkflowRuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'description', 'category', 'is_active',
            'allow_parallel_stages', 'auto_assign', 'notification_enabled',
            'created_by', 'created_by_detail', 'created_at', 'updated_at',
            'stages', 'transitions', 'rules'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class WorkflowTemplateListSerializer(serializers.ModelSerializer):
    """List serializer for workflow templates"""
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    stages_count = serializers.IntegerField(source='stages.count', read_only=True)
    instances_count = serializers.IntegerField(source='instances.count', read_only=True)
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'description', 'category', 'is_active',
            'created_by_detail', 'created_at', 'stages_count',
            'instances_count'
        ]
        read_only_fields = ['id', 'created_at']


class WorkflowStageHistorySerializer(serializers.ModelSerializer):
    """Serializer for workflow stage history"""
    stage_detail = WorkflowStageSerializer(source='stage', read_only=True)
    entered_by_detail = UserSerializer(source='entered_by', read_only=True)
    exited_by_detail = UserSerializer(source='exited_by', read_only=True)
    
    class Meta:
        model = WorkflowStageHistory
        fields = [
            'id', 'workflow_instance', 'stage', 'stage_detail',
            'entered_at', 'entered_by', 'entered_by_detail',
            'exited_at', 'exited_by', 'exited_by_detail',
            'duration_hours', 'exit_comment', 'attachments'
        ]
        read_only_fields = ['id', 'duration_hours']


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    """Serializer for workflow instances"""
    workflow_template_detail = WorkflowTemplateSerializer(source='workflow_template', read_only=True)
    current_stage_detail = WorkflowStageSerializer(source='current_stage', read_only=True)
    started_by_detail = UserSerializer(source='started_by', read_only=True)
    completed_by_detail = UserSerializer(source='completed_by', read_only=True)
    stage_history = WorkflowStageHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow_template', 'workflow_template_detail',
            'transaction', 'current_stage', 'current_stage_detail',
            'status', 'started_at', 'completed_at',
            'started_by', 'started_by_detail',
            'completed_by', 'completed_by_detail',
            'data', 'created_at', 'updated_at', 'stage_history'
        ]
        read_only_fields = [
            'id', 'started_at', 'completed_at', 'started_by',
            'completed_by', 'created_at', 'updated_at'
        ]


class WorkflowInstanceListSerializer(serializers.ModelSerializer):
    """List serializer for workflow instances"""
    workflow_template_name = serializers.CharField(source='workflow_template.name', read_only=True)
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    current_stage_name = serializers.CharField(source='current_stage.name', read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow_template_name', 'transaction_id',
            'current_stage_name', 'status', 'started_at',
            'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'created_at']


class WorkflowTransitionRequestSerializer(serializers.Serializer):
    """Serializer for workflow transition requests"""
    next_stage_id = serializers.IntegerField()
    comment = serializers.CharField(required=False, allow_blank=True)
    attachments = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    
    def validate_next_stage_id(self, value):
        """Validate that the stage exists"""
        if not WorkflowStage.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid stage ID")
        return value


class WorkflowEscalationSerializer(serializers.ModelSerializer):
    """Serializer for workflow escalations"""
    stage_detail = WorkflowStageSerializer(source='stage', read_only=True)
    escalate_to_users_detail = UserSerializer(source='escalate_to_users', many=True, read_only=True)
    
    class Meta:
        model = WorkflowEscalation
        fields = [
            'id', 'stage', 'stage_detail', 'escalation_after_hours',
            'escalate_to_role', 'escalate_to_users', 'escalate_to_users_detail',
            'notification_template', 'max_escalations', 'is_active'
        ]
        read_only_fields = ['id']


class WorkflowBuilderSerializer(serializers.Serializer):
    """Serializer for workflow builder - creates complete workflow"""
    template = WorkflowTemplateSerializer()
    stages = serializers.ListField(child=WorkflowStageSerializer())
    transitions = serializers.ListField(child=WorkflowTransitionSerializer(), required=False)
    rules = serializers.ListField(child=WorkflowRuleSerializer(), required=False)
    escalations = serializers.ListField(child=WorkflowEscalationSerializer(), required=False)
    
    def create(self, validated_data):
        """Create complete workflow with all components"""
        template_data = validated_data['template']
        stages_data = validated_data.get('stages', [])
        transitions_data = validated_data.get('transitions', [])
        rules_data = validated_data.get('rules', [])
        escalations_data = validated_data.get('escalations', [])
        
        # Create template
        template_data['created_by'] = self.context['request'].user
        template = WorkflowTemplate.objects.create(**template_data)
        
        # Create stages
        stage_mapping = {}
        for stage_data in stages_data:
            stage_data['workflow'] = template
            assigned_users = stage_data.pop('assigned_users', [])
            stage = WorkflowStage.objects.create(**stage_data)
            stage.assigned_users.set(assigned_users)
            stage_mapping[stage_data.get('order')] = stage
        
        # Create transitions
        for transition_data in transitions_data:
            transition_data['workflow'] = template
            from_order = transition_data.pop('from_stage_order', None)
            to_order = transition_data.pop('to_stage_order', None)
            
            if from_order and to_order:
                transition_data['from_stage'] = stage_mapping.get(from_order)
                transition_data['to_stage'] = stage_mapping.get(to_order)
                
                if transition_data['from_stage'] and transition_data['to_stage']:
                    WorkflowTransition.objects.create(**transition_data)
        
        # Create rules
        for rule_data in rules_data:
            rule_data['workflow'] = template
            trigger_stage_order = rule_data.pop('trigger_stage_order', None)
            
            if trigger_stage_order:
                rule_data['trigger_stage'] = stage_mapping.get(trigger_stage_order)
            
            WorkflowRule.objects.create(**rule_data)
        
        # Create escalations
        for escalation_data in escalations_data:
            stage_order = escalation_data.pop('stage_order', None)
            
            if stage_order:
                escalation_data['stage'] = stage_mapping.get(stage_order)
                escalate_to_users = escalation_data.pop('escalate_to_users', [])
                escalation = WorkflowEscalation.objects.create(**escalation_data)
                escalation.escalate_to_users.set(escalate_to_users)
        
        return template