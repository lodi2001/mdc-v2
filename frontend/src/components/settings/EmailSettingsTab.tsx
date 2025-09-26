import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface EmailSettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const EmailSettingsTab: React.FC<EmailSettingsTabProps> = ({ onChangesMade }) => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

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
      const emailCategory = categoriesData.find(cat => cat.category === 'email');

      if (emailCategory) {
        setSettings(emailCategory.settings);

        const initialData: Record<string, any> = {};
        emailCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load email settings');
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
      setSuccessMessage('Email settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save email settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter a test email address');
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccessMessage(null);

      // First save current settings
      await handleSave();

      // Then test email
      await systemSettingsService.testEmailConfiguration(testEmail);
      setSuccessMessage(`Test email sent successfully to ${testEmail}`);
    } catch (err) {
      setError('Failed to send test email. Please check your SMTP settings.');
      console.error(err);
    } finally {
      setTesting(false);
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
            <h5 className="mb-3">SMTP Configuration</h5>

            <div className="mb-3">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-control"
                value={formData['EMAIL_HOST'] || ''}
                onChange={(e) => handleInputChange('EMAIL_HOST', e.target.value)}
                placeholder="smtp.gmail.com"
              />
              <small className="text-muted">SMTP server hostname</small>
            </div>

            <div className="mb-3">
              <label className="form-label">SMTP Port</label>
              <input
                type="number"
                className="form-control"
                value={formData['EMAIL_PORT'] || '587'}
                onChange={(e) => handleInputChange('EMAIL_PORT', e.target.value)}
                placeholder="587"
              />
              <small className="text-muted">Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)</small>
            </div>

            <div className="mb-3">
              <label className="form-label">SMTP Username</label>
              <input
                type="text"
                className="form-control"
                value={formData['EMAIL_HOST_USER'] || ''}
                onChange={(e) => handleInputChange('EMAIL_HOST_USER', e.target.value)}
                placeholder="your-email@example.com"
              />
              <small className="text-muted">Authentication username for SMTP</small>
            </div>

            <div className="mb-3">
              <label className="form-label">SMTP Password</label>
              <input
                type="password"
                className="form-control"
                value={formData['EMAIL_HOST_PASSWORD'] || ''}
                onChange={(e) => handleInputChange('EMAIL_HOST_PASSWORD', e.target.value)}
                placeholder="Enter password"
              />
              <small className="text-muted">Authentication password for SMTP</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="useTLS"
                checked={formData['EMAIL_USE_TLS'] === 'true'}
                onChange={(e) => handleInputChange('EMAIL_USE_TLS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="useTLS">
                Use TLS
              </label>
              <small className="text-muted d-block">Enable TLS encryption (recommended for port 587)</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="useSSL"
                checked={formData['EMAIL_USE_SSL'] === 'true'}
                onChange={(e) => handleInputChange('EMAIL_USE_SSL', e.target.checked ? 'true' : 'false')}
                disabled={formData['EMAIL_USE_TLS'] === 'true'}
              />
              <label className="form-check-label" htmlFor="useSSL">
                Use SSL
              </label>
              <small className="text-muted d-block">Enable SSL encryption (for port 465)</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">Email Settings</h5>

            <div className="mb-3">
              <label className="form-label">From Email Address</label>
              <input
                type="email"
                className="form-control"
                value={formData['DEFAULT_FROM_EMAIL'] || ''}
                onChange={(e) => handleInputChange('DEFAULT_FROM_EMAIL', e.target.value)}
                placeholder="noreply@example.com"
              />
              <small className="text-muted">Default sender email address</small>
            </div>

            <div className="mb-3">
              <label className="form-label">From Name</label>
              <input
                type="text"
                className="form-control"
                value={formData['DEFAULT_FROM_NAME'] || ''}
                onChange={(e) => handleInputChange('DEFAULT_FROM_NAME', e.target.value)}
                placeholder="MDC System"
              />
              <small className="text-muted">Name shown as email sender</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Reply-To Email</label>
              <input
                type="email"
                className="form-control"
                value={formData['REPLY_TO_EMAIL'] || ''}
                onChange={(e) => handleInputChange('REPLY_TO_EMAIL', e.target.value)}
                placeholder="support@example.com"
              />
              <small className="text-muted">Email address for replies</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Email Subject Prefix</label>
              <input
                type="text"
                className="form-control"
                value={formData['EMAIL_SUBJECT_PREFIX'] || ''}
                onChange={(e) => handleInputChange('EMAIL_SUBJECT_PREFIX', e.target.value)}
                placeholder="[MDC]"
              />
              <small className="text-muted">Prefix added to all email subjects</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableEmails"
                checked={formData['ENABLE_EMAIL_NOTIFICATIONS'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_EMAIL_NOTIFICATIONS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableEmails">
                Enable Email Notifications
              </label>
              <small className="text-muted d-block">Master switch for all email notifications</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="debugEmails"
                checked={formData['EMAIL_DEBUG_MODE'] === 'true'}
                onChange={(e) => handleInputChange('EMAIL_DEBUG_MODE', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="debugEmails">
                Debug Mode
              </label>
              <small className="text-muted d-block">Log emails instead of sending (for testing)</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">Test Email Configuration</h5>
            <div className="card bg-light">
              <div className="card-body">
                <p className="mb-3">Send a test email to verify your configuration is working correctly.</p>
                <div className="row align-items-end">
                  <div className="col-md-8">
                    <label className="form-label">Test Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={handleTestEmail}
                      disabled={testing || !testEmail}
                    >
                      {testing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-envelope-check me-2"></i>
                          Send Test Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
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
                  Save Email Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmailSettingsTab;