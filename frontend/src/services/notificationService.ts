/**
 * Notification service for managing notifications
 */

import { api } from '../services/api/client';
import type {
  Notification as NotificationType,
  NotificationGroup,
  NotificationPreference,
  NotificationStats,
  MarkReadRequest,
  NotificationFilterState,
  NotificationSettingsState
} from '../types/notification';

class NotificationService {
  private baseUrl = '/notifications/notifications';

  /**
   * Get all notifications with optional filters
   */
  async getNotifications(filters?: NotificationFilterState): Promise<NotificationType[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.read && filters.read !== 'all') {
        params.append('is_read', filters.read === 'read' ? 'true' : 'false');
      }
      if (filters.dateRange) {
        params.append('created_at_after', filters.dateRange.start);
        params.append('created_at_before', filters.dateRange.end);
      }
    }

    try {
      const response = await api.get(`${this.baseUrl}/?${params.toString()}`);
      // The backend returns an object with success, pagination, and results
      // We need to extract the results array
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      // Fallback for non-paginated response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Return empty array if structure is unexpected
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get grouped notifications (today, yesterday, this week, older)
   */
  async getGroupedNotifications(filters?: NotificationFilterState): Promise<NotificationGroup[]> {
    // Get all notifications first
    const notifications = await this.getNotifications(filters);
    
    // Ensure notifications is an array
    const notificationArray = Array.isArray(notifications) ? notifications : [];
    
    // Group them by date on the client side
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const groups: NotificationGroup[] = [];
    const todayNotifications: NotificationType[] = [];
    const yesterdayNotifications: NotificationType[] = [];
    const thisWeekNotifications: NotificationType[] = [];
    const olderNotifications: NotificationType[] = [];
    
    notificationArray.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      
      if (notificationDate >= today) {
        todayNotifications.push(notification);
      } else if (notificationDate >= yesterday) {
        yesterdayNotifications.push(notification);
      } else if (notificationDate >= weekAgo) {
        thisWeekNotifications.push(notification);
      } else {
        olderNotifications.push(notification);
      }
    });
    
    if (todayNotifications.length > 0) {
      groups.push({
        label: 'Today',
        labelAr: 'اليوم',
        notifications: todayNotifications
      });
    }
    
    if (yesterdayNotifications.length > 0) {
      groups.push({
        label: 'Yesterday',
        labelAr: 'أمس',
        notifications: yesterdayNotifications
      });
    }
    
    if (thisWeekNotifications.length > 0) {
      groups.push({
        label: 'This Week',
        labelAr: 'هذا الأسبوع',
        notifications: thisWeekNotifications
      });
    }
    
    if (olderNotifications.length > 0) {
      groups.push({
        label: 'Older',
        labelAr: 'أقدم',
        notifications: olderNotifications
      });
    }
    
    return groups;
  }

  /**
   * Get single notification
   */
  async getNotification(id: number): Promise<NotificationType> {
    const response = await api.get(`${this.baseUrl}/${id}/`);
    return response.data;
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds?: number[]): Promise<void> {
    const data: MarkReadRequest = {};
    if (notificationIds) {
      data.notification_ids = notificationIds;
    }
    await api.post(`${this.baseUrl}/mark_read/`, data);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.post(`${this.baseUrl}/mark_all_read/`);
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    await api.delete(`${this.baseUrl}/clear_all/`);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}/`);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get(`${this.baseUrl}/unread_count/`);
    return response.data.count;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get(`${this.baseUrl}/`);
    
    // Extract notifications array from paginated response
    let notifications: NotificationType[] = [];
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      notifications = response.data.results;
    } else if (Array.isArray(response.data)) {
      notifications = response.data;
    }
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byType: {
        transaction: 0,
        system: 0,
        user: 0,
        report: 0
      },
      byCategory: {
        info: 0,
        success: 0,
        warning: 0,
        danger: 0
      }
    };
    
    notifications.forEach(notification => {
      stats.byType[notification.type]++;
      stats.byCategory[notification.category]++;
    });
    
    return stats;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await api.get(`${this.baseUrl}/preferences/`);
    return response.data;
  }

  /**
   * Update notification preference
   */
  async updatePreference(
    id: number,
    preference: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const response = await api.patch(`${this.baseUrl}/preferences/${id}/`, preference);
    return response.data;
  }

  /**
   * Bulk update notification preferences
   */
  async bulkUpdatePreferences(
    preferences: Array<{
      notification_type: string;
      email_enabled: boolean;
      in_app_enabled: boolean;
    }>
  ): Promise<NotificationPreference[]> {
    const response = await api.post(`${this.baseUrl}/preferences/bulk_update/`, {
      preferences
    });
    return response.data.preferences;
  }

  /**
   * Get notification settings (local storage)
   */
  getLocalSettings(): NotificationSettingsState {
    const stored = localStorage.getItem('notification_settings');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      preferences: [],
      sound_enabled: true,
      desktop_enabled: false,
      email_digest: 'immediately'
    };
  }

  /**
   * Save notification settings (local storage)
   */
  saveLocalSettings(settings: NotificationSettingsState): void {
    localStorage.setItem('notification_settings', JSON.stringify(settings));
  }

  /**
   * Request desktop notification permission
   */
  async requestDesktopPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  /**
   * Show desktop notification
   */
  showDesktopNotification(notification: NotificationType): void {
    const settings = this.getLocalSettings();
    
    if (!settings.desktop_enabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    new Notification(notification.title, {
      body: notification.message,
      icon: `/favicon.ico`,
      badge: `/favicon.ico`,
      tag: `notification-${notification.id}`,
      requireInteraction: notification.category === 'danger'
    });
  }

  /**
   * Play notification sound
   */
  playSound(): void {
    const settings = this.getLocalSettings();
    
    if (!settings.sound_enabled) {
      return;
    }
    
    // Create and play a simple beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkhByyL0fPTieUGHCmpqOoXlUoLNobNLLlmJxktjM3yy4LmRi53sV+rcmchLzTN8c50T19nzvXJ3OQbg6vwpWsZH3+z96x3J+7U68Xi4xijsmJwmUiG+bRMaSEkOIDPyv0N8ND6pcsBVCLx2+mjsJeFlu/T9WdAcSGXy5NG4lYN');
    audio.play().catch(e => console.error('Error playing sound:', e));
  }

  /**
   * Check for new notifications
   */
  async checkForNew(lastCheckTime?: string): Promise<NotificationType[]> {
    const params = new URLSearchParams();
    if (lastCheckTime) {
      params.append('created_at_after', lastCheckTime);
    }
    params.append('is_read', 'false');
    
    const response = await api.get(`${this.baseUrl}/notifications/?${params.toString()}`);
    
    // Extract notifications array from paginated response
    let newNotifications: NotificationType[] = [];
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      newNotifications = response.data.results;
    } else if (Array.isArray(response.data)) {
      newNotifications = response.data;
    }
    
    // Show desktop notification and play sound for each new notification
    newNotifications.forEach(notification => {
      this.showDesktopNotification(notification);
      this.playSound();
    });
    
    return newNotifications;
  }
}

export default new NotificationService();