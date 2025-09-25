import React, { useState } from 'react';
import { ACTION_OPTIONS } from '../../types/auditLog';
import type { AuditLogFilters as AuditLogFiltersType, AuditAction } from '../../types/auditLog';

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: AuditLogFiltersType) => void;
  onSearch: () => void;
  onClear: () => void;
  isRTL: boolean;
}

const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isRTL
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedActions, setSelectedActions] = useState<AuditAction[]>(filters.action || []);

  const handleActionChange = (action: AuditAction) => {
    const updated = selectedActions.includes(action)
      ? selectedActions.filter(a => a !== action)
      : [...selectedActions, action];

    setSelectedActions(updated);
    onFiltersChange({ ...filters, action: updated });
  };

  const handleInputChange = (field: keyof AuditLogFiltersType, value: any) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    // Convert local datetime to ISO string
    const date = value ? new Date(value).toISOString() : undefined;
    onFiltersChange({ ...filters, [field]: date });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    // Convert ISO string to local datetime for input
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            {isRTL ? 'التصفية' : 'Filters'}
          </h6>
          <button
            className="btn btn-sm btn-link"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className={`bi bi-chevron-${showFilters ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card-body">
          <div className="row g-3">
            {/* Action Type Filter */}
            <div className="col-md-4">
              <label className="form-label">
                {isRTL ? 'نوع الإجراء' : 'Action Type'}
              </label>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {selectedActions.length > 0
                    ? `${selectedActions.length} ${isRTL ? 'محدد' : 'selected'}`
                    : isRTL ? 'اختر الإجراءات...' : 'Select actions...'}
                </button>
                <div className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {ACTION_OPTIONS.map(option => (
                    <label key={option.value} className="dropdown-item">
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={selectedActions.includes(option.value)}
                        onChange={() => handleActionChange(option.value)}
                      />
                      {isRTL ? option.labelAr : option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* User Filter */}
            <div className="col-md-2">
              <label className="form-label">
                {isRTL ? 'المستخدم' : 'User'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={isRTL ? 'البريد الإلكتروني...' : 'Email...'}
                value={filters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
              />
            </div>

            {/* Table Name Filter */}
            <div className="col-md-2">
              <label className="form-label">
                {isRTL ? 'الجدول' : 'Table'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={isRTL ? 'اسم الجدول...' : 'Table name...'}
                value={filters.table_name || ''}
                onChange={(e) => handleInputChange('table_name', e.target.value)}
              />
            </div>

            {/* IP Address Filter */}
            <div className="col-md-2">
              <label className="form-label">
                {isRTL ? 'عنوان IP' : 'IP Address'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="192.168.x.x"
                value={filters.ip_address || ''}
                onChange={(e) => handleInputChange('ip_address', e.target.value)}
              />
            </div>

            {/* Security Relevant Filter */}
            <div className="col-md-2">
              <label className="form-label">
                {isRTL ? 'الأمان' : 'Security'}
              </label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="securityRelevant"
                  checked={filters.is_security_relevant || false}
                  onChange={(e) => handleInputChange('is_security_relevant', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="securityRelevant">
                  {isRTL ? 'ذات صلة بالأمان فقط' : 'Security relevant only'}
                </label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label">
                {isRTL ? 'نطاق التاريخ' : 'Date Range'}
              </label>
              <div className="input-group">
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formatDateForInput(filters.date_from)}
                  onChange={(e) => handleDateChange('date_from', e.target.value)}
                />
                <span className="input-group-text">-</span>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formatDateForInput(filters.date_to)}
                  onChange={(e) => handleDateChange('date_to', e.target.value)}
                />
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="col-md-6">
              <label className="form-label">&nbsp;</label>
              <div className="btn-group d-block">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    const now = new Date();
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    onFiltersChange({
                      ...filters,
                      date_from: yesterday.toISOString(),
                      date_to: now.toISOString()
                    });
                  }}
                >
                  {isRTL ? 'آخر 24 ساعة' : 'Last 24h'}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    const now = new Date();
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    onFiltersChange({
                      ...filters,
                      date_from: weekAgo.toISOString(),
                      date_to: now.toISOString()
                    });
                  }}
                >
                  {isRTL ? 'آخر 7 أيام' : 'Last 7 days'}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    const now = new Date();
                    const monthAgo = new Date(now);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    onFiltersChange({
                      ...filters,
                      date_from: monthAgo.toISOString(),
                      date_to: now.toISOString()
                    });
                  }}
                >
                  {isRTL ? 'آخر 30 يوم' : 'Last 30 days'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row mt-3">
            <div className="col-12">
              <button className="btn btn-primary me-2" onClick={onSearch}>
                <i className="bi bi-search me-2"></i>
                {isRTL ? 'بحث' : 'Search'}
              </button>
              <button className="btn btn-outline-secondary" onClick={onClear}>
                <i className="bi bi-x-circle me-2"></i>
                {isRTL ? 'مسح التصفية' : 'Clear Filters'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogFilters;