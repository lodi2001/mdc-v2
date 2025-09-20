import React, { useState } from 'react';
import { UserFilter } from '../../types/user';

interface UserFiltersProps {
  filters: UserFilter;
  onFilterChange: (filters: UserFilter) => void;
  onApplyFilters: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFilterChange,
  onApplyFilters
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';
  const [localFilters, setLocalFilters] = useState<UserFilter>(filters);

  const handleInputChange = (field: keyof UserFilter, value: any) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters();
  };

  const handleResetFilters = () => {
    const resetFilters: UserFilter = {
      search: '',
      role: '',
      status: '',
      department: '',
      page: 1
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onApplyFilters();
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">
              {isRTL ? 'البحث عن المستخدمين' : 'Search users'}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={isRTL ? 'البحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
              value={localFilters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </div>
          
          <div className="col-12 col-sm-6 col-md-2">
            <label className="form-label">
              {isRTL ? 'الدور' : 'Role'}
            </label>
            <select
              className="form-select"
              value={localFilters.role || ''}
              onChange={(e) => handleInputChange('role', e.target.value)}
            >
              <option value="">{isRTL ? 'جميع الأدوار' : 'All Roles'}</option>
              <option value="admin">{isRTL ? 'مدير' : 'Admin'}</option>
              <option value="editor">{isRTL ? 'محرر' : 'Editor'}</option>
              <option value="client">{isRTL ? 'عميل' : 'Client'}</option>
            </select>
          </div>
          
          <div className="col-12 col-sm-6 col-md-2">
            <label className="form-label">
              {isRTL ? 'الحالة' : 'Status'}
            </label>
            <select
              className="form-select"
              value={localFilters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <option value="">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
              <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
              <option value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</option>
              <option value="suspended">{isRTL ? 'معلق' : 'Suspended'}</option>
              <option value="pending">{isRTL ? 'قيد الانتظار' : 'Pending'}</option>
            </select>
          </div>
          
          <div className="col-12 col-sm-6 col-md-2">
            <label className="form-label">
              {isRTL ? 'القسم' : 'Department'}
            </label>
            <select
              className="form-select"
              value={localFilters.department || ''}
              onChange={(e) => handleInputChange('department', e.target.value)}
            >
              <option value="">{isRTL ? 'جميع الأقسام' : 'All Departments'}</option>
              <option value="engineering">{isRTL ? 'الهندسة' : 'Engineering'}</option>
              <option value="operations">{isRTL ? 'العمليات' : 'Operations'}</option>
              <option value="management">{isRTL ? 'الإدارة' : 'Management'}</option>
              <option value="architecture">{isRTL ? 'العمارة' : 'Architecture'}</option>
              <option value="legal">{isRTL ? 'القانونية' : 'Legal'}</option>
              <option value="finance">{isRTL ? 'المالية' : 'Finance'}</option>
              <option value="external">{isRTL ? 'خارجي' : 'External'}</option>
            </select>
          </div>
          
          <div className="col-12 col-sm-6 col-md-2">
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-success flex-fill"
                onClick={handleApplyFilters}
              >
                <i className="bi bi-funnel me-2"></i>
                <span>{isRTL ? 'تطبيق' : 'Apply'}</span>
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={handleResetFilters}
                title={isRTL ? 'إعادة تعيين' : 'Reset'}
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;