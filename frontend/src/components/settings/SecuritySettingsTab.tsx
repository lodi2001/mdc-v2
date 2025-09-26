import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface SecuritySettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ onChangesMade }) => {
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
      const securityCategory = categoriesData.find(cat => cat.category === 'security');

      if (securityCategory) {
        setSettings(securityCategory.settings);
        const initialData: Record<string, any> = {};
        securityCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load security settings');
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
      setSuccessMessage('Security settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save security settings');
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
            <h5 className="mb-3">Password Policy</h5>

            <div className="mb-3">
              <label className="form-label">Minimum Password Length</label>
              <input
                type="number"
                className="form-control"
                value={formData['PASSWORD_MIN_LENGTH'] || '8'}
                onChange={(e) => handleInputChange('PASSWORD_MIN_LENGTH', e.target.value)}
                min="6"
                max="32"
              />
              <small className="text-muted">Minimum number of characters required</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireUppercase"
                checked={formData['PASSWORD_REQUIRE_UPPERCASE'] === 'true'}
                onChange={(e) => handleInputChange('PASSWORD_REQUIRE_UPPERCASE', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireUppercase">
                Require Uppercase Letters
              </label>
              <small className="text-muted d-block">Password must contain at least one uppercase letter</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireLowercase"
                checked={formData['PASSWORD_REQUIRE_LOWERCASE'] === 'true'}
                onChange={(e) => handleInputChange('PASSWORD_REQUIRE_LOWERCASE', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireLowercase">
                Require Lowercase Letters
              </label>
              <small className="text-muted d-block">Password must contain at least one lowercase letter</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireNumbers"
                checked={formData['PASSWORD_REQUIRE_NUMBERS'] === 'true'}
                onChange={(e) => handleInputChange('PASSWORD_REQUIRE_NUMBERS', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireNumbers">
                Require Numbers
              </label>
              <small className="text-muted d-block">Password must contain at least one number</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireSpecial"
                checked={formData['PASSWORD_REQUIRE_SPECIAL'] === 'true'}
                onChange={(e) => handleInputChange('PASSWORD_REQUIRE_SPECIAL', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireSpecial">
                Require Special Characters
              </label>
              <small className="text-muted d-block">Password must contain at least one special character</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Password Expiry (days)</label>
              <input
                type="number"
                className="form-control"
                value={formData['PASSWORD_EXPIRY_DAYS'] || '90'}
                onChange={(e) => handleInputChange('PASSWORD_EXPIRY_DAYS', e.target.value)}
                min="0"
                max="365"
              />
              <small className="text-muted">Set to 0 to disable password expiry</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">Login Security</h5>

            <div className="mb-3">
              <label className="form-label">Maximum Login Attempts</label>
              <input
                type="number"
                className="form-control"
                value={formData['MAX_LOGIN_ATTEMPTS'] || '5'}
                onChange={(e) => handleInputChange('MAX_LOGIN_ATTEMPTS', e.target.value)}
                min="3"
                max="10"
              />
              <small className="text-muted">Lock account after this many failed attempts</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Account Lock Duration (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={formData['ACCOUNT_LOCK_DURATION'] || '30'}
                onChange={(e) => handleInputChange('ACCOUNT_LOCK_DURATION', e.target.value)}
                min="5"
                max="1440"
              />
              <small className="text-muted">How long to lock the account after max attempts</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enable2FA"
                checked={formData['ENABLE_TWO_FACTOR_AUTH'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_TWO_FACTOR_AUTH', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enable2FA">
                Enable Two-Factor Authentication
              </label>
              <small className="text-muted d-block">Allow users to enable 2FA for their accounts</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="require2FA"
                checked={formData['REQUIRE_TWO_FACTOR_AUTH'] === 'true'}
                onChange={(e) => handleInputChange('REQUIRE_TWO_FACTOR_AUTH', e.target.checked ? 'true' : 'false')}
                disabled={formData['ENABLE_TWO_FACTOR_AUTH'] !== 'true'}
              />
              <label className="form-check-label" htmlFor="require2FA">
                Require Two-Factor Authentication
              </label>
              <small className="text-muted d-block">Make 2FA mandatory for all users</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                checked={formData['ALLOW_REMEMBER_ME'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_REMEMBER_ME', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Allow "Remember Me"
              </label>
              <small className="text-muted d-block">Allow users to stay logged in</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Remember Me Duration (days)</label>
              <input
                type="number"
                className="form-control"
                value={formData['REMEMBER_ME_DURATION'] || '30'}
                onChange={(e) => handleInputChange('REMEMBER_ME_DURATION', e.target.value)}
                min="1"
                max="365"
                disabled={formData['ALLOW_REMEMBER_ME'] !== 'true'}
              />
              <small className="text-muted">How long to keep users logged in</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">File Upload Security</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Maximum File Size (MB)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['MAX_FILE_SIZE_MB'] || '10'}
                    onChange={(e) => handleInputChange('MAX_FILE_SIZE_MB', e.target.value)}
                    min="1"
                    max="100"
                  />
                  <small className="text-muted">Maximum size for file uploads</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Allowed File Extensions</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData['ALLOWED_FILE_EXTENSIONS'] || 'pdf,doc,docx,xls,xlsx,txt,jpg,png,gif'}
                    onChange={(e) => handleInputChange('ALLOWED_FILE_EXTENSIONS', e.target.value)}
                    placeholder="pdf,doc,docx,xls,xlsx"
                  />
                  <small className="text-muted">Comma-separated list of allowed file extensions</small>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="scanForVirus"
                    checked={formData['SCAN_FILES_FOR_VIRUS'] === 'true'}
                    onChange={(e) => handleInputChange('SCAN_FILES_FOR_VIRUS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="scanForVirus">
                    Enable Virus Scanning
                  </label>
                  <small className="text-muted d-block">Scan uploaded files for malware</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="encryptFiles"
                    checked={formData['ENCRYPT_UPLOADED_FILES'] === 'true'}
                    onChange={(e) => handleInputChange('ENCRYPT_UPLOADED_FILES', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="encryptFiles">
                    Encrypt Uploaded Files
                  </label>
                  <small className="text-muted d-block">Store files with encryption at rest</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="restrictExecutable"
                    checked={formData['BLOCK_EXECUTABLE_FILES'] === 'true'}
                    onChange={(e) => handleInputChange('BLOCK_EXECUTABLE_FILES', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="restrictExecutable">
                    Block Executable Files
                  </label>
                  <small className="text-muted d-block">Prevent upload of .exe, .bat, .sh files</small>
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
                  Save Security Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettingsTab;