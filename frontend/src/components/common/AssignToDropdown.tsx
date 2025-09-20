import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api/client';

interface Assignee {
  id: number;
  label: string;
  value: number;
  email: string;
  role: string;
  full_name: string;
  username: string;
}

interface AssignToDropdownProps {
  value: string;
  onAssigneeSelect: (assignee: Assignee) => void;
  error?: string;
  required?: boolean;
}

const AssignToDropdown: React.FC<AssignToDropdownProps> = ({
  value,
  onAssigneeSelect,
  error,
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<Assignee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRTL = localStorage.getItem('language') === 'ar';

  // Search function
  const searchAssignees = useCallback(async (search: string) => {
    if (!search && !isOpen) return;

    setLoading(true);
    try {
      const response = await api.get(`/users/assignees_list/?search=${encodeURIComponent(search)}`);
      if (response.data.success) {
        setAssignees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignees:', error);
      setAssignees([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Debounce helper
  const timeoutRef = useRef<NodeJS.Timeout>();
  const debouncedSearchAssignees = useCallback((search: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      searchAssignees(search);
    }, 300);
  }, [searchAssignees]);

  // Load initial assignees when dropdown opens
  useEffect(() => {
    if (isOpen && assignees.length === 0 && !searchTerm) {
      searchAssignees('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (searchTerm || isOpen) {
      debouncedSearchAssignees(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Set selected assignee if value changes
  useEffect(() => {
    if (value && assignees.length > 0) {
      const assignee = assignees.find(a => a.id === parseInt(value));
      if (assignee) {
        setSelectedAssignee(assignee);
        setSearchTerm(assignee.label);
      }
    }
  }, [value, assignees]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    // If user clears the input, also clear the selection
    if (!value) {
      setSelectedAssignee(null);
    }
  };

  const handleAssigneeSelect = (assignee: Assignee) => {
    setSelectedAssignee(assignee);
    setSearchTerm(assignee.label);
    setIsOpen(false);
    onAssigneeSelect(assignee);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-danger';
      case 'editor':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <label className="form-label">
        {isRTL ? 'تعيين إلى' : 'Assign To'}
      </label>

      <div className="input-group">
        <span className="input-group-text">
          <i className="bi bi-person-check"></i>
        </span>
        <input
          type="text"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isRTL
            ? 'ابحث عن المحرر أو المسؤول بالاسم أو البريد الإلكتروني...'
            : 'Search editor or admin by name or email...'}
          required={required}
        />
        {loading && (
          <span className="input-group-text">
            <span className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </span>
          </span>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="dropdown-menu show w-100" style={{
          maxHeight: '300px',
          overflowY: 'auto',
          position: 'absolute',
          top: '100%',
          zIndex: 1050
        }}>
          {loading && assignees.length === 0 ? (
            <div className="dropdown-item disabled text-center">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              {isRTL ? 'جاري البحث...' : 'Searching...'}
            </div>
          ) : assignees.length > 0 ? (
            assignees.map((assignee) => (
              <button
                key={assignee.id}
                className={`dropdown-item ${selectedAssignee?.id === assignee.id ? 'active' : ''}`}
                onClick={() => handleAssigneeSelect(assignee)}
                type="button"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {assignee.full_name}
                      <span className={`badge ${getRoleBadgeColor(assignee.role)} ms-2`}>
                        {assignee.role.toUpperCase()}
                      </span>
                    </div>
                    <small className="text-muted">
                      <span className="me-2">{assignee.email}</span>
                    </small>
                  </div>
                </div>
              </button>
            ))
          ) : searchTerm ? (
            <div className="dropdown-item disabled text-center text-muted">
              {isRTL ? 'لم يتم العثور على مستخدمين' : 'No users found'}
            </div>
          ) : (
            <div className="dropdown-item disabled text-center text-muted">
              {isRTL ? 'ابدأ بالكتابة للبحث' : 'Start typing to search'}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="invalid-feedback d-block">{error}</div>
      )}

      {selectedAssignee && (
        <small className="form-text text-muted">
          <i className="bi bi-check-circle-fill text-success me-1"></i>
          {isRTL
            ? `تم التعيين إلى: ${selectedAssignee.full_name} (${selectedAssignee.role})`
            : `Assigned to: ${selectedAssignee.full_name} (${selectedAssignee.role})`}
        </small>
      )}
    </div>
  );
};

export default AssignToDropdown;