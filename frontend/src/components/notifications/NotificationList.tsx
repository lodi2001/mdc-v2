/**
 * Notification list component - simplified to match prototype
 */

import React from 'react';
import NotificationItem from './NotificationItem';
import { NotificationGroup } from '../../types/notification';

interface NotificationListProps {
  groups: NotificationGroup[];
  loading: boolean;
  error: string | null;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  groups,
  loading,
  error,
  onMarkAsRead,
  onDelete
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';

  if (loading && groups.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-bell-slash fs-1 text-muted mb-3 d-block"></i>
        <h5 className="text-muted">{isRTL ? 'لا توجد إشعارات' : 'No notifications'}</h5>
        <p className="text-muted">{isRTL ? 'لم يتم العثور على أي إشعارات' : 'No notifications found'}</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="notification-group mb-4">
          {/* Group header */}
          <h6 className="text-muted mb-3">{isRTL && group.labelAr ? group.labelAr : group.label}</h6>
          
          {/* Group notifications */}
          {group.notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default NotificationList;