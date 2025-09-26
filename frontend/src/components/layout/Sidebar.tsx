import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  badge?: {
    text: string;
    class: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // Load notification count
  const loadNotificationCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  useEffect(() => {
    loadNotificationCount();
    // TODO: Replace polling with WebSocket or manual refresh to reduce API calls
    // Temporarily disabled automatic polling to prevent rate limit issues
    // const interval = setInterval(loadNotificationCount, 30000);
    // return () => clearInterval(interval);
  }, []);

  const getMenuItems = (): MenuItem[] => {
    // Handle lowercase role from backend
    const role = user?.role?.toLowerCase();
    
    if (role === 'admin') {
      return [
        { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
        { path: '/transactions', icon: 'bi-receipt', label: 'All Transactions' },
        { path: '/transactions/create', icon: 'bi-plus-square', label: 'Create Transaction' },
        { path: '/users', icon: 'bi-people', label: 'User Management' },
        { path: '/notifications', icon: 'bi-bell', label: 'Notifications', badge: notificationCount > 0 ? { text: notificationCount > 99 ? '99+' : notificationCount.toString(), class: 'bg-danger' } : undefined },
        { path: '/reports', icon: 'bi-graph-up', label: 'Reports & Analytics' },
        { path: '/assignments', icon: 'bi-person-check', label: 'Assignments' },
        { path: '/email-templates', icon: 'bi-envelope', label: 'Email Templates' },
        { path: '/audit-logs', icon: 'bi-clock-history', label: 'Audit Logs' },
        { path: '/settings', icon: 'bi-gear', label: 'System Settings' },
      ];
    } else if (role === 'editor') {
      return [
        { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
        { path: '/transactions', icon: 'bi-receipt', label: 'My Transactions' },
        { path: '/transactions/create', icon: 'bi-plus-square', label: 'Create New' },
        { path: '/assigned-tasks', icon: 'bi-list-task', label: 'Assigned Transactions' },
        { path: '/notifications', icon: 'bi-bell', label: 'Notifications', badge: notificationCount > 0 ? { text: notificationCount > 99 ? '99+' : notificationCount.toString(), class: 'bg-danger' } : undefined },
        { path: '/import-wizard', icon: 'bi-upload', label: 'Bulk Import' },
        { path: '/drafts', icon: 'bi-file-earmark', label: 'Drafts' },
        { path: '/reports', icon: 'bi-file-earmark-bar-graph', label: 'Reports' },
      ];
    } else {
      // Client
      return [
        { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
        { path: '/transactions', icon: 'bi-receipt', label: 'My Transactions' },
        { path: '/documents', icon: 'bi-file-earmark-text', label: 'Documents' },
        { path: '/notifications', icon: 'bi-bell', label: 'Notifications', badge: notificationCount > 0 ? { text: notificationCount > 99 ? '99+' : notificationCount.toString(), class: 'bg-danger' } : undefined },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay d-lg-none" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header d-lg-none">
          <button 
            className="btn btn-link text-dark p-0" 
            onClick={onClose}
          >
            <i className="bi bi-x-lg fs-4"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav flex-column">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => window.innerWidth < 992 && onClose()}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badge.class} ms-auto`}>
                      {item.badge.text}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="small px-3">
            Version 1.0.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;