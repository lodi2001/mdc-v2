"""
URL configuration for Dashboard app
"""

from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard stats endpoint
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Role-specific dashboards
    path('admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('editor/', views.EditorDashboardView.as_view(), name='editor-dashboard'),
    path('client/', views.ClientDashboardView.as_view(), name='client-dashboard'),
    
    # Activity and metrics
    path('activity/', views.RecentActivityView.as_view(), name='recent-activity'),
    path('performance/', views.PerformanceMetricsView.as_view(), name='performance-metrics'),
]