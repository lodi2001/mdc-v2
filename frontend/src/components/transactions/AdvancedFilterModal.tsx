import React, { useState, useEffect } from 'react';
import { TRANSACTION_STATUSES, TRANSACTION_PRIORITIES, TRANSACTION_TYPES } from '../../types/transaction';
import apiClient from '../../services/api/client';

interface AdvancedFilterModalProps {
  show: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters?: any;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  show,
  onClose,
  onApply,
  currentFilters = {}
}) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    transaction_type: '',
    assigned_to: '',
    created_by: '',
    client: '',
    department: '',
    tags: '',
    date_from: '',
    date_to: '',
    due_date_from: '',
    due_date_to: '',
    has_attachments: '',
    ...currentFilters
  });

  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    if (show) {
      fetchFilterOptions();
    }
  }, [show]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, ...currentFilters }));
  }, [currentFilters]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch all filter options in parallel
      const [usersRes, clientsRes, departmentsRes, tagsRes] = await Promise.all([
        apiClient.get('/users/'),
        apiClient.get('/clients/'),
        apiClient.get('/departments/'),
        apiClient.get('/transactions/tags/')
      ]);

      setUsers(usersRes.data?.results || []);
      setClients(clientsRes.data?.results || []);
      setDepartments(departmentsRes.data?.results || []);
      setTags(tagsRes.data?.tags || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    // Remove empty filters before applying
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onApply(activeFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      priority: '',
      transaction_type: '',
      assigned_to: '',
      created_by: '',
      client: '',
      department: '',
      tags: '',
      date_from: '',
      date_to: '',
      due_date_from: '',
      due_date_to: '',
      has_attachments: ''
    };
    setFilters(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== null).length;
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal-backdrop fade show" onClick={onClose}></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-funnel me-2"></i>
                {isRTL ? 'الفلاتر المتقدمة' : 'Advanced Filters'}
                {getActiveFilterCount() > 0 && (
                  <span className="badge bg-primary ms-2">{getActiveFilterCount()}</span>
                )}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                {/* Basic Filters */}
                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
                    {TRANSACTION_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {isRTL ? status.labelAr : status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <option value="">{isRTL ? 'جميع الأولويات' : 'All Priorities'}</option>
                    {TRANSACTION_PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {isRTL ? priority.labelAr : priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'نوع المعاملة' : 'Transaction Type'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.transaction_type}
                    onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
                  >
                    <option value="">{isRTL ? 'جميع الأنواع' : 'All Types'}</option>
                    {TRANSACTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {isRTL ? type.labelAr : type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'القسم' : 'Department'}
                  </label>
                  <select
                    className="form-select"
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

                {/* Assignment Filters */}
                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'معين إلى' : 'Assigned To'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.assigned_to}
                    onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                  >
                    <option value="">{isRTL ? 'جميع المحررين' : 'All Assignees'}</option>
                    <option value="unassigned">{isRTL ? 'غير معين' : 'Unassigned'}</option>
                    {users.filter(u => u.role === 'editor' || u.role === 'admin').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'أنشئ بواسطة' : 'Created By'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.created_by}
                    onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  >
                    <option value="">{isRTL ? 'الجميع' : 'All Users'}</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Filter */}
                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'العميل' : 'Client'}
                  </label>
                  <select
                    className="form-select"
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

                {/* Tags Filter */}
                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'الوسوم' : 'Tags'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={filters.tags}
                    onChange={(e) => handleFilterChange('tags', e.target.value)}
                    placeholder={isRTL ? 'أدخل الوسوم مفصولة بفواصل' : 'Enter tags separated by commas'}
                  />
                </div>

                {/* Date Filters */}
                <div className="col-12">
                  <h6 className="text-muted mb-3">
                    {isRTL ? 'تصفية حسب التواريخ' : 'Date Filters'}
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'تاريخ الإنشاء من' : 'Created From'}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'تاريخ الإنشاء إلى' : 'Created To'}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'تاريخ الاستحقاق من' : 'Due Date From'}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.due_date_from}
                    onChange={(e) => handleFilterChange('due_date_from', e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'تاريخ الاستحقاق إلى' : 'Due Date To'}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.due_date_to}
                    onChange={(e) => handleFilterChange('due_date_to', e.target.value)}
                  />
                </div>

                {/* Additional Filters */}
                <div className="col-md-6">
                  <label className="form-label">
                    {isRTL ? 'المرفقات' : 'Attachments'}
                  </label>
                  <select
                    className="form-select"
                    value={filters.has_attachments}
                    onChange={(e) => handleFilterChange('has_attachments', e.target.value)}
                  >
                    <option value="">{isRTL ? 'الجميع' : 'All'}</option>
                    <option value="true">{isRTL ? 'مع مرفقات' : 'With Attachments'}</option>
                    <option value="false">{isRTL ? 'بدون مرفقات' : 'Without Attachments'}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={getActiveFilterCount() === 0}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                {isRTL ? 'إعادة تعيين' : 'Reset'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
              >
                <i className="bi bi-check-lg me-2"></i>
                {isRTL ? 'تطبيق الفلاتر' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilterModal;