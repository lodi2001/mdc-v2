"""
URL configuration for Workflows app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'workflows'

router = DefaultRouter()
router.register(r'templates', views.WorkflowTemplateViewSet, basename='workflow-template')
router.register(r'stages', views.WorkflowStageViewSet, basename='workflow-stage')
router.register(r'transitions', views.WorkflowTransitionViewSet, basename='workflow-transition')
router.register(r'rules', views.WorkflowRuleViewSet, basename='workflow-rule')
router.register(r'instances', views.WorkflowInstanceViewSet, basename='workflow-instance')
router.register(r'escalations', views.WorkflowEscalationViewSet, basename='workflow-escalation')
router.register(r'builder', views.WorkflowBuilderViewSet, basename='workflow-builder')

urlpatterns = [
    path('', include(router.urls)),
    # Manual escalation trigger
    path('instances/<int:instance_id>/escalations/<int:escalation_id>/trigger/', 
         views.TriggerEscalationView.as_view(), 
         name='trigger-escalation'),
]