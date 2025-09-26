import api from './api';

export interface SystemSetting {
  id: number;
  key: string;
  name: string;
  description?: string;
  category: string;
  category_display: string;
  setting_type: string;
  setting_type_display: string;
  value: string;
  typed_value?: any;
  default_value?: string;
  is_required: boolean;
  is_editable: boolean;
  is_sensitive: boolean;
  validation_rules?: any;
  help_text?: string;
  created_at: string;
  updated_at: string;
  updated_by?: any;
}

export interface SettingsByCategory {
  category: string;
  category_display: string;
  settings: SystemSetting[];
  editable_count: number;
  total_count: number;
}

export interface SystemMaintenanceMode {
  id: number;
  is_enabled: boolean;
  message: string;
  message_ar?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  created_by?: any;
  updated_by?: any;
}

export interface SystemHealth {
  overall_status: string;
  uptime: number;
  database_status: string;
  database_response_time: number;
  cache_status: string;
  cache_hit_rate: number;
  storage_status: string;
  storage_usage: any;
  email_service_status: string;
  last_email_sent?: string;
  memory_usage: any;
  cpu_usage: number;
  disk_usage: any;
  active_connections: number;
  active_users: number;
  error_rate: number;
  avg_response_time: number;
  recent_errors: any[];
  alerts: string[];
  warnings: string[];
  last_updated: string;
}

export interface SystemStatus {
  is_maintenance_active: boolean;
  maintenance_message?: string;
  version: string;
  environment: string;
  debug_mode: boolean;
  features_enabled: any;
  database_accessible: boolean;
  database_version: string;
  cache_accessible: boolean;
  cache_type: string;
  media_storage: any;
  static_storage: any;
  email_service: any;
  current_load: any;
}

export interface SystemInfo {
  app_name: string;
  app_version: string;
  environment: string;
  django_version: string;
  python_version: string;
  database_engine: string;
  database_name: string;
  cache_backend: string;
  server_time: string;
  timezone: string;
  total_users: number;
  total_transactions: number;
  total_attachments: number;
  storage_usage: any;
  last_maintenance?: string;
}

class SystemSettingsService {
  // Settings endpoints
  async getSettings(params?: any) {
    const response = await api.get('/system-settings/settings/', { params });
    return response.data;
  }

  async getSettingById(id: number) {
    const response = await api.get(`/system-settings/settings/${id}/`);
    return response.data;
  }

  async updateSetting(id: number, value: string) {
    const response = await api.patch(`/system-settings/settings/${id}/`, { value });
    return response.data;
  }

  async getSettingsByCategory(): Promise<SettingsByCategory[]> {
    const response = await api.get('/system-settings/settings/by_category/');
    return response.data;
  }

  async bulkUpdateSettings(settings: Record<string, any>) {
    const response = await api.post('/system-settings/settings/bulk_update/', { settings });
    return response.data;
  }

  async resetToDefaults(category?: string, setting_keys?: string[]) {
    const response = await api.post('/system-settings/settings/reset_to_defaults/', {
      category,
      setting_keys
    });
    return response.data;
  }

  // Maintenance mode endpoints
  async getMaintenanceMode() {
    const response = await api.get('/system-settings/maintenance/');
    return response.data;
  }

  async getCurrentMaintenanceStatus() {
    const response = await api.get('/system-settings/maintenance/current_status/');
    return response.data;
  }

  async enableMaintenanceMode(message: string, message_ar?: string) {
    const response = await api.post('/system-settings/maintenance/enable/', {
      message,
      message_ar
    });
    return response.data;
  }

  async disableMaintenanceMode() {
    const response = await api.post('/system-settings/maintenance/disable/');
    return response.data;
  }

  async updateMaintenanceMode(id: number, data: Partial<SystemMaintenanceMode>) {
    const response = await api.patch(`/system-settings/maintenance/${id}/`, data);
    return response.data;
  }

  // System health and status endpoints
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get('/system-settings/health/');
    return response.data;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get('/system-settings/status/');
    return response.data;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await api.get('/system-settings/info/');
    return response.data;
  }

  // Utility function to test email configuration
  async testEmailConfiguration(testEmail: string) {
    // This would need to be implemented on the backend
    const response = await api.post('/system-settings/test-email/', {
      test_email: testEmail
    });
    return response.data;
  }
}

const systemSettingsService = new SystemSettingsService();
export default systemSettingsService;