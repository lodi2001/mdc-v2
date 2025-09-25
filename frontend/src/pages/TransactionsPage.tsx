import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api/client';
import TransactionFilters from '../components/transactions/TransactionFilters';
import AdvancedFilterModal from '../components/transactions/AdvancedFilterModal';
import { debounce } from 'lodash';
import { getStatusColor, getPriorityColor } from '../config/statusColors';

interface Transaction {
  id: number;
  transaction_id: string;  // The TRX-YYYY-NNNNN format ID
  title: string;  // Transaction title
  reference_number: string;  // External reference number
  client_name: string;
  transaction_type: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;  // Name of assigned person
  created_at: string;
  attachment_count: number;
  comments_count?: number;  // Number of comments
}

const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [exportLoading, setExportLoading] = useState(false);
  const isRTL = localStorage.getItem('language') === 'ar';

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isEditor = user?.role?.toLowerCase() === 'editor';
  const canCreate = isAdmin || isEditor;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 500),
    []
  );

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize, searchTerm, statusFilter, typeFilter, dateFrom, dateTo, activeFilters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { transaction_type: typeFilter }),
        ...(dateFrom && { created_at__gte: dateFrom }),
        ...(dateTo && { created_at__lte: dateTo }),
        ...activeFilters,
      });

      const response = await apiClient.get(`/transactions/?${params}`);
      setTransactions(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getMockTransactions = (): Transaction[] => {
    return Array.from({ length: pageSize }, (_, i) => ({
      id: i + 1,  // Database ID
      transaction_id: `TRX-2025-${String(i + 1).padStart(5, '0')}`,  // TRX format ID
      title: ['مراجعة تصريح البلدية', 'تصميم معماري للفيلا', 'رخصة بناء تجاري', 'نقل ملكية أرض', 'دراسة جدوى مشروع'][i % 5],
      reference_number: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      client_name: ['Mohammed Al-Rashid', 'Sara Ahmed', 'Abdullah Hassan', 'Fatima Ali'][i % 4],
      transaction_type: ['Registration', 'Ownership Transfer', 'Licenses', 'Designs', 'Study'][i % 5],
      priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
      status: ['draft', 'submitted', 'approved', 'in-progress', 'completed'][i % 5],
      assigned_to: i % 2 === 0 ? 7 : null,
      assigned_to_name: i % 2 === 0 ? ['Ahmad Hassan', 'Noura Al-Sheikh'][i % 2] : null,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      attachment_count: Math.floor(Math.random() * 5),
      comments_count: Math.floor(Math.random() * 10),
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (id: number) => {
    setSelectedTransactions(prev =>
      prev.includes(id)
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    // Normalize status to handle both formats (in_progress and in-progress)
    const normalizedStatus = status.replace('-', '_');

    const badges: Record<string, { color: string; text: string }> = {
      draft: { color: 'secondary', text: 'Draft' },
      submitted: { color: 'info', text: 'Submitted' },
      pending: { color: 'warning', text: 'Pending' },
      in_progress: { color: 'primary', text: 'In Progress' },
      'in-progress': { color: 'primary', text: 'In Progress' }, // Support both formats
      review: { color: 'info', text: 'Under Review' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'danger', text: 'Rejected' },
      completed: { color: 'success', text: 'Completed' },
      on_hold: { color: 'secondary', text: 'On Hold' },
      cancelled: { color: 'danger', text: 'Cancelled' }
    };
    const badge = badges[status] || badges[normalizedStatus] || { color: 'secondary', text: status };
    return (
      <span className={`badge bg-${badge.color}-subtle text-${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string; icon: string; text: string }> = {
      urgent: { color: 'danger', icon: 'bi-exclamation-triangle-fill', text: isRTL ? 'عاجل' : 'Urgent' },
      high: { color: 'warning', icon: 'bi-exclamation-circle', text: isRTL ? 'عالي' : 'High' },
      normal: { color: 'info', icon: 'bi-dash-circle', text: isRTL ? 'عادي' : 'Normal' },
      medium: { color: 'info', icon: 'bi-dash-circle', text: isRTL ? 'متوسط' : 'Medium' },
      low: { color: 'secondary', icon: 'bi-dash', text: isRTL ? 'منخفض' : 'Low' }
    };
    const badge = badges[priority] || { color: 'secondary', icon: 'bi-dash', text: priority };
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`bi ${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      setExportLoading(true);

      // Build query params including all current filters
      const params = new URLSearchParams({
        format,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { transaction_type: typeFilter }),
        ...(dateFrom && { created_at__gte: dateFrom }),
        ...(dateTo && { created_at__lte: dateTo }),
        ...activeFilters,
      });

      // Get auth token
      const token = localStorage.getItem('access_token');

      // Make request to export endpoint using fetch for better blob handling
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/transactions/export/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from Content-Disposition header if available, otherwise use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `transactions_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);

      // Show success message
      alert(isRTL ? 'تم تصدير المعاملات بنجاح' : 'Transactions exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      alert(isRTL ? 'فشل تصدير المعاملات' : 'Failed to export transactions');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleAdvancedFilterApply = (filters: any) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    setShowAdvancedFilter(false);
  };

  const handleDuplicate = async (transactionId: number) => {
    try {
      // Use the backend duplicate endpoint which handles notifications
      const response = await apiClient.post(`/transactions/${transactionId}/duplicate/`);

      if (response.data.success) {
        // Show success message
        alert(isRTL ? 'تم نسخ المعاملة بنجاح' : 'Transaction duplicated successfully');

        // Refresh the list to show the new duplicate
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error duplicating transaction:', error);
      alert(isRTL ? 'فشل نسخ المعاملة' : 'Failed to duplicate transaction');
    }
  };

  const handleDelete = async (transactionId: number, transactionTitle: string) => {
    // Only admins can delete transactions
    if (user?.role !== 'admin') {
      alert(isRTL ? 'ليس لديك صلاحية حذف المعاملات' : 'You do not have permission to delete transactions');
      return;
    }

    // Confirmation dialog
    const confirmMessage = isRTL
      ? `هل أنت متأكد من حذف المعاملة "${transactionTitle}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to delete the transaction "${transactionTitle}"?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete the transaction
      await apiClient.delete(`/transactions/${transactionId}/`);

      // Show success message
      alert(isRTL ? 'تم حذف المعاملة بنجاح' : 'Transaction deleted successfully');

      // Refresh the list
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(isRTL ? 'فشل حذف المعاملة' : 'Failed to delete transaction');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="page-header mb-4">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">All Transactions</h2>
              <p className="text-muted mb-0">Manage and track all transactions in the system</p>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setShowAdvancedFilter(true)}
                >
                  <i className="bi bi-funnel me-1"></i>
                  {isRTL ? 'فلتر متقدم' : 'Advanced Filter'}
                  {Object.keys(activeFilters).length > 0 && (
                    <span className="badge bg-primary ms-1">{Object.keys(activeFilters).length}</span>
                  )}
                </button>
                {canCreate && (
                  <Link to="/transactions/create" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-1"></i> New Transaction
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder={isRTL ?
                  'ابحث برقم المعاملة، اسم العميل، النوع، أو الوصف...' :
                  'Search by transaction ID, client name, type, or description...'
                }
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Transaction Filters Component */}
        <TransactionFilters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          loading={exportLoading}
        />

        {/* Transactions Table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">Showing</span>
              <select 
                className="form-select form-select-sm d-inline-block mx-2" 
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-muted">entries</span>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchTransactions}
                title="Refresh"
              >
                <i className="bi bi-arrow-clockwise"></i>
                <span className="d-none d-sm-inline ms-1">Refresh</span>
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Reference Number</th>
                    <th>Transaction ID</th>
                    <th style={{ minWidth: '200px', maxWidth: '300px' }}>Transaction Title</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                    <th>Attachments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-4 text-muted">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                          />
                        </td>
                        <td>
                          <Link to={`/transactions/${transaction.id}`} className="text-decoration-none text-primary fw-medium">
                            {transaction.reference_number || '-'}
                          </Link>
                        </td>
                        <td>
                          <code className="text-primary">{transaction.transaction_id}</code>
                        </td>
                        <td style={{
                          minWidth: '200px',
                          maxWidth: '300px',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          <div className="text-truncate" title={transaction.title || ''}>
                            {transaction.title || '-'}
                          </div>
                        </td>
                        <td>{transaction.client_name}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td>{getPriorityBadge(transaction.priority)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {getStatusBadge(transaction.status)}
                            {/* Progress indicator for in-progress status */}
                            {(transaction.status === 'in-progress' || transaction.status === 'in_progress') && (
                              <div className="progress ms-2" style={{ width: '60px', height: '6px' }}>
                                <div className="progress-bar" role="progressbar" style={{ width: '60%' }}></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {transaction.assigned_to_name ? (
                            <span className="badge bg-info text-dark">
                              <i className="bi bi-person-check me-1"></i>
                              {transaction.assigned_to_name}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-1">
                            {transaction.attachment_count > 0 ? (
                              <span className="badge bg-secondary">
                                <i className="bi bi-paperclip"></i> {transaction.attachment_count}
                              </span>
                            ) : null}
                            {transaction.comments_count && transaction.comments_count > 0 ? (
                              <span className="badge bg-info">
                                <i className="bi bi-chat"></i> {transaction.comments_count}
                              </span>
                            ) : null}
                            {!transaction.attachment_count && !transaction.comments_count && (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-link text-dark p-0"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              style={{ width: '30px', height: '30px' }}
                            >
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <Link
                                  to={`/transactions/${transaction.id}`}
                                  className="dropdown-item"
                                >
                                  <i className="bi bi-eye me-2"></i>
                                  {isRTL ? 'عرض' : 'View'}
                                </Link>
                              </li>
                              {canCreate && (
                                <>
                                  <li>
                                    <Link
                                      to={`/transactions/${transaction.id}/edit`}
                                      className="dropdown-item"
                                    >
                                      <i className="bi bi-pencil me-2"></i>
                                      {isRTL ? 'تعديل' : 'Edit'}
                                    </Link>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleDuplicate(transaction.id)}
                                    >
                                      <i className="bi bi-files me-2"></i>
                                      {isRTL ? 'نسخ' : 'Duplicate'}
                                    </button>
                                  </li>
                                  {user?.role === 'admin' && (
                                    <>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDelete(transaction.id, transaction.title)}
                                        >
                                          <i className="bi bi-trash me-2"></i>
                                          {isRTL ? 'حذف' : 'Delete'}
                                        </button>
                                      </li>
                                    </>
                                  )}
                                </>
                              )}
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
          <div className="card-footer">
            <div className="row align-items-center">
              <div className="col">
                <p className="text-muted mb-0">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                </p>
              </div>
              <div className="col-auto">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </li>
                      </>
                    )}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        show={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={handleAdvancedFilterApply}
        currentFilters={activeFilters}
      />
    </Layout>
  );
};

export default TransactionsPage;