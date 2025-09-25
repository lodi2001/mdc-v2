import React, { useState } from 'react';
import type { Assignment, AssignmentPriority, AssignmentStatus } from '../../types/assignment';
import assignmentService from '../../services/assignmentService';
import apiClient from '../../services/api/client';

interface AssignmentTableProps {
  assignments: Assignment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAssignmentClick: (assignment: Assignment) => void;
  onStatusUpdate: (id: string, status: AssignmentStatus) => void;
  onAssignmentUpdate?: () => void;
  onSort: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  isRTL: boolean;
  loading?: boolean;
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  selectedIds,
  onSelectionChange,
  onAssignmentClick,
  onStatusUpdate,
  onAssignmentUpdate,
  onSort,
  sortField,
  sortDirection,
  isRTL,
  loading = false
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [newStatus, setNewStatus] = useState<AssignmentStatus>('pending');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(assignments.map(a => a.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const fetchAvailableUsers = React.useCallback(async () => {
    try {
      // Use the assignment service to get only editors and admins (excluding clients)
      const users = await assignmentService.getAvailableAssignees();
      console.log('Available assignees:', users); // Debug log

      // Filter out duplicates based on user.id and ensure valid IDs
      const uniqueUsers = users.filter((user: any, index: number, self: any[]) => {
        return user && user.id &&
               self.findIndex((u: any) => u.id === user.id) === index;
      });

      setAvailableUsers(uniqueUsers);
    } catch (error) {
      console.error('Failed to fetch available assignees:', error);
      setAvailableUsers([]); // Set empty array on error
    }
  }, []);

  // Load users on component mount
  React.useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  const handleStatusUpdate = async () => {
    if (!selectedAssignment) return;

    setUpdating(true);
    try {
      // The assignment.id is already the database ID (as a string), just use it
      const transactionId = selectedAssignment.id;

      const response = await apiClient.post(
        `/transactions/${transactionId}/status/`,
        { status: newStatus }
      );

      onStatusUpdate(selectedAssignment.id, newStatus);
      setShowStatusModal(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(isRTL ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReassign = async () => {
    if (!newAssigneeId) return;

    setUpdating(true);
    try {
      // Check if bulk reassignment or single
      if (selectedIds.length > 0) {
        // Bulk reassignment
        // The IDs are already database IDs as strings, just convert to numbers
        const transactionIds = selectedIds.map(id => Number(id));

        // Use assignmentService for bulk reassignment
        await assignmentService.bulkReassignTransactions(
          transactionIds,
          newAssigneeId,
          '' // reason can be empty
        );

        onSelectionChange([]);
        setSelectAll(false);
        setShowAssignModal(false);
        setNewAssigneeId('');
        alert(isRTL ? 'تم إعادة التعيين بنجاح' : 'Reassigned successfully');
        // Call callback to refresh assignments from backend
        onAssignmentUpdate?.();
      } else if (selectedAssignment) {
        // Single reassignment
        // The assignment.id is already the database ID (as a string), just convert to number
        const transactionId = Number(selectedAssignment.id);

        // Use assignmentService for single reassignment
        await assignmentService.reassignTransaction(
          transactionId,
          newAssigneeId,
          '' // reason can be empty
        );

        // Call callback to refresh assignments from backend
        onAssignmentUpdate?.();
        setShowAssignModal(false);
        setSelectedAssignment(null);
        setNewAssigneeId('');
        alert(isRTL ? 'تم إعادة التعيين بنجاح' : 'Reassigned successfully');
      }
    } catch (error) {
      console.error('Failed to reassign:', error);
      alert(isRTL ? 'حدث خطأ أثناء إعادة التعيين' : 'An error occurred while reassigning');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkStatusUpdate = async (status: AssignmentStatus) => {
    if (selectedIds.length === 0) return;

    const confirmMessage = isRTL ?
      `هل تريد تحديث حالة ${selectedIds.length} مهمة؟` :
      `Update status for ${selectedIds.length} tasks?`;

    if (!window.confirm(confirmMessage)) return;

    setUpdating(true);
    try {
      // The IDs are already database IDs as strings, just convert to numbers
      const transactionIds = selectedIds.map(id => Number(id));

      await apiClient.post(
        '/transactions/bulk-operations/',
        {
          operation: 'change_status',
          transaction_ids: transactionIds,
          status: status
        }
      );

      // Update all selected assignments
      selectedIds.forEach(id => {
        onStatusUpdate(id, status);
      });
      onSelectionChange([]);
      setSelectAll(false);
      alert(isRTL ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(isRTL ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkReassign = () => {
    if (selectedIds.length === 0) return;

    // For bulk reassign, we'll show a modal similar to single reassign
    // but apply to all selected items
    setShowAssignModal(true);
    // We'll handle bulk reassign in the modal
  };

  const getPriorityBadge = (priority: AssignmentPriority) => {
    const badges = {
      urgent: { color: 'danger', icon: 'bi-exclamation-triangle-fill' },
      high: { color: 'warning', icon: 'bi-exclamation-circle' },
      normal: { color: 'info', icon: 'bi-dash-circle' },
      medium: { color: 'info', icon: 'bi-dash-circle' },
      low: { color: 'secondary', icon: 'bi-dash' }
    };
    const badge = badges[priority] || badges.medium;
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`bi ${badge.icon} me-1`}></i>
        {isRTL ?
          ({'urgent': 'عاجل', 'high': 'عالي', 'normal': 'عادي', 'medium': 'متوسط', 'low': 'منخفض'}[priority]) :
          priority.charAt(0).toUpperCase() + priority.slice(1)
        }
      </span>
    );
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    const badges = {
      pending: { color: 'warning', text: isRTL ? 'معلق' : 'Pending' },
      in_progress: { color: 'primary', text: isRTL ? 'قيد التنفيذ' : 'In Progress' },
      review: { color: 'info', text: isRTL ? 'قيد المراجعة' : 'Under Review' },
      completed: { color: 'success', text: isRTL ? 'مكتمل' : 'Completed' },
      on_hold: { color: 'secondary', text: isRTL ? 'معلق' : 'On Hold' },
      cancelled: { color: 'danger', text: isRTL ? 'ملغي' : 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`badge bg-${badge.color}-subtle text-${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const today = new Date();
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-danger">
          {d.toLocaleDateString()}
          <small className="d-block">{isRTL ? 'متأخر' : 'Overdue'}</small>
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="text-warning">
          {isRTL ? 'اليوم' : 'Today'}
        </span>
      );
    } else if (diffDays === 1) {
      return (
        <span className="text-info">
          {isRTL ? 'غداً' : 'Tomorrow'}
        </span>
      );
    } else {
      return d.toLocaleDateString();
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return 'bi-arrow-down-up';
    return sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  };

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

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <div className="form-check d-inline-block me-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="selectAllTasks"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="selectAllTasks">
              <span className="text-muted small">
                {isRTL ? 'تحديد الكل' : 'Select All'}
              </span>
            </label>
          </div>
          <span className="text-muted">
            {isRTL ? 'عرض' : 'Showing'} {assignments.length} {isRTL ? 'مهمة' : 'tasks'}
          </span>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button
              className="btn btn-outline-secondary"
              title={isRTL ? 'وضع علامة كمكتمل' : 'Mark as Complete'}
              disabled={selectedIds.length === 0}
              onClick={() => handleBulkStatusUpdate('completed')}
            >
              <i className="bi bi-check-circle"></i>
            </button>
            <button
              className="btn btn-outline-secondary"
              title={isRTL ? 'وضع علامة قيد التنفيذ' : 'Mark as In Progress'}
              disabled={selectedIds.length === 0}
              onClick={() => handleBulkStatusUpdate('in_progress')}
            >
              <i className="bi bi-play-circle"></i>
            </button>
            <button
              className="btn btn-outline-secondary"
              title={isRTL ? 'إعادة تعيين المحدد' : 'Reassign Selected'}
              disabled={selectedIds.length === 0}
              onClick={handleBulkReassign}
            >
              <i className="bi bi-person-plus"></i>
            </button>
          </div>
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-clockwise"></i>
            <span className="d-none d-sm-inline ms-1">
              {isRTL ? 'تحديث' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th
                  className="sortable"
                  onClick={() => onSort('id')}
                  style={{ cursor: 'pointer' }}
                >
                  {isRTL ? 'الرقم المرجعي' : 'Reference Number'}
                  <i className={`bi ${getSortIcon('id')} ms-1`}></i>
                </th>
                <th>
                  {isRTL ? 'رقم المعاملة' : 'Transaction ID'}
                </th>
                <th style={{ minWidth: '200px', maxWidth: '300px' }}>
                  {isRTL ? 'عنوان المعاملة' : 'Transaction Title'}
                </th>
                <th
                  className="sortable"
                  onClick={() => onSort('clientName')}
                  style={{ cursor: 'pointer' }}
                >
                  {isRTL ? 'العميل' : 'Client'}
                  <i className={`bi ${getSortIcon('clientName')} ms-1`}></i>
                </th>
                <th>{isRTL ? 'النوع' : 'Type'}</th>
                <th
                  className="sortable"
                  onClick={() => onSort('priority')}
                  style={{ cursor: 'pointer' }}
                >
                  {isRTL ? 'الأولوية' : 'Priority'}
                  <i className={`bi ${getSortIcon('priority')} ms-1`}></i>
                </th>
                <th
                  className="sortable"
                  onClick={() => onSort('status')}
                  style={{ cursor: 'pointer' }}
                >
                  {isRTL ? 'الحالة' : 'Status'}
                  <i className={`bi ${getSortIcon('status')} ms-1`}></i>
                </th>
                <th className="d-none d-md-table-cell">
                  {isRTL ? 'مسند إلى' : 'Assigned To'}
                </th>
                <th
                  className="sortable"
                  onClick={() => onSort('assignedDate')}
                  style={{ cursor: 'pointer' }}
                >
                  {isRTL ? 'التاريخ' : 'Date'}
                  <i className={`bi ${getSortIcon('assignedDate')} ms-1`}></i>
                </th>
                <th>
                  {isRTL ? 'المرفقات' : 'Attachments'}
                </th>
                <th style={{ width: '60px' }}>
                  {isRTL ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-4">
                    <p className="text-muted mb-0">
                      {isRTL ? 'لا توجد مهام مسندة' : 'No assignments found'}
                    </p>
                  </td>
                </tr>
              ) : (
                assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.includes(assignment.id)}
                        onChange={() => handleSelectOne(assignment.id)}
                      />
                    </td>
                    <td>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onAssignmentClick(assignment);
                        }}
                        className="text-primary text-decoration-none fw-semibold"
                      >
                        {assignment.referenceNumber || '-'}
                      </a>
                    </td>
                    <td>
                      <code className="text-primary">
                        {assignment.transactionId}
                      </code>
                    </td>
                    <td style={{
                      minWidth: '200px',
                      maxWidth: '300px',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal'
                    }}>
                      <div className="text-truncate" title={assignment.title || ''}>
                        {assignment.title || '-'}
                      </div>
                    </td>
                    <td>{assignment.clientName}</td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {assignment.type}
                      </span>
                    </td>
                    <td>{getPriorityBadge(assignment.priority)}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {getStatusBadge(assignment.status)}
                        {/* Progress indicator for in-progress status */}
                        {assignment.status === 'in_progress' && (
                          <div className="progress ms-2" style={{ width: '60px', height: '6px' }}>
                            <div className="progress-bar" role="progressbar" style={{ width: '60%' }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {assignment.assignedToName || assignment.assignedTo ? (
                        <span className="badge bg-info text-dark">
                          <i className="bi bi-person-check me-1"></i>
                          {assignment.assignedToName || (assignment.assignedTo && (
                            assignment.assignedTo.firstName && assignment.assignedTo.lastName
                              ? `${assignment.assignedTo.firstName} ${assignment.assignedTo.lastName}`
                              : assignment.assignedTo.username || assignment.assignedTo.email?.split('@')[0] || 'Unknown'
                          ))}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{formatDate(assignment.assignedDate)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        {assignment.attachmentsCount > 0 ? (
                          <span className="badge bg-secondary">
                            <i className="bi bi-paperclip"></i> {assignment.attachmentsCount}
                          </span>
                        ) : null}
                        {assignment.commentsCount && assignment.commentsCount > 0 ? (
                          <span className="badge bg-info">
                            <i className="bi bi-chat"></i> {assignment.commentsCount}
                          </span>
                        ) : null}
                        {!assignment.attachmentsCount && !assignment.commentsCount && (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-link text-dark"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                onAssignmentClick(assignment);
                              }}
                            >
                              <i className="bi bi-eye me-2"></i>
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </a>
                          </li>
                          <li>
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAssignment(assignment);
                                setNewStatus(assignment.status);
                                setShowStatusModal(true);
                              }}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              {isRTL ? 'تحديث الحالة' : 'Update Status'}
                            </a>
                          </li>
                          <li>
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAssignment(assignment);
                                setShowAssignModal(true);
                              }}
                            >
                              <i className="bi bi-person-plus me-2"></i>
                              {isRTL ? 'إعادة التعيين' : 'Reassign'}
                            </a>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                onStatusUpdate(assignment.id, 'completed');
                              }}
                            >
                              <i className="bi bi-check-circle me-2"></i>
                              {isRTL ? 'وضع علامة كمكتمل' : 'Mark Complete'}
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedAssignment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isRTL ? 'تحديث حالة المهمة' : 'Update Task Status'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedAssignment(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  {isRTL ? 'تحديث حالة المهمة رقم: ' : 'Updating status for task: '}
                  <strong>{selectedAssignment.id}</strong>
                </p>
                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'الحالة الجديدة' : 'New Status'}
                  </label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AssignmentStatus)}
                  >
                    <option value="pending">{isRTL ? 'معلق' : 'Pending'}</option>
                    <option value="in_progress">{isRTL ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="review">{isRTL ? 'قيد المراجعة' : 'Under Review'}</option>
                    <option value="completed">{isRTL ? 'مكتمل' : 'Completed'}</option>
                    <option value="on_hold">{isRTL ? 'معلق' : 'On Hold'}</option>
                    <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedAssignment(null);
                  }}
                  disabled={updating}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isRTL ? 'جاري التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    isRTL ? 'تحديث الحالة' : 'Update Status'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showAssignModal && (selectedAssignment || selectedIds.length > 0) && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isRTL ? 'إعادة تعيين المهمة' : 'Reassign Task'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAssignment(null);
                    setNewAssigneeId('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  {selectedIds.length > 0 ? (
                    <>
                      {isRTL ? `إعادة تعيين ${selectedIds.length} مهمة` : `Reassigning ${selectedIds.length} tasks`}
                    </>
                  ) : selectedAssignment ? (
                    <>
                      {isRTL ? 'إعادة تعيين المهمة رقم: ' : 'Reassigning task: '}
                      <strong>{selectedAssignment.id}</strong>
                    </>
                  ) : null}
                </p>
                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'تعيين إلى' : 'Assign To'}
                  </label>
                  <select
                    className="form-select"
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                  >
                    <option value="">{isRTL ? 'اختر المستخدم' : 'Select User'}</option>
                    {availableUsers.map((user, index) => {
                      // Create a truly unique key using all available identifiers
                      const uniqueKey = `reassign-user-${user.id || 'no-id'}-${user.email || 'no-email'}-${index}`;

                      return (
                        <option key={uniqueKey} value={user.id}>
                          {(() => {
                            const firstName = (user.first_name || user.firstName)?.trim();
                            const lastName = (user.last_name || user.lastName)?.trim();
                            const username = user.username?.trim();
                            const email = user.email?.trim();

                            if (firstName && lastName) {
                              return `${firstName} ${lastName} (${email})`;
                            } else if (firstName) {
                              return `${firstName} (${email})`;
                            } else if (lastName) {
                              return `${lastName} (${email})`;
                            } else if (username) {
                              return `${username} (${email})`;
                            } else if (email) {
                              return email;
                            }
                            return `User ${user.id}`;
                          })()}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedAssignment?.assignedTo && (
                  <div className="alert alert-info">
                    <small>
                      {isRTL ? 'مسند حالياً إلى: ' : 'Currently assigned to: '}
                      <strong>
                        {(() => {
                          const firstName = selectedAssignment.assignedTo.firstName?.trim();
                          const lastName = selectedAssignment.assignedTo.lastName?.trim();
                          const username = selectedAssignment.assignedTo.username?.trim();
                          const email = selectedAssignment.assignedTo.email?.trim();

                          if (firstName && lastName) {
                            return `${firstName} ${lastName}`;
                          } else if (firstName) {
                            return firstName;
                          } else if (lastName) {
                            return lastName;
                          } else if (username) {
                            return username;
                          } else if (email) {
                            return email.split('@')[0];
                          }
                          return 'Unknown User';
                        })()}
                      </strong>
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAssignment(null);
                    setNewAssigneeId('');
                  }}
                  disabled={updating}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleReassign}
                  disabled={updating || !newAssigneeId}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isRTL ? 'جاري التعيين...' : 'Reassigning...'}
                    </>
                  ) : (
                    isRTL ? 'إعادة التعيين' : 'Reassign'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTable;