import React, { useState } from 'react';
import type { AssignmentFilter, AssignedUser } from '../../types/assignment';

interface AssignmentFiltersProps {
  onFilterChange: (filter: AssignmentFilter) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  availableEditors: AssignedUser[];
  isRTL: boolean;
}

const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  onFilterChange,
  onExport,
  availableEditors,
  isRTL
}) => {
  const [filter, setFilter] = useState<AssignmentFilter>({
    search: '',
    priority: '',
    status: '',
    assignedTo: '',
    dueDate: '',
    category: ''
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: keyof AssignmentFilter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    
    // Update active filters display
    const newActiveFilters = [];
    if (newFilter.search) newActiveFilters.push(`Search: ${newFilter.search}`);
    if (newFilter.priority) newActiveFilters.push(`Priority: ${newFilter.priority}`);
    if (newFilter.status) newActiveFilters.push(`Status: ${newFilter.status}`);
    if (newFilter.assignedTo) {
      const editor = availableEditors.find(e => e.id === Number(newFilter.assignedTo));
      if (editor) newActiveFilters.push(`Assigned to: ${editor.firstName} ${editor.lastName}`);
    }
    if (newFilter.dueDate) newActiveFilters.push(`Due: ${newFilter.dueDate}`);
    if (newFilter.category) newActiveFilters.push(`Category: ${newFilter.category}`);
    setActiveFilters(newActiveFilters);
    
    onFilterChange(newFilter);
  };

  const clearAllFilters = () => {
    const emptyFilter: AssignmentFilter = {
      search: '',
      priority: '',
      status: '',
      assignedTo: '',
      dueDate: '',
      category: ''
    };
    setFilter(emptyFilter);
    setActiveFilters([]);
    onFilterChange(emptyFilter);
  };

  const removeFilter = (filterText: string) => {
    const key = filterText.split(':')[0].toLowerCase().replace(' ', '');
    handleFilterChange(key as keyof AssignmentFilter, '');
  };

  return (
    <>
      {/* Top Action Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="dropdown">
          <button 
            className="btn btn-outline-primary dropdown-toggle" 
            data-bs-toggle="dropdown"
          >
            <i className="bi bi-funnel me-1"></i> 
            {isRTL ? 'فلتر متقدم' : 'Advanced Filter'}
          </button>
          <div className="dropdown-menu p-3" style={{ minWidth: '300px' }}>
            <h6 className="dropdown-header px-0">
              {isRTL ? 'تصفية حسب الأولوية' : 'Filter by Priority'}
            </h6>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="filterUrgent"
                checked={filter.priority === 'urgent'}
                onChange={(e) => handleFilterChange('priority', e.target.checked ? 'urgent' : '')}
              />
              <label className="form-check-label" htmlFor="filterUrgent">
                {isRTL ? 'عاجل' : 'Urgent'}
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="filterHigh"
                checked={filter.priority === 'high'}
                onChange={(e) => handleFilterChange('priority', e.target.checked ? 'high' : '')}
              />
              <label className="form-check-label" htmlFor="filterHigh">
                {isRTL ? 'عالي' : 'High'}
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="filterMedium"
                checked={filter.priority === 'medium'}
                onChange={(e) => handleFilterChange('priority', e.target.checked ? 'medium' : '')}
              />
              <label className="form-check-label" htmlFor="filterMedium">
                {isRTL ? 'متوسط' : 'Medium'}
              </label>
            </div>
            <div className="dropdown-divider"></div>
            <h6 className="dropdown-header px-0">
              {isRTL ? 'تصفية حسب الحالة' : 'Filter by Status'}
            </h6>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="filterPending"
                checked={filter.status === 'pending'}
                onChange={(e) => handleFilterChange('status', e.target.checked ? 'pending' : '')}
              />
              <label className="form-check-label" htmlFor="filterPending">
                {isRTL ? 'معلق' : 'Pending'}
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="filterInProgress"
                checked={filter.status === 'in_progress'}
                onChange={(e) => handleFilterChange('status', e.target.checked ? 'in_progress' : '')}
              />
              <label className="form-check-label" htmlFor="filterInProgress">
                {isRTL ? 'قيد التنفيذ' : 'In Progress'}
              </label>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <div className="dropdown">
            <button 
              className="btn btn-outline-primary dropdown-toggle" 
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-download me-1"></i> 
              {isRTL ? 'تصدير' : 'Export'}
            </button>
            <ul className="dropdown-menu">
              <li>
                <a className="dropdown-item" href="#" onClick={() => onExport('pdf')}>
                  <i className="bi bi-file-pdf me-2"></i> PDF
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#" onClick={() => onExport('excel')}>
                  <i className="bi bi-file-earmark-excel me-2"></i> Excel
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#" onClick={() => onExport('csv')}>
                  <i className="bi bi-file-earmark-text me-2"></i> CSV
                </a>
              </li>
            </ul>
          </div>
          
          <button className="btn btn-outline-success">
            <i className="bi bi-check-all me-1"></i> 
            {isRTL ? 'تحديث مجمع' : 'Bulk Update'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={isRTL ? 'البحث برقم المعرف أو العميل أو الوصف...' : 'Search by ID, client, or description...'}
                  value={filter.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-6 col-md-2">
              <select 
                className="form-select"
                value={filter.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">{isRTL ? 'جميع الأولويات' : 'All Priorities'}</option>
                <option value="urgent">{isRTL ? 'عاجل' : 'Urgent'}</option>
                <option value="high">{isRTL ? 'عالي' : 'High'}</option>
                <option value="medium">{isRTL ? 'متوسط' : 'Medium'}</option>
                <option value="low">{isRTL ? 'منخفض' : 'Low'}</option>
              </select>
            </div>
            
            <div className="col-6 col-md-2">
              <select 
                className="form-select"
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
                <option value="pending">{isRTL ? 'معلق' : 'Pending'}</option>
                <option value="in_progress">{isRTL ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="review">{isRTL ? 'قيد المراجعة' : 'Under Review'}</option>
                <option value="completed">{isRTL ? 'مكتمل' : 'Completed'}</option>
              </select>
            </div>
            
            <div className="col-6 col-md-2">
              <select 
                className="form-select"
                value={filter.dueDate}
                onChange={(e) => handleFilterChange('dueDate', e.target.value)}
              >
                <option value="">{isRTL ? 'جميع التواريخ' : 'All Due Dates'}</option>
                <option value="overdue">{isRTL ? 'متأخر' : 'Overdue'}</option>
                <option value="today">{isRTL ? 'مستحق اليوم' : 'Due Today'}</option>
                <option value="week">{isRTL ? 'هذا الأسبوع' : 'This Week'}</option>
                <option value="month">{isRTL ? 'هذا الشهر' : 'This Month'}</option>
              </select>
            </div>
            
            <div className="col-6 col-md-2">
              <select 
                className="form-select"
                value={filter.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              >
                <option value="">{isRTL ? 'جميع المحررين' : 'All Editors'}</option>
                {availableEditors.map(editor => (
                  <option key={editor.id} value={editor.id}>
                    {editor.firstName} {editor.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="d-flex gap-2 flex-wrap align-items-center">
                  <span className="small text-muted me-2">
                    {isRTL ? 'الفلاتر النشطة:' : 'Active filters:'}
                  </span>
                  {activeFilters.map((filterText, index) => (
                    <span key={index} className="badge bg-primary">
                      {filterText}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.65rem' }}
                        onClick={() => removeFilter(filterText)}
                      ></button>
                    </span>
                  ))}
                  <button 
                    className="btn btn-sm btn-outline-danger ms-auto"
                    onClick={clearAllFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i> 
                    {isRTL ? 'مسح الكل' : 'Clear All'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AssignmentFilters;