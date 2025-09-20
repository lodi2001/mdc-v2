/**
 * Individual notification item component - simplified to match prototype
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'transaction':
        return 'bi-arrow-left-right';  // Changed from cash icon to process flow icon
      case 'system':
        return 'bi-exclamation-triangle';
      case 'user':
        return 'bi-person-plus';
      case 'report':
        return 'bi-file-text';
      default:
        return 'bi-bell';
    }
  };

  // Get icon color based on category
  const getIconColor = () => {
    switch (notification.category) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const handleViewDetails = () => {
    if (notification.action_link) {
      if (notification.action_link.startsWith('http')) {
        window.open(notification.action_link, '_blank');
      } else {
        navigate(notification.action_link);
      }
    } else if (notification.transaction) {
      navigate(`/transactions/${notification.transaction}`);
    }
    
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const iconColor = getIconColor();

  return (
    <div className={`card notification-item ${!notification.is_read ? 'unread' : ''} mb-2`}>
      <div className="card-body">
        <div className="d-flex">
          <div className={`notification-icon bg-${iconColor}-subtle text-${iconColor} rounded-circle p-3 me-3`}>
            <i className={`bi ${getIcon()} fs-5`}></i>
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="mb-1">{notification.title}</h6>
                <p className="mb-1 text-muted">{notification.message}</p>
                <small className="text-muted">{notification.time_ago}</small>
              </div>
              <div className="dropdown">
                <button 
                  className="btn btn-link text-muted p-0" 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
                <ul className="dropdown-menu">
                  {!notification.is_read && (
                    <li>
                      <button className="dropdown-item" onClick={handleMarkAsRead}>
                        {t('notifications.markAsRead')}
                      </button>
                    </li>
                  )}
                  <li>
                    <button className="dropdown-item" onClick={handleViewDetails}>
                      {t('notifications.viewDetails')}
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleDelete}>
                      {t('common.delete')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;