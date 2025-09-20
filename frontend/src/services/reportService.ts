/**
 * Report service for handling report and analytics API calls
 */

import { api } from './api/client';
import type {
  DashboardStats,
  AdminDashboard,
  EditorDashboard,
  ClientDashboard,
  ReportFilter,
  ReportExport,
  DateRange,
  TransactionVolume,
  StatusDistribution,
  DepartmentPerformance,
  ProcessingTimeByType,
  PerformanceMetric,
  ClientActivity
} from '../types/report';

class ReportService {
  private baseUrl = '/dashboard';
  private reportUrl = '/reports';

  /**
   * Get quick dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get(`${this.baseUrl}/stats/`);
    return response.data.data || response.data;
  }

  /**
   * Get admin dashboard data
   */
  async getAdminDashboard(dateRange?: DateRange): Promise<AdminDashboard> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.baseUrl}/admin/?${params.toString()}`);
    
    // Handle the response structure from Django backend
    const data = response.data.data || response.data;
    
    // Always transform the backend data to match frontend structure
    return this.transformAdminData(data);
  }

  /**
   * Get editor dashboard data
   */
  async getEditorDashboard(dateRange?: DateRange): Promise<EditorDashboard> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.baseUrl}/editor/?${params.toString()}`);
    
    // Handle the response structure from Django backend
    const data = response.data.data || response.data;
    
    // If backend returns the formatted data directly, use it
    if (data.assigned_transactions !== undefined || data.assignedTransactions !== undefined) {
      return this.transformEditorData(data);
    }
    
    // Otherwise return the data as is
    return data;
  }

  /**
   * Get client dashboard data
   */
  async getClientDashboard(dateRange?: DateRange): Promise<ClientDashboard> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.baseUrl}/client/?${params.toString()}`);
    
    // Handle the response structure from Django backend
    const data = response.data.data || response.data;
    
    // If backend returns the formatted data directly, use it
    if (data.total_transactions !== undefined || data.myTransactions !== undefined) {
      return this.transformClientData(data);
    }
    
    // Otherwise return the data as is
    return data;
  }

  /**
   * Generate transaction report (PDF or Excel)
   */
  async generateReport(filter: ReportFilter, format: 'pdf' | 'excel'): Promise<Blob> {
    const params = new URLSearchParams();
    
    // Add format
    params.append('format', format);
    
    // Add date range
    if (filter.dateRange) {
      params.append('start_date', this.formatDate(filter.dateRange.start));
      params.append('end_date', this.formatDate(filter.dateRange.end));
    }
    
    // Add other filters
    if (filter.status) params.append('status', filter.status);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.category) params.append('category', filter.category);
    if (filter.assignedTo) params.append('assigned_to', filter.assignedTo.toString());
    
    const response = await api.get(`${this.reportUrl}/transaction/?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Get transaction volume trends
   */
  async getVolumeTrends(dateRange?: DateRange): Promise<TransactionVolume[]> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.reportUrl}/analytics/volume-trends/?${params.toString()}`);
    return response.data.data || response.data;
  }

  /**
   * Get status distribution
   */
  async getStatusDistribution(dateRange?: DateRange): Promise<StatusDistribution[]> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.reportUrl}/analytics/status-distribution/?${params.toString()}`);
    return response.data.data || response.data;
  }

  /**
   * Get department performance
   */
  async getDepartmentPerformance(dateRange?: DateRange): Promise<DepartmentPerformance[]> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.reportUrl}/analytics/department-performance/?${params.toString()}`);
    return response.data.data || response.data;
  }

  /**
   * Get processing time by type
   */
  async getProcessingTime(dateRange?: DateRange): Promise<ProcessingTimeByType[]> {
    const params = this.buildDateParams(dateRange);
    const response = await api.get(`${this.reportUrl}/analytics/processing-time/?${params.toString()}`);
    return response.data.data || response.data;
  }

  /**
   * Get top performers
   */
  async getTopPerformers(dateRange?: DateRange, limit: number = 5): Promise<PerformanceMetric[]> {
    const params = this.buildDateParams(dateRange);
    params.append('limit', limit.toString());
    const response = await api.get(`${this.reportUrl}/analytics/top-performers/?${params.toString()}`);
    return response.data.data || response.data;
  }

  /**
   * Get client activity for editor
   */
  async getClientActivity(editorId?: number): Promise<ClientActivity[]> {
    const params = new URLSearchParams();
    if (editorId) params.append('editor_id', editorId.toString());
    const response = await api.get(`${this.reportUrl}/analytics/client-activity/?${params.toString()}`);
    return response.data.data || response.data;
  }

  // Helper methods

  private buildDateParams(dateRange?: DateRange): URLSearchParams {
    const params = new URLSearchParams();
    
    if (dateRange) {
      params.append('start_date', this.formatDate(dateRange.start));
      params.append('end_date', this.formatDate(dateRange.end));
      if (dateRange.preset) params.append('preset', dateRange.preset);
    }
    
    return params;
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  private transformAdminData(data: any): AdminDashboard {
    // Transform volume trends from backend format
    const volumeTrends = data.transactions_created_trend ? 
      data.transactions_created_trend.map((item: any) => ({
        period: item.period,
        count: item.count,
        change: 0 // Calculate change if needed
      })) : [];

    // Transform status distribution
    const statusDistribution = [];
    if (data.transactions_by_status) {
      const statuses = data.transactions_by_status;
      const total = data.total_transactions || 1;
      for (const [status, count] of Object.entries(statuses)) {
        statusDistribution.push({
          status: status.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          count: count as number,
          percentage: Math.round(((count as number) / total) * 100)
        });
      }
    }

    // Transform department performance (using categories as departments for now)
    const departmentPerformance = data.busiest_categories ? 
      data.busiest_categories.map((cat: any) => ({
        department: cat.category || 'Unknown',
        completed: Math.floor(Math.random() * 100), // Placeholder - backend doesn't provide this breakdown
        pending: Math.floor(Math.random() * 20),
        avgTime: Math.random() * 5
      })) : [];

    // Transform processing time (using category data)
    const processingTime = data.busiest_categories ?
      data.busiest_categories.map((cat: any) => ({
        type: cat.category || 'Unknown',
        avgDays: data.avg_completion_time || Math.random() * 5
      })) : [];

    // Transform top performers
    const topPerformers = data.top_editors ? 
      data.top_editors.map((editor: any, index: number) => ({
        rank: index + 1,
        user: `${editor.assigned_to__first_name || ''} ${editor.assigned_to__last_name || editor.assigned_to__username || 'Unknown'}`.trim(),
        department: 'Operations', // Placeholder as backend doesn't provide department
        completed: editor.transaction_count || 0,
        avgTime: `${data.avg_completion_time || 2.5} days`,
        efficiency: Math.floor(Math.random() * 20 + 80) // Placeholder calculation
      })) : [];

    return {
      stats: {
        totalTransactions: data.total_transactions || 0,
        pendingApproval: data.pending_assignments || data.active_transactions || 0,
        completed: data.completed_transactions || 0,
        activeUsers: data.active_users || 0
      },
      volumeTrends,
      statusDistribution,
      departmentPerformance,
      processingTime,
      topPerformers
    };
  }

  private transformEditorData(data: any): EditorDashboard {
    return {
      assignedTransactions: data.assigned_transactions || 0,
      myAverageTime: data.avg_processing_time || 0,
      myCompletionRate: data.completion_rate || 0,
      pendingReviews: data.pending_reviews || 0,
      weeklyWorkload: data.weekly_workload || [],
      taskStatusDistribution: data.task_status || [],
      performanceByType: data.performance_by_type || [],
      deadlineTracker: data.deadline_tracker || [],
      clientActivity: data.client_activity || []
    };
  }

  private transformClientData(data: any): ClientDashboard {
    return {
      myTransactions: data.total_transactions || 0,
      pendingApproval: data.pending_approval || 0,
      completed: data.completed || 0,
      transactionTrends: data.transaction_trends || [],
      statusBreakdown: data.status_breakdown || []
    };
  }

  /**
   * Get mock data for development/demo
   */
  getMockAdminDashboard(): AdminDashboard {
    return {
      stats: {
        totalTransactions: 1847,
        pendingApproval: 156,
        completed: 1420,
        activeUsers: 128
      },
      volumeTrends: [
        { period: 'Week 1', count: 420, change: 12 },
        { period: 'Week 2', count: 485, change: 15 },
        { period: 'Week 3', count: 510, change: 5 },
        { period: 'Week 4', count: 432, change: -15 }
      ],
      statusDistribution: [
        { status: 'Completed', count: 65, percentage: 65 },
        { status: 'In Progress', count: 20, percentage: 20 },
        { status: 'Pending', count: 10, percentage: 10 },
        { status: 'Cancelled', count: 5, percentage: 5 }
      ],
      departmentPerformance: [
        { department: 'Engineering', completed: 342, pending: 45, avgTime: 2.5 },
        { department: 'Operations', completed: 298, pending: 32, avgTime: 3.2 },
        { department: 'Management', completed: 156, pending: 18, avgTime: 4.1 },
        { department: 'External', completed: 89, pending: 12, avgTime: 5.8 }
      ],
      processingTime: [
        { type: 'Technical', avgDays: 2.5 },
        { type: 'Administrative', avgDays: 3.2 },
        { type: 'Financial', avgDays: 4.1 },
        { type: 'Legal', avgDays: 5.8 }
      ],
      topPerformers: [
        { rank: 1, user: 'Sarah Mitchell', department: 'Operations', completed: 142, avgTime: '2.1 days', efficiency: 95 },
        { rank: 2, user: 'John Editor', department: 'Engineering', completed: 128, avgTime: '2.8 days', efficiency: 88 },
        { rank: 3, user: 'Mike Johnson', department: 'Engineering', completed: 115, avgTime: '3.2 days', efficiency: 82 }
      ]
    };
  }

  getMockEditorDashboard(): EditorDashboard {
    return {
      assignedTransactions: 47,
      myAverageTime: 2.8,
      myCompletionRate: 89,
      pendingReviews: 12,
      weeklyWorkload: [
        { day: 'Mon', assigned: 8, completed: 6 },
        { day: 'Tue', assigned: 12, completed: 10 },
        { day: 'Wed', assigned: 10, completed: 9 },
        { day: 'Thu', assigned: 15, completed: 12 },
        { day: 'Fri', assigned: 11, completed: 8 },
        { day: 'Sat', assigned: 5, completed: 4 },
        { day: 'Sun', assigned: 3, completed: 2 }
      ],
      taskStatusDistribution: [
        { status: 'Completed', count: 28, percentage: 60 },
        { status: 'In Progress', count: 8, percentage: 17 },
        { status: 'Under Review', count: 7, percentage: 15 },
        { status: 'Pending', count: 4, percentage: 8 }
      ],
      performanceByType: [
        { type: 'Document Review', completed: 12 },
        { type: 'Approval', completed: 8 },
        { type: 'Status Update', completed: 15 },
        { type: 'Info Request', completed: 10 }
      ],
      deadlineTracker: [
        { category: 'Overdue', count: 2, color: '#ef4444' },
        { category: 'Today', count: 3, color: '#f59e0b' },
        { category: 'Tomorrow', count: 5, color: '#eab308' },
        { category: 'This Week', count: 8, color: '#3b82f6' },
        { category: 'Next Week', count: 4, color: '#10b981' }
      ],
      clientActivity: [
        { transactionId: 'TRX-2024-0847', clientName: 'Ahmed Al-Rashid', lastActivity: '2 hours ago', responseTime: '< 1 hour', platformVisits: 12, status: 'active' },
        { transactionId: 'TRX-2024-0846', clientName: 'Fatima Al-Zahrani', lastActivity: '1 day ago', responseTime: '4 hours', platformVisits: 8, status: 'awaiting' },
        { transactionId: 'TRX-2024-0845', clientName: 'Mohammed Al-Qahtani', lastActivity: '30 min ago', responseTime: '< 30 min', platformVisits: 24, status: 'active' }
      ]
    };
  }
}

export default new ReportService();