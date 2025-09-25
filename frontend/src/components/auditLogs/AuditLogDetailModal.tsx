import React from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getLogSeverity } from '../../types/auditLog';
import type { AuditLog } from '../../types/auditLog';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  show: boolean;
  onClose: () => void;
  isRTL: boolean;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  show,
  onClose,
  isRTL
}) => {
  if (!show || !log) return null;

  const severity = getLogSeverity(log.action);

  const getSeverityColor = () => {
    const colors: Record<string, string> = {
      success: 'success',
      info: 'info',
      warning: 'warning',
      error: 'danger'
    };
    return colors[severity] || 'secondary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = isRTL ? ar : enUS;
    return format(date, 'PPpp', { locale });
  };

  const renderJsonValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderChanges = () => {
    if (!log.old_values && !log.new_values) {
      return null;
    }

    const changes: Array<{ field: string; old: any; new: any }> = [];

    // Collect all changed fields
    if (log.action === 'update' && log.old_values && log.new_values) {
      const allFields = new Set([
        ...Object.keys(log.old_values),
        ...Object.keys(log.new_values)
      ]);

      allFields.forEach(field => {
        const oldValue = log.old_values?.[field];
        const newValue = log.new_values?.[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field, old: oldValue, new: newValue });
        }
      });
    } else if (log.action === 'create' && log.new_values) {
      Object.entries(log.new_values).forEach(([field, value]) => {
        changes.push({ field, old: null, new: value });
      });
    } else if (log.action === 'delete' && log.old_values) {
      Object.entries(log.old_values).forEach(([field, value]) => {
        changes.push({ field, old: value, new: null });
      });
    }

    if (changes.length === 0) return null;

    return (
      <div className="mb-4">
        <h6>{isRTL ? 'التغييرات' : 'Changes'}</h6>
        <table className="table table-sm table-bordered">
          <thead>
            <tr>
              <th>{isRTL ? 'الحقل' : 'Field'}</th>
              <th>{isRTL ? 'القيمة القديمة' : 'Old Value'}</th>
              <th>{isRTL ? 'القيمة الجديدة' : 'New Value'}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, index) => (
              <tr key={index}>
                <td><code>{change.field}</code></td>
                <td>
                  {change.old !== null && (
                    <pre className="mb-0 small">{renderJsonValue(change.old)}</pre>
                  )}
                </td>
                <td>
                  {change.new !== null && (
                    <pre className="mb-0 small">{renderJsonValue(change.new)}</pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isRTL ? 'تفاصيل سجل التدقيق' : 'Audit Log Details'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {/* Basic Information */}
              <div className="mb-4">
                <div className={`alert alert-${getSeverityColor()}`}>
                  <h6 className="alert-heading">
                    <i className={`bi bi-${severity === 'error' ? 'x' : 'check'}-circle me-2`}></i>
                    {log.action_display}
                  </h6>
                  <p className="mb-0">{log.description || log.formatted_changes}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <dl className="row">
                    <dt className="col-sm-4">{isRTL ? 'المستخدم:' : 'User:'}</dt>
                    <dd className="col-sm-8">{log.user_display_name}</dd>

                    <dt className="col-sm-4">{isRTL ? 'التاريخ:' : 'Date:'}</dt>
                    <dd className="col-sm-8">{formatDate(log.created_at)}</dd>

                    <dt className="col-sm-4">{isRTL ? 'الجدول:' : 'Table:'}</dt>
                    <dd className="col-sm-8">
                      <code>{log.table_name}</code>
                      {log.record_id && ` #${log.record_id}`}
                    </dd>
                  </dl>
                </div>

                <div className="col-md-6">
                  <dl className="row">
                    <dt className="col-sm-4">{isRTL ? 'عنوان IP:' : 'IP Address:'}</dt>
                    <dd className="col-sm-8">{log.ip_address || '-'}</dd>

                    <dt className="col-sm-4">{isRTL ? 'الجلسة:' : 'Session:'}</dt>
                    <dd className="col-sm-8">
                      <small><code>{log.session_id || '-'}</code></small>
                    </dd>

                    {log.request_method && (
                      <>
                        <dt className="col-sm-4">{isRTL ? 'الطلب:' : 'Request:'}</dt>
                        <dd className="col-sm-8">
                          <span className="badge bg-secondary me-1">{log.request_method}</span>
                          <code>{log.request_path}</code>
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              {/* Changes */}
              {renderChanges()}

              {/* User Agent */}
              {log.user_agent && (
                <div className="mb-4">
                  <h6>{isRTL ? 'متصفح المستخدم' : 'User Agent'}</h6>
                  <div className="bg-light p-2 rounded">
                    <small className="text-muted">{log.user_agent}</small>
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <details className="mt-4">
                <summary className="text-muted" style={{ cursor: 'pointer' }}>
                  {isRTL ? 'البيانات الخام' : 'Raw Data'}
                </summary>
                <div className="mt-2">
                  <pre className="bg-light p-3 rounded">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              </details>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default AuditLogDetailModal;