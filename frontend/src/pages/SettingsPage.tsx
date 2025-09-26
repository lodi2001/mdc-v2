import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import GeneralSettingsTab from '../components/settings/GeneralSettingsTab';
import EmailSettingsTab from '../components/settings/EmailSettingsTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';
import SecuritySettingsTab from '../components/settings/SecuritySettingsTab';
import MaintenanceModeTab from '../components/settings/MaintenanceModeTab';
import UsersSettingsTab from '../components/settings/UsersSettingsTab';
import TransactionsSettingsTab from '../components/settings/TransactionsSettingsTab';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user } = useAuth();

  // Only admin can access system settings
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const tabs = [
    { id: 'general', label: 'General Settings', icon: 'bi-gear' },
    { id: 'users', label: 'Users', icon: 'bi-people' },
    { id: 'transactions', label: 'Transactions', icon: 'bi-receipt' },
    { id: 'notifications', label: 'Notifications', icon: 'bi-bell' },
    { id: 'email', label: 'Email', icon: 'bi-envelope' },
    { id: 'maintenance', label: 'Maintenance', icon: 'bi-tools' },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' }
  ];

  useEffect(() => {
    // Handle unsaved changes warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'users':
        return <UsersSettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'transactions':
        return <TransactionsSettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'email':
        return <EmailSettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'notifications':
        return <NotificationSettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'security':
        return <SecuritySettingsTab onChangesMade={setHasUnsavedChanges} />;
      case 'maintenance':
        return <MaintenanceModeTab />;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            You don't have permission to access system settings. Only administrators can configure system settings.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="page-title">System Settings</h2>
              <p className="text-muted mb-0">Configure and manage system settings</p>
            </div>
            {hasUnsavedChanges && (
              <span className="badge bg-warning text-dark">
                <i className="bi bi-exclamation-circle me-1"></i>
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-white">
            <ul className="nav nav-tabs card-header-tabs">
              {tabs.map(tab => (
                <li className="nav-item" key={tab.id}>
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
                          setActiveTab(tab.id);
                          setHasUnsavedChanges(false);
                        }
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                  >
                    <i className={`${tab.icon} me-2`}></i>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-body">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
