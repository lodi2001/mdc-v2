import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface UsersSettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const UsersSettingsTab: React.FC<UsersSettingsTabProps> = ({ onChangesMade }) => {
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
      const usersCategory = categoriesData.find(cat => cat.category === 'users');

      if (usersCategory) {
        setSettings(usersCategory.settings);
        const initialData: Record<string, any> = {};
        usersCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load user settings');
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
      setSuccessMessage('User settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save user settings');
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
            <h5 className="mb-3">User Registration</h5>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowRegistration"
                checked={formData['ALLOW_USER_REGISTRATION'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_USER_REGISTRATION', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="allowRegistration">
                Allow User Registration
              </label>
              <small className="text-muted d-block">Enable public user registration</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireEmailVerification"
                checked={formData['REQUIRE_EMAIL_VERIFICATION'] === 'true'}
                onChange={(e) => handleInputChange('REQUIRE_EMAIL_VERIFICATION', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireEmailVerification">
                Require Email Verification
              </label>
              <small className="text-muted d-block">Users must verify email before accessing the system</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireAdminApproval"
                checked={formData['REQUIRE_ADMIN_APPROVAL'] === 'true'}
                onChange={(e) => handleInputChange('REQUIRE_ADMIN_APPROVAL', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireAdminApproval">
                Require Admin Approval
              </label>
              <small className="text-muted d-block">New registrations need admin approval</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Default User Role</label>
              <select
                className="form-select"
                value={formData['DEFAULT_USER_ROLE'] || 'Client'}
                onChange={(e) => handleInputChange('DEFAULT_USER_ROLE', e.target.value)}
              >
                <option value="Client">Client</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
              <small className="text-muted">Default role for new users</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Allowed Email Domains</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData['ALLOWED_EMAIL_DOMAINS'] || ''}
                onChange={(e) => handleInputChange('ALLOWED_EMAIL_DOMAINS', e.target.value)}
                placeholder="example.com, company.org"
              />
              <small className="text-muted">Restrict registration to specific email domains (comma-separated, leave empty for all)</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">User Accounts</h5>

            <div className="mb-3">
              <label className="form-label">Maximum Users</label>
              <input
                type="number"
                className="form-control"
                value={formData['MAX_USER_COUNT'] || '0'}
                onChange={(e) => handleInputChange('MAX_USER_COUNT', e.target.value)}
                min="0"
                max="10000"
              />
              <small className="text-muted">Maximum number of users (0 for unlimited)</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Account Inactivity (days)</label>
              <input
                type="number"
                className="form-control"
                value={formData['USER_INACTIVITY_DAYS'] || '90'}
                onChange={(e) => handleInputChange('USER_INACTIVITY_DAYS', e.target.value)}
                min="0"
                max="365"
              />
              <small className="text-muted">Disable accounts after this many days of inactivity (0 to disable)</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowMultipleSessions"
                checked={formData['ALLOW_MULTIPLE_SESSIONS'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_MULTIPLE_SESSIONS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="allowMultipleSessions">
                Allow Multiple Sessions
              </label>
              <small className="text-muted d-block">Users can log in from multiple devices simultaneously</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowProfileEdit"
                checked={formData['ALLOW_PROFILE_EDIT'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_PROFILE_EDIT', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="allowProfileEdit">
                Allow Profile Editing
              </label>
              <small className="text-muted d-block">Users can edit their own profile information</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowPasswordChange"
                checked={formData['ALLOW_PASSWORD_CHANGE'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_PASSWORD_CHANGE', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="allowPasswordChange">
                Allow Password Change
              </label>
              <small className="text-muted d-block">Users can change their own password</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">User Permissions</h5>

            <div className="row">
              <div className="col-md-6">
                <h6 className="mb-2">Client Permissions</h6>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="clientViewTransactions"
                    checked={formData['CLIENT_CAN_VIEW_TRANSACTIONS'] === 'true'}
                    onChange={(e) => handleInputChange('CLIENT_CAN_VIEW_TRANSACTIONS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="clientViewTransactions">
                    View Own Transactions
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="clientDownloadDocs"
                    checked={formData['CLIENT_CAN_DOWNLOAD_DOCS'] === 'true'}
                    onChange={(e) => handleInputChange('CLIENT_CAN_DOWNLOAD_DOCS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="clientDownloadDocs">
                    Download Documents
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="clientAddComments"
                    checked={formData['CLIENT_CAN_ADD_COMMENTS'] === 'true'}
                    onChange={(e) => handleInputChange('CLIENT_CAN_ADD_COMMENTS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="clientAddComments">
                    Add Comments
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <h6 className="mb-2">Editor Permissions</h6>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editorCreateTransactions"
                    checked={formData['EDITOR_CAN_CREATE_TRANSACTIONS'] === 'true'}
                    onChange={(e) => handleInputChange('EDITOR_CAN_CREATE_TRANSACTIONS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="editorCreateTransactions">
                    Create Transactions
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editorEditTransactions"
                    checked={formData['EDITOR_CAN_EDIT_TRANSACTIONS'] === 'true'}
                    onChange={(e) => handleInputChange('EDITOR_CAN_EDIT_TRANSACTIONS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="editorEditTransactions">
                    Edit Transactions
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editorDeleteTransactions"
                    checked={formData['EDITOR_CAN_DELETE_TRANSACTIONS'] === 'true'}
                    onChange={(e) => handleInputChange('EDITOR_CAN_DELETE_TRANSACTIONS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="editorDeleteTransactions">
                    Delete Transactions
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editorAssignTransactions"
                    checked={formData['EDITOR_CAN_ASSIGN_TRANSACTIONS'] === 'true'}
                    onChange={(e) => handleInputChange('EDITOR_CAN_ASSIGN_TRANSACTIONS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="editorAssignTransactions">
                    Assign Transactions
                  </label>
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
                  Save User Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UsersSettingsTab;