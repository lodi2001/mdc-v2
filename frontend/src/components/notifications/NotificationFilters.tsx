/**
 * Notification filters component - simplified to match prototype
 */

import React from 'react';
import { NotificationFilterState, NotificationStats } from '../../types/notification';

interface NotificationFiltersProps {
  filters: NotificationFilterState;
  stats: NotificationStats | null;
  onFilterChange: (filters: NotificationFilterState) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  stats,
  onFilterChange,
  activeTab,
  onTabChange
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    
    // Update filters based on tab
    switch (tab) {
      case 'all':
        onFilterChange({ type: 'all', read: 'all' });
        break;
      case 'unread':
        onFilterChange({ type: 'all', read: 'unread' });
        break;
      case 'system':
        onFilterChange({ type: 'system', read: 'all' });
        break;
      case 'transactions':
        onFilterChange({ type: 'transaction', read: 'all' });
        break;
      case 'users':
        onFilterChange({ type: 'user', read: 'all' });
        break;
      default:
        onFilterChange({ type: 'all', read: 'all' });
    }
  };

  return (
    <ul className="nav nav-tabs mb-4" role="tablist">
      <li className="nav-item">
        <button 
          className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabClick('all')}
          type="button"
        >
          {isRTL ? 'الكل' : 'All'}
        </button>
      </li>
      <li className="nav-item">
        <button 
          className={`nav-link ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => handleTabClick('unread')}
          type="button"
        >
          {isRTL ? 'غير مقروءة' : 'Unread'}
          {stats && stats.unread > 0 && (
            <span className="badge bg-danger ms-1">{stats.unread}</span>
          )}
        </button>
      </li>
      <li className="nav-item">
        <button 
          className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => handleTabClick('system')}
          type="button"
        >
          {isRTL ? 'النظام' : 'System'}
        </button>
      </li>
      <li className="nav-item">
        <button 
          className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => handleTabClick('transactions')}
          type="button"
        >
          {isRTL ? 'المعاملات' : 'Transactions'}
        </button>
      </li>
      <li className="nav-item">
        <button 
          className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabClick('users')}
          type="button"
        >
          {isRTL ? 'المستخدمون' : 'Users'}
        </button>
      </li>
    </ul>
  );
};

export default NotificationFilters;