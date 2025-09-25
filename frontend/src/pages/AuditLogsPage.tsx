import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StatisticsCards from '../components/auditLogs/StatisticsCards';
import AuditLogFilters from '../components/auditLogs/AuditLogFilters';
import AuditLogList from '../components/auditLogs/AuditLogList';
import AuditLogDetailModal from '../components/auditLogs/AuditLogDetailModal';
import auditLogService from '../services/api/auditLogService';
import type {
  AuditLog,
  AuditLogFilters as Filters,
  AuditLogStatistics
} from '../types/auditLog';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditLogStatistics | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 50
  });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isRTL = localStorage.getItem('language') === 'ar';

  // Load statistics
  useEffect(() => {
    loadStatistics();
  }, []);

  // Load logs when filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const stats = await auditLogService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      alert(isRTL ? 'فشل تحميل الإحصائيات' : 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getLogs(filters);
      setLogs(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert(isRTL ? 'فشل تحميل السجلات' : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    // Reset to page 1 when filters change (except for page changes)
    const shouldResetPage = !('page' in newFilters) ||
      JSON.stringify({ ...filters, page: 1 }) !== JSON.stringify({ ...newFilters, page: 1 });

    setFilters({
      ...newFilters,
      page: shouldResetPage ? 1 : newFilters.page
    });
  };

  const handleSearch = () => {
    // Trigger reload by updating filters (which triggers useEffect)
    setFilters({ ...filters, page: 1 });
    // Also reload statistics
    loadStatistics();
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      page_size: 50
    });
    loadStatistics();
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      const blob = await auditLogService.exportLogs(format, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(isRTL ? 'تم التصدير بنجاح' : 'Export successful');
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert(isRTL ? 'فشل التصدير' : 'Export failed');
    }
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{isRTL ? 'سجلات التدقيق' : 'Audit Logs'}</h2>
            <p className="text-muted">
              {isRTL
                ? 'مراقبة وتتبع جميع أنشطة النظام والتغييرات'
                : 'Monitor and track all system activities and changes'}
            </p>
          </div>
          <div className="dropdown">
            <button
              className="btn btn-primary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-download me-2"></i>
              {isRTL ? 'تصدير' : 'Export'}
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport('xlsx')}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Excel (.xlsx)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport('csv')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  CSV (.csv)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  PDF (.pdf)
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatisticsCards
          statistics={statistics}
          loading={statsLoading}
          isRTL={isRTL}
        />

        {/* Filters */}
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          isRTL={isRTL}
        />

        {/* Logs List */}
        <AuditLogList
          logs={logs}
          loading={loading}
          onLogClick={handleLogClick}
          isRTL={isRTL}
          totalCount={totalCount}
          currentPage={filters.page || 1}
          pageSize={filters.page_size || 50}
          onPageChange={handlePageChange}
        />

        {/* Detail Modal */}
        <AuditLogDetailModal
          log={selectedLog}
          show={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          isRTL={isRTL}
        />
      </div>
    </Layout>
  );
};

export default AuditLogsPage;
