import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemSetting } from '../../services/systemSettingsService';

interface TransactionsSettingsTabProps {
  onChangesMade: (hasChanges: boolean) => void;
}

const TransactionsSettingsTab: React.FC<TransactionsSettingsTabProps> = ({ onChangesMade }) => {
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
      const transactionsCategory = categoriesData.find(cat => cat.category === 'transactions');

      if (transactionsCategory) {
        setSettings(transactionsCategory.settings);
        const initialData: Record<string, any> = {};
        transactionsCategory.settings.forEach(setting => {
          initialData[setting.key] = setting.value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (err) {
      setError('Failed to load transaction settings');
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
      setSuccessMessage('Transaction settings saved successfully');
      onChangesMade(false);
    } catch (err) {
      setError('Failed to save transaction settings');
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
            <h5 className="mb-3">Transaction Configuration</h5>

            <div className="mb-3">
              <label className="form-label">Transaction ID Prefix</label>
              <input
                type="text"
                className="form-control"
                value={formData['TRANSACTION_ID_PREFIX'] || 'TRX'}
                onChange={(e) => handleInputChange('TRANSACTION_ID_PREFIX', e.target.value)}
                placeholder="TRX"
                maxLength={10}
              />
              <small className="text-muted">Prefix for transaction IDs (e.g., TRX-12345)</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Transaction ID Format</label>
              <select
                className="form-select"
                value={formData['TRANSACTION_ID_FORMAT'] || 'PREFIX-NUMBER'}
                onChange={(e) => handleInputChange('TRANSACTION_ID_FORMAT', e.target.value)}
              >
                <option value="PREFIX-NUMBER">PREFIX-NUMBER (TRX-12345)</option>
                <option value="PREFIX-YEAR-NUMBER">PREFIX-YEAR-NUMBER (TRX-2024-12345)</option>
                <option value="PREFIX-DATE-NUMBER">PREFIX-DATE-NUMBER (TRX-20240101-12345)</option>
                <option value="UUID">UUID (Random Unique ID)</option>
              </select>
              <small className="text-muted">Format for generating transaction IDs</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Default Status</label>
              <select
                className="form-select"
                value={formData['DEFAULT_TRANSACTION_STATUS'] || 'pending'}
                onChange={(e) => handleInputChange('DEFAULT_TRANSACTION_STATUS', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
              </select>
              <small className="text-muted">Default status for new transactions</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Transaction Expiry (days)</label>
              <input
                type="number"
                className="form-control"
                value={formData['TRANSACTION_EXPIRY_DAYS'] || '0'}
                onChange={(e) => handleInputChange('TRANSACTION_EXPIRY_DAYS', e.target.value)}
                min="0"
                max="365"
              />
              <small className="text-muted">Auto-archive transactions after this many days (0 to disable)</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireDescription"
                checked={formData['REQUIRE_TRANSACTION_DESCRIPTION'] === 'true'}
                onChange={(e) => handleInputChange('REQUIRE_TRANSACTION_DESCRIPTION', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireDescription">
                Require Description
              </label>
              <small className="text-muted d-block">Make transaction description mandatory</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="requireAttachment"
                checked={formData['REQUIRE_TRANSACTION_ATTACHMENT'] === 'true'}
                onChange={(e) => handleInputChange('REQUIRE_TRANSACTION_ATTACHMENT', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="requireAttachment">
                Require Attachment
              </label>
              <small className="text-muted d-block">At least one attachment required per transaction</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">Workflow Settings</h5>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableAutoAssignment"
                checked={formData['ENABLE_AUTO_ASSIGNMENT'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_AUTO_ASSIGNMENT', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableAutoAssignment">
                Enable Auto-Assignment
              </label>
              <small className="text-muted d-block">Automatically assign transactions to available editors</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Auto-Assignment Method</label>
              <select
                className="form-select"
                value={formData['AUTO_ASSIGNMENT_METHOD'] || 'round_robin'}
                onChange={(e) => handleInputChange('AUTO_ASSIGNMENT_METHOD', e.target.value)}
                disabled={formData['ENABLE_AUTO_ASSIGNMENT'] !== 'true'}
              >
                <option value="round_robin">Round Robin</option>
                <option value="least_loaded">Least Loaded</option>
                <option value="by_category">By Category</option>
                <option value="by_priority">By Priority</option>
              </select>
              <small className="text-muted">Method for automatic assignment</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableApprovalWorkflow"
                checked={formData['ENABLE_APPROVAL_WORKFLOW'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_APPROVAL_WORKFLOW', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableApprovalWorkflow">
                Enable Approval Workflow
              </label>
              <small className="text-muted d-block">Require approval before completing transactions</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Approval Levels</label>
              <select
                className="form-select"
                value={formData['APPROVAL_LEVELS'] || '1'}
                onChange={(e) => handleInputChange('APPROVAL_LEVELS', e.target.value)}
                disabled={formData['ENABLE_APPROVAL_WORKFLOW'] !== 'true'}
              >
                <option value="1">Single Approval</option>
                <option value="2">Two-Level Approval</option>
                <option value="3">Three-Level Approval</option>
              </select>
              <small className="text-muted">Number of approval levels required</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowReassignment"
                checked={formData['ALLOW_REASSIGNMENT'] === 'true'}
                onChange={(e) => handleInputChange('ALLOW_REASSIGNMENT', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="allowReassignment">
                Allow Reassignment
              </label>
              <small className="text-muted d-block">Allow transactions to be reassigned to different users</small>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="enableSLA"
                checked={formData['ENABLE_SLA_TRACKING'] === 'true'}
                onChange={(e) => handleInputChange('ENABLE_SLA_TRACKING', e.target.checked ? 'true' : 'false')}
              />
              <label className="form-check-label" htmlFor="enableSLA">
                Enable SLA Tracking
              </label>
              <small className="text-muted d-block">Track service level agreements for transactions</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">Transaction Limits</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Maximum Attachments per Transaction</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['MAX_ATTACHMENTS_PER_TRANSACTION'] || '10'}
                    onChange={(e) => handleInputChange('MAX_ATTACHMENTS_PER_TRANSACTION', e.target.value)}
                    min="1"
                    max="100"
                  />
                  <small className="text-muted">Maximum number of files per transaction</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Maximum Comments per Transaction</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['MAX_COMMENTS_PER_TRANSACTION'] || '100'}
                    onChange={(e) => handleInputChange('MAX_COMMENTS_PER_TRANSACTION', e.target.value)}
                    min="10"
                    max="1000"
                  />
                  <small className="text-muted">Maximum number of comments allowed</small>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Description Character Limit</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['DESCRIPTION_CHAR_LIMIT'] || '5000'}
                    onChange={(e) => handleInputChange('DESCRIPTION_CHAR_LIMIT', e.target.value)}
                    min="100"
                    max="10000"
                  />
                  <small className="text-muted">Maximum characters in description field</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Comment Character Limit</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData['COMMENT_CHAR_LIMIT'] || '1000'}
                    onChange={(e) => handleInputChange('COMMENT_CHAR_LIMIT', e.target.value)}
                    min="50"
                    max="5000"
                  />
                  <small className="text-muted">Maximum characters per comment</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">Transaction Features</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableDrafts"
                    checked={formData['ENABLE_DRAFTS'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_DRAFTS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableDrafts">
                    Enable Draft Transactions
                  </label>
                  <small className="text-muted d-block">Allow saving transactions as drafts</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableDuplication"
                    checked={formData['ENABLE_TRANSACTION_DUPLICATION'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_TRANSACTION_DUPLICATION', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableDuplication">
                    Enable Transaction Duplication
                  </label>
                  <small className="text-muted d-block">Allow duplicating existing transactions</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableBulkImport"
                    checked={formData['ENABLE_BULK_IMPORT'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_BULK_IMPORT', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableBulkImport">
                    Enable Bulk Import
                  </label>
                  <small className="text-muted d-block">Allow importing multiple transactions via CSV/Excel</small>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableVersioning"
                    checked={formData['ENABLE_VERSION_CONTROL'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_VERSION_CONTROL', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableVersioning">
                    Enable Version Control
                  </label>
                  <small className="text-muted d-block">Track changes and maintain version history</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableTags"
                    checked={formData['ENABLE_TRANSACTION_TAGS'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_TRANSACTION_TAGS', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableTags">
                    Enable Tags
                  </label>
                  <small className="text-muted d-block">Allow tagging transactions for categorization</small>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableQRCode"
                    checked={formData['ENABLE_QR_CODE'] === 'true'}
                    onChange={(e) => handleInputChange('ENABLE_QR_CODE', e.target.checked ? 'true' : 'false')}
                  />
                  <label className="form-check-label" htmlFor="enableQRCode">
                    Enable QR Codes
                  </label>
                  <small className="text-muted d-block">Generate QR codes for transactions</small>
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
                  Save Transaction Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TransactionsSettingsTab;