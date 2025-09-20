/**
 * Assignment service for managing task assignments
 */

import { api } from './api/client';
import type {
  Assignment,
  AssignmentFilter,
  AssignmentStats,
  BulkAction,
  WorkloadDistribution,
  AssignmentHistory,
  AssignmentResponse,
  AssignmentMetrics,
  AssignedUser
} from '../types/assignment';

class AssignmentService {
  private baseUrl = '/transactions';

  /**
   * Get assignments with filters
   */
  async getAssignments(filter?: AssignmentFilter, page: number = 1, pageSize: number = 25): Promise<AssignmentResponse> {
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    // Add filters
    if (filter) {
      if (filter.search) params.append('search', filter.search);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.status) params.append('status', filter.status);
      if (filter.assignedTo) params.append('assigned_to', filter.assignedTo.toString());
      
      // Handle due date filter
      if (filter.dueDate) {
        const today = new Date();
        let startDate: Date;
        let endDate: Date;
        
        switch (filter.dueDate) {
          case 'overdue':
            endDate = new Date(today.setDate(today.getDate() - 1));
            params.append('due_date__lt', this.formatDate(endDate));
            break;
          case 'today':
            params.append('due_date', this.formatDate(today));
            break;
          case 'week':
            endDate = new Date(today.setDate(today.getDate() + 7));
            params.append('due_date__lte', this.formatDate(endDate));
            break;
          case 'month':
            endDate = new Date(today.setMonth(today.getMonth() + 1));
            params.append('due_date__lte', this.formatDate(endDate));
            break;
        }
      }
      
      // Handle date range
      if (filter.dateRange) {
        params.append('created_at__gte', this.formatDate(filter.dateRange.start));
        params.append('created_at__lte', this.formatDate(filter.dateRange.end));
      }
    }
    
    // Only show assigned transactions
    params.append('assigned_to__isnull', 'false');
    
    const response = await api.get(`${this.baseUrl}/?${params.toString()}`);
    
    // Transform backend data to frontend format
    return this.transformAssignmentResponse(response.data);
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(): Promise<AssignmentStats> {
    try {
      // Get all assigned transactions for stats
      const response = await api.get(`${this.baseUrl}/?assigned_to__isnull=false&page_size=1000`);
      const data = response.data.data || response.data.results || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats: AssignmentStats = {
        totalAssigned: data.length,
        urgent: 0,
        pendingReview: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
        averageCompletionTime: 0
      };
      
      let totalCompletionTime = 0;
      let completedCount = 0;
      
      data.forEach((item: any) => {
        // Count by priority
        if (item.priority === 'urgent') stats.urgent++;
        
        // Count by status
        if (item.status === 'pending' || item.status === 'review') stats.pendingReview++;
        if (item.status === 'in_progress') stats.inProgress++;
        if (item.status === 'completed') {
          stats.completed++;
          completedCount++;
          
          // Calculate completion time
          if (item.created_at && item.updated_at) {
            const created = new Date(item.created_at);
            const updated = new Date(item.updated_at);
            totalCompletionTime += (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
          }
        }
        
        // Check due dates
        if (item.due_date) {
          const dueDate = new Date(item.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today && item.status !== 'completed') {
            stats.overdue++;
          } else if (dueDate.getTime() === today.getTime()) {
            stats.dueToday++;
          }
        }
      });
      
      // Calculate average completion time
      if (completedCount > 0) {
        stats.averageCompletionTime = Math.round(totalCompletionTime / completedCount * 10) / 10;
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      // Return default stats on error
      return {
        totalAssigned: 0,
        urgent: 0,
        pendingReview: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
        averageCompletionTime: 0
      };
    }
  }

  /**
   * Assign a transaction to a user
   */
  async assignTransaction(transactionId: string, userId: number, comment?: string): Promise<void> {
    await api.post(`${this.baseUrl}/${transactionId}/assign/`, {
      user_id: userId,
      comment
    });
  }

  /**
   * Reassign a transaction to a different user
   */
  async reassignTransaction(transactionId: number | string, userId: string, reason?: string): Promise<void> {
    await api.post(`${this.baseUrl}/${transactionId}/assign/`, {
      assigned_to: parseInt(userId),
      reason
    });
  }

  /**
   * Bulk reassign multiple transactions
   */
  async bulkReassignTransactions(transactionIds: number[], userId: string, reason?: string): Promise<void> {
    await api.post(`${this.baseUrl}/bulk-operations/`, {
      operation: 'assign',
      transaction_ids: transactionIds,
      assigned_to: parseInt(userId),
      reason
    });
  }

  /**
   * Perform bulk actions on assignments
   */
  async performBulkAction(action: BulkAction): Promise<void> {
    const operations = action.transactionIds.map(id => {
      switch (action.action) {
        case 'assign':
          return {
            transaction_id: id,
            operation: 'assign',
            data: {
              user_id: action.data.assignedTo,
              comment: action.data.comment
            }
          };
        case 'status':
          return {
            transaction_id: id,
            operation: 'update_status',
            data: {
              status: action.data.status,
              comment: action.data.comment
            }
          };
        case 'priority':
          return {
            transaction_id: id,
            operation: 'update_priority',
            data: {
              priority: action.data.priority
            }
          };
        default:
          return null;
      }
    }).filter(Boolean);
    
    await api.post(`${this.baseUrl}/bulk-operations/`, {
      operations
    });
  }

  /**
   * Get workload distribution for all editors
   */
  async getWorkloadDistribution(): Promise<WorkloadDistribution[]> {
    try {
      // Get all users with editor role
      const usersResponse = await api.get('/users/?role=editor');
      const users = usersResponse.data.data || usersResponse.data.results || [];
      
      // Get all assigned transactions
      const transactionsResponse = await api.get(`${this.baseUrl}/?assigned_to__isnull=false&page_size=1000`);
      const transactions = transactionsResponse.data.data || transactionsResponse.data.results || [];
      
      // Calculate workload for each editor
      const workload: WorkloadDistribution[] = users.map((user: any) => {
        const userTasks = transactions.filter((t: any) => t.assigned_to === user.id);
        
        const distribution: WorkloadDistribution = {
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`.trim() || user.username,
          totalTasks: userTasks.length,
          urgent: userTasks.filter((t: any) => t.priority === 'urgent').length,
          high: userTasks.filter((t: any) => t.priority === 'high').length,
          medium: userTasks.filter((t: any) => t.priority === 'medium').length,
          low: userTasks.filter((t: any) => t.priority === 'low').length,
          completed: userTasks.filter((t: any) => t.status === 'completed').length,
          inProgress: userTasks.filter((t: any) => t.status === 'in_progress').length,
          overdue: userTasks.filter((t: any) => {
            if (!t.due_date || t.status === 'completed') return false;
            return new Date(t.due_date) < new Date();
          }).length,
          averageTime: 0,
          efficiency: 0
        };
        
        // Calculate average completion time and efficiency
        const completedTasks = userTasks.filter((t: any) => t.status === 'completed');
        if (completedTasks.length > 0) {
          let totalTime = 0;
          completedTasks.forEach((t: any) => {
            if (t.created_at && t.updated_at) {
              const created = new Date(t.created_at);
              const updated = new Date(t.updated_at);
              totalTime += (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }
          });
          distribution.averageTime = Math.round(totalTime / completedTasks.length * 10) / 10;
          distribution.efficiency = Math.round((completedTasks.length / userTasks.length) * 100);
        }
        
        return distribution;
      });
      
      // Sort by total tasks (descending)
      return workload.sort((a, b) => b.totalTasks - a.totalTasks);
    } catch (error) {
      console.error('Error fetching workload distribution:', error);
      return [];
    }
  }

  /**
   * Get assignment history for a transaction
   */
  async getAssignmentHistory(transactionId: string): Promise<AssignmentHistory[]> {
    const response = await api.get(`${this.baseUrl}/${transactionId}/history/`);
    return response.data.data || response.data;
  }

  /**
   * Get available users for assignment (editors and admins only)
   */
  async getAvailableAssignees(): Promise<AssignedUser[]> {
    try {
      // Fetch both editors and admins, excluding clients
      const response = await api.get('/users/?role__in=editor,admin&is_active=true');
      const users = response.data.data || response.data.results || [];
      
      return users.map((user: any) => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        avatar: user.avatar
      }));
    } catch (error) {
      console.error('Failed to fetch available assignees:', error);
      return [];
    }
  }

  /**
   * Get available editors for assignment (backward compatibility)
   * @deprecated Use getAvailableAssignees() instead
   */
  async getAvailableEditors(): Promise<AssignedUser[]> {
    return this.getAvailableAssignees();
  }

  /**
   * Export assignments data
   */
  async exportAssignments(format: 'pdf' | 'excel' | 'csv', filter?: AssignmentFilter): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    // Add filters
    if (filter) {
      if (filter.search) params.append('search', filter.search);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.status) params.append('status', filter.status);
      if (filter.assignedTo) params.append('assigned_to', filter.assignedTo.toString());
    }
    
    params.append('assigned_to__isnull', 'false');
    
    const response = await api.get(`${this.baseUrl}/export/?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Get assignment metrics
   */
  async getAssignmentMetrics(): Promise<AssignmentMetrics> {
    try {
      const response = await api.get(`${this.baseUrl}/metrics/?assigned_to__isnull=false`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Return default metrics
      return {
        completionRate: 0,
        averageResponseTime: 0,
        overdueRate: 0,
        reassignmentRate: 0,
        clientSatisfaction: undefined
      };
    }
  }

  // Helper methods

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  private transformAssignmentResponse(data: any): AssignmentResponse {
    const results = data.results || data.data || [];
    const totalCount = data.count || results.length;
    const page = data.page || 1;
    const pageSize = data.page_size || 25;

    const assignments: Assignment[] = results.map((item: any) => ({
      id: String(item.id), // Use the actual database ID as string
      externalId: item.transaction_id || item.external_id || `EXT-${item.id}`,
      clientName: item.client_name || item.created_by_name || 'Unknown Client',
      clientId: item.client?.id || item.client_id || item.created_by,
      type: item.transaction_type || item.type || 'Document Review',
      description: item.description || '',
      status: item.status || 'pending',
      priority: item.priority || 'medium',
      assignedTo: item.assigned_to ? {
        // Handle both nested object and flat fields
        id: typeof item.assigned_to === 'object' ? item.assigned_to.id : item.assigned_to,
        username: typeof item.assigned_to === 'object' ? (item.assigned_to.username || '') : (item.assigned_to_username || ''),
        firstName: typeof item.assigned_to === 'object' ? (item.assigned_to.first_name || '') : (item.assigned_to_first_name || ''),
        lastName: typeof item.assigned_to === 'object' ? (item.assigned_to.last_name || '') : (item.assigned_to_last_name || ''),
        email: typeof item.assigned_to === 'object' ? (item.assigned_to.email || '') : (item.assigned_to_email || ''),
        role: typeof item.assigned_to === 'object' ? item.assigned_to.role : undefined,
        fullName: typeof item.assigned_to === 'object' ? item.assigned_to.full_name : undefined
      } : undefined,
      assignedDate: item.assigned_at || item.created_at,
      dueDate: item.due_date || '',
      progress: this.calculateProgress(item.status),
      commentsCount: item.comment_count || item.comments_count || 0,
      attachmentsCount: item.attachment_count || item.attachments_count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      completedAt: item.completed_at,
      tags: item.tags || []
    }));
    
    return {
      data: assignments,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  private calculateProgress(status: string): number {
    switch (status) {
      case 'pending': return 0;
      case 'in_progress': return 50;
      case 'review': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  }

}

export default new AssignmentService();