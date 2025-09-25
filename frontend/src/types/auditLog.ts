// Audit Log Types

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'status_change'
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'export'
  | 'import'
  | 'permission_denied'
  | 'view'
  | 'search'
  | 'other';

export type SystemHealth = 'excellent' | 'good' | 'warning' | 'critical';

export type LogSeverity = 'success' | 'info' | 'warning' | 'error';

export interface AuditLog {
  id: number;
  user: number | null;
  user_display_name: string;
  action: AuditAction;
  action_display: string;
  table_name: string;
  record_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  created_at: string;
  formatted_changes: string;
  is_security_relevant: boolean;
  content_type?: number;
  object_id?: number;
}

export interface AuditLogStatistics {
  total_events: number;
  active_users: number;
  security_alerts: number;
  system_health: SystemHealth;
  recent_activities: RecentActivity[];
  activity_by_action: Record<string, number>;
  activity_by_user: UserActivity[];
  activity_timeline: TimelineData[];
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  table_name: string;
  created_at: string;
  is_security_relevant: boolean;
}

export interface UserActivity {
  user__email: string;
  user__full_name: string;
  count: number;
}

export interface TimelineData {
  hour: string;
  count: number;
}

export interface AuditLogFilters {
  action?: AuditAction[];
  user?: number;
  table_name?: string;
  ip_address?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  is_security_relevant?: boolean;
  page?: number;
  page_size?: number;
}

export interface AuditLogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

// Helper functions
export function getLogSeverity(action: AuditAction): LogSeverity {
  const errorActions: AuditAction[] = ['login_failed', 'permission_denied'];
  const warningActions: AuditAction[] = ['delete', 'password_change', 'password_reset'];
  const successActions: AuditAction[] = ['login', 'create'];

  if (errorActions.includes(action)) return 'error';
  if (warningActions.includes(action)) return 'warning';
  if (successActions.includes(action)) return 'success';
  return 'info';
}

export function getHealthColor(health: SystemHealth): string {
  switch (health) {
    case 'excellent': return 'success';
    case 'good': return 'primary';
    case 'warning': return 'warning';
    case 'critical': return 'danger';
    default: return 'secondary';
  }
}

export function formatActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    login: 'Login',
    logout: 'Logout',
    login_failed: 'Login Failed',
    password_change: 'Password Change',
    password_reset: 'Password Reset',
    status_change: 'Status Change',
    file_upload: 'File Upload',
    file_download: 'File Download',
    file_delete: 'File Delete',
    export: 'Export',
    import: 'Import',
    permission_denied: 'Permission Denied',
    view: 'View',
    search: 'Search',
    other: 'Other'
  };

  return labels[action] || action;
}

export const ACTION_OPTIONS: Array<{ value: AuditAction; label: string; labelAr: string }> = [
  { value: 'create', label: 'Create', labelAr: 'إنشاء' },
  { value: 'update', label: 'Update', labelAr: 'تحديث' },
  { value: 'delete', label: 'Delete', labelAr: 'حذف' },
  { value: 'login', label: 'Login', labelAr: 'تسجيل دخول' },
  { value: 'logout', label: 'Logout', labelAr: 'تسجيل خروج' },
  { value: 'login_failed', label: 'Login Failed', labelAr: 'فشل تسجيل الدخول' },
  { value: 'password_change', label: 'Password Change', labelAr: 'تغيير كلمة المرور' },
  { value: 'password_reset', label: 'Password Reset', labelAr: 'إعادة تعيين كلمة المرور' },
  { value: 'status_change', label: 'Status Change', labelAr: 'تغيير الحالة' },
  { value: 'file_upload', label: 'File Upload', labelAr: 'رفع ملف' },
  { value: 'file_download', label: 'File Download', labelAr: 'تحميل ملف' },
  { value: 'file_delete', label: 'File Delete', labelAr: 'حذف ملف' },
  { value: 'export', label: 'Export', labelAr: 'تصدير' },
  { value: 'import', label: 'Import', labelAr: 'استيراد' },
  { value: 'permission_denied', label: 'Permission Denied', labelAr: 'رفض الصلاحية' },
  { value: 'view', label: 'View', labelAr: 'عرض' },
  { value: 'search', label: 'Search', labelAr: 'بحث' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' }
];