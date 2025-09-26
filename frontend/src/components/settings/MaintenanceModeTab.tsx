import React, { useState, useEffect } from 'react';
import systemSettingsService, { SystemMaintenanceMode } from '../../services/systemSettingsService';

const MaintenanceModeTab: React.FC = () => {
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [formData, setFormData] = useState({
    is_enabled: false,
    message: '',
    message_ar: '',
    start_time: '',
    end_time: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMaintenanceStatus();
  }, []);

  const loadMaintenanceStatus = async () => {
    try {
      setLoading(true);
      const status = await systemSettingsService.getCurrentMaintenanceStatus();

      if (status.maintenance_mode) {
        setMaintenanceData(status.maintenance_mode);
        setFormData({
          is_enabled: status.maintenance_mode.is_enabled,
          message: status.maintenance_mode.message || '',
          message_ar: status.maintenance_mode.message_ar || '',
          start_time: status.maintenance_mode.start_time || '',
          end_time: status.maintenance_mode.end_time || ''
        });
      }
    } catch (err) {
      setError('Failed to load maintenance status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleMaintenance = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (!formData.is_enabled) {
        // Enable maintenance mode
        await systemSettingsService.enableMaintenanceMode(
          formData.message || 'System is under maintenance',
          formData.message_ar
        );
        setSuccessMessage('Maintenance mode enabled');
        setFormData(prev => ({ ...prev, is_enabled: true }));
      } else {
        // Disable maintenance mode
        await systemSettingsService.disableMaintenanceMode();
        setSuccessMessage('Maintenance mode disabled');
        setFormData(prev => ({ ...prev, is_enabled: false }));
      }

      await loadMaintenanceStatus();
    } catch (err) {
      setError('Failed to toggle maintenance mode');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (maintenanceData?.id) {
        await systemSettingsService.updateMaintenanceMode(maintenanceData.id, {
          message: formData.message,
          message_ar: formData.message_ar,
          start_time: formData.start_time,
          end_time: formData.end_time
        });
        setSuccessMessage('Maintenance message updated');
        await loadMaintenanceStatus();
      }
    } catch (err) {
      setError('Failed to update maintenance message');
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

      <div className="row">
        <div className="col-md-12">
          <div className={`card ${formData.is_enabled ? 'border-warning' : 'border-success'} mb-4`}>
            <div className={`card-body ${formData.is_enabled ? 'bg-warning bg-opacity-10' : 'bg-success bg-opacity-10'}`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className={`mb-2 ${formData.is_enabled ? 'text-warning' : 'text-success'}`}>
                    <i className={`bi ${formData.is_enabled ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                    Maintenance Mode is {formData.is_enabled ? 'ACTIVE' : 'INACTIVE'}
                  </h5>
                  <p className="mb-0 text-muted">
                    {formData.is_enabled
                      ? 'Users cannot access the system. Only administrators can log in.'
                      : 'System is operating normally. All users can access the system.'}
                  </p>
                </div>
                <button
                  className={`btn ${formData.is_enabled ? 'btn-success' : 'btn-warning'}`}
                  onClick={handleToggleMaintenance}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bi ${formData.is_enabled ? 'bi-play-circle' : 'bi-pause-circle'} me-2`}></i>
                      {formData.is_enabled ? 'Disable Maintenance' : 'Enable Maintenance'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form>
        <div className="row">
          <div className="col-md-6">
            <h5 className="mb-3">Maintenance Messages</h5>

            <div className="mb-3">
              <label className="form-label">Message (English)</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="System is currently under maintenance. We'll be back soon!"
              />
              <small className="text-muted">Message shown to users during maintenance</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Message (Arabic)</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.message_ar}
                onChange={(e) => handleInputChange('message_ar', e.target.value)}
                placeholder="النظام قيد الصيانة حالياً. سنعود قريباً!"
                dir="rtl"
              />
              <small className="text-muted">Arabic message for Arabic users</small>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="mb-3">Schedule (Optional)</h5>

            <div className="mb-3">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
              <small className="text-muted">When to automatically enable maintenance mode</small>
            </div>

            <div className="mb-3">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
              <small className="text-muted">When to automatically disable maintenance mode</small>
            </div>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Schedule feature is optional. If set, maintenance mode will automatically enable/disable at the specified times.
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h5 className="mb-3">Preview</h5>
            <div className="card bg-light">
              <div className="card-body text-center py-5">
                <i className="bi bi-tools text-warning" style={{ fontSize: '3rem' }}></i>
                <h3 className="mt-3">System Maintenance</h3>
                <p className="lead">
                  {formData.message || 'System is currently under maintenance. We\'ll be back soon!'}
                </p>
                {formData.message_ar && (
                  <p className="lead" dir="rtl">
                    {formData.message_ar}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdateMessage}
              disabled={saving || !maintenanceData?.id}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Update Message
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceModeTab;