import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import AssignmentStats from '../components/assignments/AssignmentStats';
import AssignmentFilters from '../components/assignments/AssignmentFilters';
import AssignmentTable from '../components/assignments/AssignmentTable';
import assignmentService from '../services/assignmentService';
import type { 
  Assignment, 
  AssignmentFilter, 
  AssignmentStats as Stats,
  AssignmentStatus,
  AssignedUser,
  BulkAction
} from '../types/assignment';

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAssigned: 0,
    urgent: 0,
    pendingReview: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    averageCompletionTime: 0
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<AssignmentFilter>({});
  const [availableEditors, setAvailableEditors] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    loadAssignments();
    loadStats();
    loadEditors();
  }, [filter, currentPage, sortField, sortDirection]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments(filter, currentPage, 25);
      setAssignments(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading assignments:', error);
      // Clear assignments on error instead of using mock data
      setAssignments([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await assignmentService.getAssignmentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadEditors = async () => {
    try {
      const assignees = await assignmentService.getAvailableAssignees();
      setAvailableEditors(assignees);
    } catch (error) {
      console.error('Error loading available assignees:', error);
      // Use mock editors and admins
      setAvailableEditors([
        { id: 1, username: 'john.editor', firstName: 'John', lastName: 'Editor', email: 'john@mdc.gov' },
        { id: 2, username: 'sarah.editor', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@mdc.gov' },
        { id: 3, username: 'mike.admin', firstName: 'Mike', lastName: 'Admin', email: 'mike@mdc.gov' }
      ]);
    }
  };

  const handleFilterChange = (newFilter: AssignmentFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const blob = await assignmentService.exportAssignments(format, filter);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assignments-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting assignments:', error);
    }
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async (id: string, status: AssignmentStatus) => {
    try {
      // Update status via API
      // await assignmentService.updateStatus(id, status);
      // For now, update locally
      setAssignments(prev => 
        prev.map(a => a.id === id ? { ...a, status } : a)
      );
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    try {
      await assignmentService.performBulkAction(action);
      // Reload assignments
      loadAssignments();
      loadStats();
      // Clear selection
      setSelectedIds([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    let aVal: any = a[sortField as keyof Assignment];
    let bVal: any = b[sortField as keyof Assignment];
    
    if (sortField === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      aVal = priorityOrder[aVal as keyof typeof priorityOrder];
      bVal = priorityOrder[bVal as keyof typeof priorityOrder];
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="page-header mb-4">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">
                {isRTL ? 'المعاملات المسندة' : 'Assigned Tasks'}
              </h2>
              <p className="text-muted mb-0">
                {isRTL ? 'إدارة وتتبع المعاملات والمهام المسندة' : 'Manage and track assigned transactions and tasks'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <AssignmentStats stats={stats} isRTL={isRTL} />
        
        {/* Filters */}
        <AssignmentFilters 
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          availableEditors={availableEditors}
          isRTL={isRTL}
        />
        
        {/* Assignments Table */}
        <AssignmentTable
          assignments={sortedAssignments}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onAssignmentClick={handleAssignmentClick}
          onStatusUpdate={handleStatusUpdate}
          onAssignmentUpdate={() => {
            loadAssignments();
            loadStats();
          }}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          isRTL={isRTL}
          loading={loading}
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer">
            <div className="row align-items-center">
              <div className="col">
                <p className="text-muted mb-0">
                  {isRTL ? 'عرض' : 'Showing'} {((currentPage - 1) * 25) + 1} {isRTL ? 'إلى' : 'to'}{' '}
                  {Math.min(currentPage * 25, stats.totalAssigned)} {isRTL ? 'من' : 'of'}{' '}
                  {stats.totalAssigned} {isRTL ? 'مهمة' : 'tasks'}
                </p>
              </div>
              <div className="col-auto">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <a 
                        className="page-link" 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                      >
                        {isRTL ? 'السابق' : 'Previous'}
                      </a>
                    </li>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                          <a 
                            className="page-link" 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </a>
                        </li>
                      );
                    })}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a 
                        className="page-link" 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                      >
                        {isRTL ? 'التالي' : 'Next'}
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && selectedAssignment && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isRTL ? 'تفاصيل المهمة' : 'Task Details'} - {selectedAssignment.id}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAssignment(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'العميل' : 'Client'}
                    </label>
                    <p className="fw-semibold">{selectedAssignment.clientName}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'النوع' : 'Type'}
                    </label>
                    <p className="fw-semibold">{selectedAssignment.type}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'الأولوية' : 'Priority'}
                    </label>
                    <p className="fw-semibold text-capitalize">{selectedAssignment.priority}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'الحالة' : 'Status'}
                    </label>
                    <p className="fw-semibold">{selectedAssignment.status}</p>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted">
                      {isRTL ? 'الوصف' : 'Description'}
                    </label>
                    <p>{selectedAssignment.description || 'No description available'}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'تاريخ التعيين' : 'Assigned Date'}
                    </label>
                    <p>{new Date(selectedAssignment.assignedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">
                      {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </label>
                    <p>{new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAssignment(null);
                  }}
                >
                  {isRTL ? 'إغلاق' : 'Close'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowStatusModal(true);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i> 
                  {isRTL ? 'تحديث الحالة' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AssignmentsPage;
