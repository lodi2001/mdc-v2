/**
 * Notification settings modal component - simplified to match prototype
 */

import React, { useState } from 'react';
// TODO: Configure react-i18next properly before using useTranslation
// import { useTranslation } from 'react-i18next';

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  open,
  onClose
}) => {
  // TODO: Re-enable when react-i18next is properly configured
  // const { t } = useTranslation();
  
  // Simple state for basic settings like the prototype
  const [emailTransactions, setEmailTransactions] = useState(true);
  const [emailSystem, setEmailSystem] = useState(true);
  const [emailUsers, setEmailUsers] = useState(false);
  const [pushTransactions, setPushTransactions] = useState(true);
  const [pushSystem, setPushSystem] = useState(false);
  const [pushUsers, setPushUsers] = useState(false);

  const handleSave = () => {
    // Simple save logic - in production this would call the API
    console.log('Saving notification settings:', {
      emailTransactions,
      emailSystem,
      emailUsers,
      pushTransactions,
      pushSystem,
      pushUsers
    });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="modal-backdrop fade show"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Notification Settings</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body">
              {/* Email Notifications */}
              <h6 className="mb-3">Email Notifications</h6>
              <div className="form-check form-switch mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="emailTransactions"
                  checked={emailTransactions}
                  onChange={(e) => setEmailTransactions(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emailTransactions">
                  Transaction Updates
                </label>
              </div>
              <div className="form-check form-switch mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="emailSystem"
                  checked={emailSystem}
                  onChange={(e) => setEmailSystem(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emailSystem">
                  System Alerts
                </label>
              </div>
              <div className="form-check form-switch mb-4">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="emailUsers"
                  checked={emailUsers}
                  onChange={(e) => setEmailUsers(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emailUsers">
                  User Activities
                </label>
              </div>
              
              {/* Push Notifications */}
              <h6 className="mb-3">Push Notifications</h6>
              <div className="form-check form-switch mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="pushTransactions"
                  checked={pushTransactions}
                  onChange={(e) => setPushTransactions(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pushTransactions">
                  Transaction Updates
                </label>
              </div>
              <div className="form-check form-switch mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="pushSystem"
                  checked={pushSystem}
                  onChange={(e) => setPushSystem(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pushSystem">
                  System Alerts
                </label>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="pushUsers"
                  checked={pushUsers}
                  onChange={(e) => setPushUsers(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pushUsers">
                  User Activities
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSave}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSettings;