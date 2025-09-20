/**
 * Notification types and interfaces
 */

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'transaction' | 'system' | 'user' | 'report';
  type_display: string;
  category: 'info' | 'success' | 'warning' | 'danger';
  category_display: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  time_ago: string;
  transaction?: number;
  action_link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationGroup {
  label: string;
  labelAr?: string;
  notifications: Notification[];
}

export interface NotificationPreference {
  id: number;
  notification_type: string;
  notification_type_display: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    transaction: number;
    system: number;
    user: number;
    report: number;
  };
  byCategory: {
    info: number;
    success: number;
    warning: number;
    danger: number;
  };
}

export interface MarkReadRequest {
  notification_ids?: number[];
}

export interface NotificationFilterState {
  type: 'all' | 'transaction' | 'system' | 'user' | 'report';
  read: 'all' | 'read' | 'unread';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface NotificationSettingsState {
  preferences: NotificationPreference[];
  sound_enabled: boolean;
  desktop_enabled: boolean;
  email_digest: 'immediately' | 'daily' | 'weekly' | 'never';
}