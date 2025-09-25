import React, { useState } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getLogSeverity } from '../../types/auditLog';
import auditLogService from '../../services/api/auditLogService';
import type { AuditLog } from '../../types/auditLog';
import './auditLogs.css';

interface AuditLogListProps {
  logs: AuditLog[];
  loading: boolean;
  onLogClick: (log: AuditLog) => void;
  isRTL: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const AuditLogList: React.FC<AuditLogListProps> = ({
  logs,
  loading,
  onLogClick,
  isRTL,
  totalCount,
  currentPage,
  pageSize,
  onPageChange
}) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const toggleExpanded = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLogClass = (log: AuditLog) => {
    const severity = getLogSeverity(log.action);
    return `log-entry ${severity}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = isRTL ? ar : enUS;
    return {
      date: format(date, 'MMM dd, yyyy', { locale }),
      time: format(date, 'HH:mm:ss', { locale })
    };
  };

  const getSeverityBadgeClass = (log: AuditLog) => {
    const severity = getLogSeverity(log.action);
    const classes: Record<string, string> = {
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      error: 'bg-danger'
    };
    return classes[severity] || 'bg-secondary';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1"></i>
            <p className="mt-3">
              {isRTL ? 'لا توجد سجلات للعرض' : 'No logs to display'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>{isRTL ? 'الطابع الزمني' : 'Timestamp'}</th>
                <th>{isRTL ? 'الحدث' : 'Event'}</th>
                <th>{isRTL ? 'المستخدم' : 'User'}</th>
                <th>{isRTL ? 'عنوان IP' : 'IP Address'}</th>
                <th>{isRTL ? 'الوحدة' : 'Module'}</th>
                <th style={{ width: '100px' }}>{isRTL ? 'الحالة' : 'Status'}</th>
                <th style={{ width: '80px' }}>{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateTime = formatDate(log.created_at);
                const isExpanded = expandedLogs.has(log.id);

                return (
                  <React.Fragment key={log.id}>
                    <tr className={getLogClass(log)}>
                      <td>
                        <small className="text-muted">
                          {dateTime.date}<br />
                          {dateTime.time}
                        </small>
                      </td>
                      <td>
                        <strong>{log.action_display}</strong><br />
                        <small className="text-muted">
                          {auditLogService.getLogSummary(log)}
                        </small>
                      </td>
                      <td>{log.user_display_name}</td>
                      <td>{log.ip_address || '-'}</td>
                      <td>{log.table_name}</td>
                      <td>
                        <span className={`badge ${getSeverityBadgeClass(log)}`}>
                          {log.action_display}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleExpanded(log.id)}
                        >
                          <i className={`bi bi-${isExpanded ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 border-0">
                          <div className="log-details m-3">
                            <pre>{auditLogService.formatLogDetails(log)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  {isRTL
                    ? `عرض ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} من ${totalCount}`
                    : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}`}
                </small>
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {isRTL ? 'السابق' : 'Previous'}
                    </button>
                  </li>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => onPageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {isRTL ? 'التالي' : 'Next'}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AuditLogList;