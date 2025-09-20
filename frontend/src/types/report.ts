/**
 * Report types and interfaces
 */

export interface DashboardStats {
  totalTransactions: number;
  pendingApproval: number;
  completed: number;
  activeUsers: number;
}

export interface MetricCard {
  title: string;
  titleAr?: string;
  value: number | string;
  subtitle?: string;
  subtitleAr?: string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    text: string;
    textAr?: string;
  };
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    tension?: number;
  }[];
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ReportFilter {
  dateRange: DateRange;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: number;
  department?: string;
}

export interface PerformanceMetric {
  rank: number;
  user: string;
  department: string;
  completed: number;
  avgTime: string;
  efficiency: number;
}

export interface ClientActivity {
  transactionId: string;
  clientName: string;
  lastActivity: string;
  responseTime: string;
  platformVisits: number;
  status: 'active' | 'inactive' | 'awaiting' | 'reviewing';
}

export interface TransactionVolume {
  period: string;
  count: number;
  change?: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface DepartmentPerformance {
  department: string;
  completed: number;
  pending: number;
  avgTime: number;
}

export interface ProcessingTimeByType {
  type: string;
  avgDays: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  volumeTrends: TransactionVolume[];
  statusDistribution: StatusDistribution[];
  departmentPerformance: DepartmentPerformance[];
  processingTime: ProcessingTimeByType[];
  topPerformers: PerformanceMetric[];
}

export interface EditorDashboard {
  assignedTransactions: number;
  myAverageTime: number;
  myCompletionRate: number;
  pendingReviews: number;
  weeklyWorkload: {
    day: string;
    assigned: number;
    completed: number;
  }[];
  taskStatusDistribution: StatusDistribution[];
  performanceByType: {
    type: string;
    completed: number;
  }[];
  deadlineTracker: {
    category: string;
    count: number;
    color: string;
  }[];
  clientActivity: ClientActivity[];
}

export interface ClientDashboard {
  myTransactions: number;
  pendingApproval: number;
  completed: number;
  transactionTrends: TransactionVolume[];
  statusBreakdown: StatusDistribution[];
}

export interface ReportExport {
  format: 'pdf' | 'excel';
  dateRange: DateRange;
  includeCharts?: boolean;
  language: 'en' | 'ar';
}