import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import { Notification as NotificationType } from '../../types/notification';

interface HeaderProps {
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationType[]>([]);
  const isRTL = language === 'ar';

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleLogout = () => {
    logout();
  };

  // Load notification count and recent notifications
  const loadNotifications = async () => {
    try {
      const [count, notifications] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications()
      ]);
      setUnreadCount(count);
      // Get only the first 5 notifications for preview
      setRecentNotifications(notifications.slice(0, 5));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      // Update notifications to show as read
      setRecentNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bi-cash-stack';
      case 'system':
        return 'bi-gear';
      case 'user':
        return 'bi-person-plus';
      case 'report':
        return 'bi-file-text';
      default:
        return 'bi-bell';
    }
  };

  const getNotificationColor = (category: string) => {
    switch (category) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-info';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isRTL ? 'الآن' : 'Just now';
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes} minutes ago`;
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours} hours ago`;
    return isRTL ? `منذ ${days} يوم` : `${days} days ago`;
  };

  return (
    <header className="header">
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center">
          {/* Left Section */}
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-link text-dark p-0 d-lg-none" 
              onClick={onSidebarToggle}
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <div className="logo">
              <img src="/MDC-logo-Black.png" alt="MDC Logo" height="40" />
            </div>
            <h1 className="h5 mb-0 text-muted d-none d-md-block">
              Transaction Tracking System
            </h1>
          </div>

          {/* Right Section */}
          <div className="d-flex align-items-center gap-3">
            {/* Search */}
            <div className="search-box d-none d-md-block">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-transparent" 
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Notifications */}
            <Dropdown>
              <Dropdown.Toggle 
                variant="link" 
                className="text-dark p-2 position-relative"
                id="notifications-dropdown"
              >
                <i className="bi bi-bell fs-5"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="notification-dropdown">
                <div className="dropdown-header d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">{isRTL ? 'الإشعارات' : 'Notifications'}</span>
                  <a href="#" className="text-primary small" onClick={(e) => { e.preventDefault(); handleMarkAllAsRead(); }}>
                    {isRTL ? 'وضع علامة مقروءة على الكل' : 'Mark all as read'}
                  </a>
                </div>
                <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map(notification => (
                      <Dropdown.Item
                        key={notification.id}
                        as={Link}
                        to="/notifications"
                        className={`${!notification.is_read ? 'bg-light' : ''} position-relative`}
                      >
                        <div className="d-flex">
                          <div className={`notification-icon rounded-circle p-2 me-2 ${getNotificationColor(notification.category)} bg-opacity-10`}>
                            <i className={`bi ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.category)}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1 fw-semibold">{notification.title}</p>
                            <p className="mb-1 text-muted small">{notification.message}</p>
                            <small className="text-muted">{formatTimeAgo(notification.created_at)}</small>
                          </div>
                          {!notification.is_read && (
                            <span className="position-absolute top-50 end-0 translate-middle-y badge rounded-pill bg-primary" style={{ width: '8px', height: '8px' }}></span>
                          )}
                        </div>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                      <p className="mb-0">{isRTL ? 'لا توجد إشعارات' : 'No notifications'}</p>
                    </div>
                  )}
                </div>
                <div className="dropdown-footer text-center">
                  <Link to="/notifications" className="text-primary">
                    {isRTL ? 'عرض جميع الإشعارات' : 'View All Notifications'}
                  </Link>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            {/* Language Toggle */}
            <div className="language-toggle">
              <button 
                className={`btn btn-sm btn-outline-secondary ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                EN
              </button>
              <button 
                className={`btn btn-sm btn-outline-secondary ${language === 'ar' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('ar')}
              >
                AR
              </button>
            </div>

            {/* User Menu */}
            <Dropdown>
              <Dropdown.Toggle 
                variant="link" 
                className="text-dark p-0 d-flex align-items-center gap-2"
                id="user-menu"
              >
                <div className="user-avatar">
                  <i className="bi bi-person-circle fs-3"></i>
                </div>
                <div className="text-start d-none d-lg-block">
                  <div className="fw-semibold">{user?.name || 'User'}</div>
                  <small className="text-muted">{user?.role || 'Role'}</small>
                </div>
                <i className="bi bi-chevron-down"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item href="#">
                  <i className="bi bi-person me-2"></i> Profile
                </Dropdown.Item>
                <Dropdown.Item href="#">
                  <i className="bi bi-gear me-2"></i> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;