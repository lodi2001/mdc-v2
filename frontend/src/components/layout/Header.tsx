import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ar');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleLogout = () => {
    logout();
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
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                  5
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="notification-dropdown">
                <div className="dropdown-header d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Notifications</span>
                  <a href="#" className="text-primary small">Mark all as read</a>
                </div>
                <div className="notification-list">
                  <Dropdown.Item>
                    <div className="d-flex">
                      <div className="flex-grow-1">
                        <p className="mb-1">New transaction submitted</p>
                        <small className="text-muted">2 minutes ago</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <div className="d-flex">
                      <div className="flex-grow-1">
                        <p className="mb-1">Transaction approved</p>
                        <small className="text-muted">1 hour ago</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                </div>
                <div className="dropdown-footer text-center">
                  <Link to="/notifications" className="text-primary">
                    View All Notifications
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