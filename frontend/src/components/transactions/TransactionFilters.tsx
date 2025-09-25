import React, { useState, useEffect } from 'react';
import { TRANSACTION_STATUSES, TRANSACTION_PRIORITIES, TRANSACTION_TYPES } from '../../types/transaction';
import apiClient from '../../services/api/client';

interface TransactionFiltersProps {
  onFilterChange: (filters: any) => void;
  onExport: (format: 'excel' | 'csv') => void;
  loading?: boolean;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFilterChange,
  onExport,
  loading = false
}) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    transaction_type: '',
    assigned_to: '',
    client: '',
    department: '',
    date_from: '',
    date_to: ''
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      // Fetch users for assignment filter
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data?.results || []);

      // Fetch clients
      const clientsResponse = await apiClient.get('/users/clients/');
      setClients(clientsResponse.data?.data?.results || clientsResponse.data?.results || []);

      // Fetch departments - commented out as endpoint not yet implemented
      // const departmentsResponse = await apiClient.get('/departments/');
      // setDepartments(departmentsResponse.data?.results || []);
      setDepartments([]); // Empty for now
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      priority: '',
      transaction_type: '',
      assigned_to: '',
      client: '',
      department: '',
      date_from: '',
      date_to: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className="transaction-filters bg-white border rounded p-3 mb-3">
      <div className="row g-2">
        {/* Status Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
            {TRANSACTION_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع الأولويات' : 'All Priorities'}</option>
            {TRANSACTION_PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.transaction_type}
            onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع الأنواع' : 'All Types'}</option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.assigned_to}
            onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع المحررين' : 'All Assignees'}</option>
            <option value="unassigned">{isRTL ? 'غير معين' : 'Unassigned'}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="col-md-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            placeholder={isRTL ? 'من تاريخ' : 'From Date'}
          />
        </div>

        <div className="col-md-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            placeholder={isRTL ? 'إلى تاريخ' : 'To Date'}
          />
        </div>
      </div>

      {/* Second Row - Advanced Filters */}
      <div className="row g-2 mt-2">
        {/* Client Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع العملاء' : 'All Clients'}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
          >
            <option value="">{isRTL ? 'جميع الأقسام' : 'All Departments'}</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {isRTL ? dept.name_ar : dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="col-md-4 ms-auto">
          <div className="d-flex gap-2 justify-content-end">
            {/* Clear Filters */}
            {getActiveFilterCount() > 0 && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearFilters}
              >
                <i className="bi bi-x-circle me-1"></i>
                {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                <span className="badge bg-secondary ms-1">{getActiveFilterCount()}</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-primary dropdown-toggle"
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={loading}
              >
                <i className="bi bi-download me-1"></i>
                {isRTL ? 'تصدير' : 'Export'}
              </button>
              {showExportMenu && (
                <div className="dropdown-menu show">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onExport('excel');
                      setShowExportMenu(false);
                    }}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    {isRTL ? 'تصدير إلى Excel' : 'Export to Excel'}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onExport('csv');
                      setShowExportMenu(false);
                    }}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    {isRTL ? 'تصدير إلى CSV' : 'Export to CSV'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;