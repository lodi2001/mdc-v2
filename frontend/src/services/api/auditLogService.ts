import api from '../../utils/api';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResponse,
  AuditLogStatistics
} from '../../types/auditLog';

const BASE_URL = '/audit/logs';

class AuditLogService {
  /**
   * Get paginated list of audit logs
   */
  async getLogs(filters?: AuditLogFilters): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      // Handle array filters
      if (filters.action && filters.action.length > 0) {
        filters.action.forEach(action => params.append('action', action));
      }

      // Handle single value filters
      if (filters.user) params.append('user', filters.user.toString());
      if (filters.table_name) params.append('table_name', filters.table_name);
      if (filters.ip_address) params.append('ip_address', filters.ip_address);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.search) params.append('search', filters.search);
      if (filters.is_security_relevant !== undefined) {
        params.append('is_security_relevant', filters.is_security_relevant.toString());
      }

      // Pagination
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
    }

    const response = await api.get(`${BASE_URL}/?${params.toString()}`);
    return response.data;
  }

  /**
   * Get single audit log by ID
   */
  async getLog(id: number): Promise<AuditLog> {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(): Promise<AuditLogStatistics> {
    const response = await api.get(`${BASE_URL}/statistics/`);
    return response.data;
  }

  /**
   * Export audit logs
   */
  async exportLogs(format: 'xlsx' | 'csv' | 'pdf', filters?: AuditLogFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);

    if (filters) {
      // Add filters to params
      if (filters.action && filters.action.length > 0) {
        filters.action.forEach(action => params.append('action', action));
      }
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await api.get(`${BASE_URL}/export/?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Clean up old audit logs (admin only)
   */
  async cleanupLogs(days: number): Promise<{ deleted_count: number; message: string }> {
    const response = await api.post(`${BASE_URL}/cleanup/`, { days });
    return response.data;
  }

  /**
   * Format log details for display
   */
  formatLogDetails(log: AuditLog): string {
    const details: any = {
      event: log.action_display,
      timestamp: new Date(log.created_at).toISOString(),
      user: log.user_display_name,
      table: log.table_name,
      record_id: log.record_id
    };

    if (log.ip_address) details.ip = log.ip_address;
    if (log.user_agent) details.userAgent = log.user_agent;
    if (log.request_method) details.method = log.request_method;
    if (log.request_path) details.path = log.request_path;
    if (log.response_status) details.status = log.response_status;

    if (log.old_values && Object.keys(log.old_values).length > 0) {
      details.old_values = log.old_values;
    }

    if (log.new_values && Object.keys(log.new_values).length > 0) {
      details.new_values = log.new_values;
    }

    return JSON.stringify(details, null, 2);
  }

  /**
   * Get a human-readable summary of the log
   */
  getLogSummary(log: AuditLog): string {
    const user = log.user_display_name || 'System';
    const action = log.action_display.toLowerCase();

    switch (log.action) {
      case 'login':
        return `${user} logged in successfully`;
      case 'login_failed':
        return `Failed login attempt for ${user}`;
      case 'create':
        return `${user} created a new ${log.table_name} record`;
      case 'update':
        return `${user} updated ${log.table_name} #${log.record_id}`;
      case 'delete':
        return `${user} deleted ${log.table_name} #${log.record_id}`;
      case 'file_upload':
        return `${user} uploaded a file`;
      case 'file_download':
        return `${user} downloaded a file`;
      case 'permission_denied':
        return `Access denied for ${user}`;
      default:
        return log.description || `${user} performed ${action}`;
    }
  }
}

export default new AuditLogService();