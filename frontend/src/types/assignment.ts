/**
 * Assignment-related type definitions
 */

export interface Assignment {
  id: string;
  transactionId: string;  // The TRX-YYYY-NNNNN format ID
  referenceNumber: string;  // External reference number from admin/editor
  title: string;  // Transaction title
  clientName: string;
  clientId?: number;
  type: string;
  description: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  assignedTo?: AssignedUser;
  assignedToName?: string;  // Name of assigned person for display
  assignedDate: string;
  dueDate: string;
  progress: number;
  commentsCount: number;
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
}

export interface AssignedUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  workload?: number;
}

export type AssignmentStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
export type AssignmentPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface AssignmentFilter {
  search?: string;
  priority?: AssignmentPriority | '';
  status?: AssignmentStatus | '';
  assignedTo?: number | '';
  dueDate?: 'overdue' | 'today' | 'week' | 'month' | '';
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
}

export interface AssignmentStats {
  totalAssigned: number;
  urgent: number;
  pendingReview: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  averageCompletionTime: number;
}

export interface BulkAction {
  action: 'assign' | 'status' | 'priority' | 'delete';
  transactionIds: string[];
  data: {
    assignedTo?: number;
    status?: AssignmentStatus;
    priority?: AssignmentPriority;
    comment?: string;
  };
}

export interface WorkloadDistribution {
  userId: number;
  userName: string;
  totalTasks: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
  completed: number;
  inProgress: number;
  overdue: number;
  averageTime: number;
  efficiency: number;
}

export interface AssignmentHistory {
  id: number;
  transactionId: string;
  action: string;
  fromUser?: AssignedUser;
  toUser?: AssignedUser;
  comment?: string;
  timestamp: string;
  performedBy: AssignedUser;
}

export interface AssignmentExport {
  format: 'pdf' | 'excel' | 'csv';
  filters?: AssignmentFilter;
  columns?: string[];
}

export interface AssignmentResponse {
  data: Assignment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AssignmentMetrics {
  completionRate: number;
  averageResponseTime: number;
  overdueRate: number;
  reassignmentRate: number;
  clientSatisfaction?: number;
}