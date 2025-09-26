import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface NotificationSettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ onChangesMade }) => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    onChangesMade(hasChanges);
  }, [formData, originalData, onChangesMade]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const categoriesData = await systemSettingsService.getSettingsByCategory();
      const notificationCategory = categoriesData.find(cat => cat.category === 'notifications');

      if (notificationCategory) {
        setSettings(notificationCategory.settings);
        const initialData: Record<string, any> = {};
        notificationCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load notification settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const changedSettings: Record<string, any> = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedSettings[key] = formData[key];
        }
      });

      if (Object.keys(changedSettings).length === 0) {
        setSuccessMessage('No changes to save');
        return;
      }

      await systemSettingsService.bulkUpdateSettings(changedSettings);
      setOriginalData(formData);
      setSuccessMessage('Notification settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save notification settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      <form>
        <div className="row">
          <div className="col-md-6">
            <h5 className="mb-3">Email Notifications</h5>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailTransactionCreated"
                checked={formData['NOTIFY_EMAIL_TRANSACTION_CREATED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_TRANSACTION_CREATED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailTransactionCreated">
                Transaction Created
              </label>
              <small className="text-muted d-block">Send email when a new transaction is created</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailTransactionUpdated"
                checked={formData['NOTIFY_EMAIL_TRANSACTION_UPDATED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_TRANSACTION_UPDATED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailTransactionUpdated">
                Transaction Updated
              </label>
              <small className="text-muted d-block">Send email when a transaction is updated</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailTransactionAssigned"
                checked={formData['NOTIFY_EMAIL_TRANSACTION_ASSIGNED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_TRANSACTION_ASSIGNED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailTransactionAssigned">
                Transaction Assigned
              </label>
              <small className="text-muted d-block">Send email when a transaction is assigned to a user</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailTransactionCompleted"
                checked={formData['NOTIFY_EMAIL_TRANSACTION_COMPLETED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_TRANSACTION_COMPLETED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailTransactionCompleted">
                Transaction Completed
              </label>
              <small className="text-muted d-block">Send email when a transaction is marked as completed</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailUserRegistered"
                checked={formData['NOTIFY_EMAIL_USER_REGISTERED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_USER_REGISTERED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailUserRegistered">
                User Registration
              </label>
              <small className="text-muted d-block">Send welcome email to new users</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailPasswordReset"
                checked={formData['NOTIFY_EMAIL_PASSWORD_RESET'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_EMAIL_PASSWORD_RESET', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="emailPasswordReset">
                Password Reset
              </label>
              <small className="text-muted d-block">Send email for password reset requests</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">In-App Notifications</h5>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="appTransactionCreated"
                checked={formData['NOTIFY_APP_TRANSACTION_CREATED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_APP_TRANSACTION_CREATED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="appTransactionCreated">
                Transaction Created
              </label>
              <small className="text-muted d-block">Show in-app notification for new transactions</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="appTransactionUpdated"
                checked={formData['NOTIFY_APP_TRANSACTION_UPDATED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_APP_TRANSACTION_UPDATED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="appTransactionUpdated">
                Transaction Updated
              </label>
              <small className="text-muted d-block">Show in-app notification for transaction updates</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="appTransactionAssigned"
                checked={formData['NOTIFY_APP_TRANSACTION_ASSIGNED'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_APP_TRANSACTION_ASSIGNED', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="appTransactionAssigned">
                Transaction Assigned
              </label>
              <small className="text-muted d-block">Show in-app notification for assignments</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="appSystemAlerts"
                checked={formData['NOTIFY_APP_SYSTEM_ALERTS'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_APP_SYSTEM_ALERTS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="appSystemAlerts">
                System Alerts
              </label>
              <small className="text-muted d-block">Show important system notifications</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="appMentions"
                checked={formData['NOTIFY_APP_MENTIONS'] === 'true'}
                onChange={(e) => handleInputChange('NOTIFY_APP_MENTIONS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="appMentions">
                Mentions
              </label>
              <small className="text-muted d-block">Notify when mentioned in comments</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">Notification Preferences</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Notification Retention (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['NOTIFICATION_RETENTION_DAYS'] || '30'}
                    onChange={(e) => handleInputChange('NOTIFICATION_RETENTION_DAYS', e.target.value)}
                    min="7"
                    max="365"
                  />
                  <small className="text-muted">How long to keep notifications in the system</small>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Batch Email Delay (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['BATCH_EMAIL_DELAY'] || '5'}
                    onChange={(e) => handleInputChange('BATCH_EMAIL_DELAY', e.target.value)}
                    min="0"
                    max="60"
                  />
                  <small className="text-muted">Group multiple notifications into a single email</small>
                </div>
              </div>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableDigest"
                checked={formData['ENABLE_DAILY_DIGEST'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_DAILY_DIGEST', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableDigest">
                Enable Daily Digest
              </label>
              <small className="text-muted d-block">Send a daily summary email with all activities</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enablePush"
                checked={formData['ENABLE_PUSH_NOTIFICATIONS'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_PUSH_NOTIFICATIONS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enablePush">
                Enable Push Notifications
              </label>
              <small className="text-muted d-block">Send browser push notifications (requires user permission)</small>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || JSON.stringify(formData) === JSON.stringify(originalData)}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Save Notification Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettingsTab;