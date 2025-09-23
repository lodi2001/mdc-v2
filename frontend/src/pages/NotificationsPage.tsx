/**
 * Notifications page component - simplified to match prototype
 */

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import NotificationList from '../components/notifications/NotificationList';
import NotificationFilters from '../components/notifications/NotificationFilters';
import NotificationSettings from '../components/notifications/NotificationSettings';
import { 
  NotificationGroup, 
  NotificationFilterState,
  NotificationStats 
} from '../types/notification';
import notificationService from '../services/notificationService';

const NotificationsPage: React.FC = () => {
  const isRTL = localStorage.getItem('language') === 'ar';

  // State management
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilterState>({
    type: 'all',
    read: 'all'
  });
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const groups = await notificationService.getGroupedNotifications(filters);
      setNotificationGroups(groups);

      // Update stats
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || (isRTL ? 'فشل تحميل الإشعارات' : 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  }, [filters, isRTL]);

  // Load notifications on mount and filter change
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle mark as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead([id]);
      setNotificationGroups(prev => prev.map(group => ({
        ...group,
        notifications: group.notifications.map(n =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      })));
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          unread: Math.max(0, stats.unread - 1)
        });
      }

      showSnackbar(isRTL ? 'تم وضع علامة مقروءة' : 'Marked as read', 'success');
    } catch (err: any) {
      showSnackbar(err.message || (isRTL ? 'فشل وضع علامة مقروءة' : 'Failed to mark as read'), 'error');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotificationGroups(prev => prev.map(group => ({
        ...group,
        notifications: group.notifications.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      })));
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          unread: 0
        });
      }

      showSnackbar(isRTL ? 'تم وضع علامة مقروءة على جميع الإشعارات' : 'All notifications marked as read', 'success');
    } catch (err: any) {
      showSnackbar(err.message || (isRTL ? 'فشل وضع علامة مقروءة' : 'Failed to mark as read'), 'error');
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotificationGroups(prev => prev.map(group => ({
        ...group,
        notifications: group.notifications.filter(n => n.id !== id)
      })).filter(group => group.notifications.length > 0));

      showSnackbar(isRTL ? 'تم حذف الإشعار' : 'Notification deleted', 'success');
    } catch (err: any) {
      showSnackbar(err.message || (isRTL ? 'فشل حذف الإشعار' : 'Failed to delete notification'), 'error');
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف جميع الإشعارات؟' : 'Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      await notificationService.clearAll();
      setNotificationGroups([]);
      showSnackbar(isRTL ? 'تم مسح جميع الإشعارات' : 'All notifications cleared', 'success');
    } catch (err: any) {
      showSnackbar(err.message || (isRTL ? 'فشل مسح الإشعارات' : 'Failed to clear notifications'), 'error');
    }
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Auto-hide toast notification
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{isRTL ? 'الإشعارات' : 'Notifications'}</h2>
            <p className="text-muted mb-0">{isRTL ? 'إدارة وعرض جميع إشعاراتك' : 'Manage and view all your notifications'}</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary"
              onClick={handleMarkAllAsRead}
            >
              <i className="bi bi-check-all me-2"></i>
              {isRTL ? 'وضع علامة مقروءة على الكل' : 'Mark all as read'}
            </button>
            <button 
              className="btn btn-outline-danger"
              onClick={handleClearAll}
            >
              <i className="bi bi-trash me-2"></i>
              {isRTL ? 'مسح الكل' : 'Clear all'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setSettingsOpen(true)}
            >
              <i className="bi bi-gear me-2"></i>
              {isRTL ? 'الإعدادات' : 'Settings'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <NotificationFilters
          filters={filters}
          stats={stats}
          onFilterChange={setFilters}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Notifications List */}
        <div className="tab-content">
          <div className="tab-pane fade show active">
            <NotificationList
              groups={notificationGroups}
              loading={loading}
              error={error}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          </div>
        </div>

        {/* Settings modal */}
        <NotificationSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        {/* Toast notifications */}
        <div 
          className="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3" 
          style={{ zIndex: 1050 }}
        >
          <div 
            className={`toast ${snackbar.open ? 'show' : ''}`}
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className={`toast-body d-flex align-items-center bg-${
              snackbar.severity === 'success' ? 'success' :
              snackbar.severity === 'error' ? 'danger' :
              snackbar.severity === 'warning' ? 'warning' :
              'info'
            } text-white`}>
              <i className={`bi bi-${
                snackbar.severity === 'success' ? 'check-circle-fill' :
                snackbar.severity === 'error' ? 'x-circle-fill' :
                snackbar.severity === 'warning' ? 'exclamation-triangle-fill' :
                'info-circle-fill'
              } me-2`}></i>
              <div className="flex-grow-1">{snackbar.message}</div>
              <button 
                type="button" 
                className="btn-close btn-close-white ms-2"
                onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
                aria-label="Close"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;