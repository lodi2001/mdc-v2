"""
URL configuration for Transactions app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSet
router = DefaultRouter()
router.register(r'', views.TransactionViewSet, basename='transaction')

app_name = 'transactions'

urlpatterns = [
    # Recent transactions endpoint (must come before router URLs)
    path('recent/', 
         views.RecentTransactionsView.as_view(), 
         name='recent-transactions'),
    
    # Include router URLs
    path('', include(router.urls)),
    
    # Transaction status management
    path('<int:transaction_id>/status/', 
         views.UpdateTransactionStatusView.as_view(), 
         name='update-transaction-status'),
    
    # Transaction assignment
    path('<int:transaction_id>/assign/', 
         views.AssignTransactionView.as_view(), 
         name='assign-transaction'),
    
    # Transaction comments
    path('<int:transaction_id>/comments/', 
         views.TransactionCommentsView.as_view(), 
         name='transaction-comments'),
    
    # Bulk operations
    path('bulk-operations/', 
         views.BulkTransactionOperationsView.as_view(), 
         name='bulk-operations'),
]