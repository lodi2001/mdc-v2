import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface GeneralSettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ onChangesMade }) => {
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
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    onChangesMade(hasChanges);
  }, [formData, originalData, onChangesMade]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const categoriesData = await systemSettingsService.getSettingsByCategory();
      const generalCategory = categoriesData.find(cat => cat.category === 'general');

      if (generalCategory) {
        setSettings(generalCategory.settings);

        // Initialize form data
        const initialData: Record<string, any> = {};
        generalCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load settings');
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

      // Only send changed settings
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
      setSuccessMessage('Settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all general settings to their default values?')) {
      try {
        setSaving(true);
        await systemSettingsService.resetToDefaults('general');
        await loadSettings();
        setSuccessMessage('Settings reset to defaults');
      } catch (err) {
        setError('Failed to reset settings');
        console.error(err);
      } finally {
        setSaving(false);
      }
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
            <h5 className="mb-3">Company Information</h5>

            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                value={formData['COMPANY_NAME'] || ''}
                onChange={(e) => handleInputChange('COMPANY_NAME', e.target.value)}
                placeholder="Enter company name"
              />
              <small className="text-muted">The name of your organization</small>
            </div>

            <div className="mb-3">
              <label className="form-label">System Title</label>
              <input
                type="text"
                className="form-control"
                value={formData['SYSTEM_TITLE'] || ''}
                onChange={(e) => handleInputChange('SYSTEM_TITLE', e.target.value)}
                placeholder="MDC Transaction Tracking System"
              />
              <small className="text-muted">Title shown in the browser and reports</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Support Email</label>
              <input
                type="email"
                className="form-control"
                value={formData['SUPPORT_EMAIL'] || ''}
                onChange={(e) => handleInputChange('SUPPORT_EMAIL', e.target.value)}
                placeholder="support@example.com"
              />
              <small className="text-muted">Contact email for support requests</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">Regional Settings</h5>

            <div className="mb-3">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={formData['TIMEZONE'] || 'UTC'}
                onChange={(e) => handleInputChange('TIMEZONE', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Australia/Sydney">Sydney (AEDT)</option>
              </select>
              <small className="text-muted">Default timezone for the system</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Default Language</label>
              <select
                className="form-select"
                value={formData['DEFAULT_LANGUAGE'] || 'en'}
                onChange={(e) => handleInputChange('DEFAULT_LANGUAGE', e.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
              <small className="text-muted">Default system language</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Date Format</label>
              <select
                className="form-select"
                value={formData['DATE_FORMAT'] || 'DD/MM/YYYY'}
                onChange={(e) => handleInputChange('DATE_FORMAT', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
              <small className="text-muted">Date format used throughout the system</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Time Format</label>
              <select
                className="form-select"
                value={formData['TIME_FORMAT'] || '24h'}
                onChange={(e) => handleInputChange('TIME_FORMAT', e.target.value)}
              >
                <option value="24h">24-hour (14:30)</option>
                <option value="12h">12-hour (2:30 PM)</option>
              </select>
              <small className="text-muted">Time format preference</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <h5 className="mb-3">System Preferences</h5>

            <div className="mb-3">
              <label className="form-label">Items per Page</label>
              <select
                className="form-select"
                value={formData['ITEMS_PER_PAGE'] || '20'}
                onChange={(e) => handleInputChange('ITEMS_PER_PAGE', e.target.value)}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <small className="text-muted">Default number of items shown in lists</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Session Timeout (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={formData['SESSION_TIMEOUT'] || '30'}
                onChange={(e) => handleInputChange('SESSION_TIMEOUT', e.target.value)}
                min="5"
                max="1440"
              />
              <small className="text-muted">Auto-logout after inactivity</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">System Features</h5>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableRegistration"
                checked={formData['ENABLE_USER_REGISTRATION'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_USER_REGISTRATION', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableRegistration">
                Enable User Registration
              </label>
              <small className="text-muted d-block">Allow new users to register</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableNotifications"
                checked={formData['ENABLE_NOTIFICATIONS'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_NOTIFICATIONS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableNotifications">
                Enable System Notifications
              </label>
              <small className="text-muted d-block">Send email and in-app notifications</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableFileUploads"
                checked={formData['ENABLE_FILE_UPLOADS'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_FILE_UPLOADS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableFileUploads">
                Enable File Uploads
              </label>
              <small className="text-muted d-block">Allow users to upload attachments</small>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reset to Defaults
            </button>
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsTab;