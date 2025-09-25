import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import apiClient from '../services/api/client';
import { Transaction } from '../types/transaction';
import TransactionComments from '../components/transactions/TransactionComments';
import TransactionHistory from '../components/transactions/TransactionHistory';

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    fetchTransactionDetails();
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions/${id}/`);
      setTransaction(response.data);
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number, filename: string) => {
    if (!window.confirm(`${isRTL ? 'هل أنت متأكد من حذف الملف' : 'Are you sure you want to delete'} "${filename}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/attachments/attachments/${attachmentId}/`);
      // Refresh transaction details to update the attachment list
      await fetchTransactionDetails();
      // Show success message (you could use a toast notification here)
      alert(isRTL ? 'تم حذف الملف بنجاح' : 'Attachment deleted successfully');
    } catch (err: any) {
      console.error('Error deleting attachment:', err);
      alert(isRTL ? 'فشل حذف الملف' : 'Failed to delete attachment');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      draft: { color: 'secondary', text: isRTL ? 'مسودة' : 'Draft' },
      pending: { color: 'warning', text: isRTL ? 'معلق' : 'Pending' },
      in_progress: { color: 'primary', text: isRTL ? 'قيد التنفيذ' : 'In Progress' },
      review: { color: 'info', text: isRTL ? 'قيد المراجعة' : 'Under Review' },
      approved: { color: 'success', text: isRTL ? 'موافق عليه' : 'Approved' },
      rejected: { color: 'danger', text: isRTL ? 'مرفوض' : 'Rejected' },
      completed: { color: 'success', text: isRTL ? 'مكتمل' : 'Completed' },
      cancelled: { color: 'secondary', text: isRTL ? 'ملغي' : 'Cancelled' }
    };
    const badge = badges[status] || { color: 'secondary', text: status };

    // Add progress bar for in_progress status
    if (status === 'in_progress') {
      return (
        <span className={`badge bg-${badge.color}-subtle text-${badge.color}`}>
          {badge.text}
          <div className="progress ms-2" style={{ width: '60px', height: '4px', display: 'inline-block' }}>
            <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '60%' }}></div>
          </div>
        </span>
      );
    }

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

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !transaction) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="alert alert-danger">
            {error || 'Transaction not found'}
            <button className="btn btn-primary ms-3" onClick={() => navigate('/transactions')}>
              Back to Transactions
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              {isRTL ? 'تفاصيل المعاملة' : 'Transaction Details'}
            </h2>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted">#{transaction.transaction_id}</span>
              {getStatusBadge(transaction.status)}
              {getPriorityBadge(transaction.priority)}
            </div>
          </div>
          <div>
            <button 
              className="btn btn-secondary me-2"
              onClick={() => navigate('/transactions')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              {isRTL ? 'رجوع' : 'Back'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/transactions/${id}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              {isRTL ? 'تعديل' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              {isRTL ? 'التفاصيل' : 'Details'}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              {isRTL ? 'التعليقات' : 'Comments'}
              {transaction.comments_count && transaction.comments_count > 0 && (
                <span className="badge bg-secondary ms-2">{transaction.comments_count}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'attachments' ? 'active' : ''}`}
              onClick={() => setActiveTab('attachments')}
            >
              {isRTL ? 'المرفقات' : 'Attachments'}
              {transaction.attachments_count && transaction.attachments_count > 0 && (
                <span className="badge bg-secondary ms-2">{transaction.attachments_count}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              {isRTL ? 'السجل' : 'History'}
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'details' && (
            <div className="row">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title mb-4">
                      {isRTL ? 'معلومات المعاملة' : 'Transaction Information'}
                    </h5>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="text-muted small">
                          {isRTL ? 'رقم المرجع' : 'Reference Number'}
                        </label>
                        <p className="fw-semibold">
                          <code className="text-primary">{transaction.transaction_id}</code>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small">
                          {isRTL ? 'رقم المعاملة' : 'Transaction Number'}
                        </label>
                        <p className="fw-semibold">{transaction.reference_number || '-'}</p>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="text-muted small">
                          {isRTL ? 'اسم العميل' : 'Client Name'}
                        </label>
                        <p className="fw-semibold">{transaction.client_name}</p>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small">
                          {isRTL ? 'نوع المعاملة' : 'Transaction Type'}
                        </label>
                        <p className="fw-semibold">{transaction.transaction_type}</p>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-12">
                        <label className="text-muted small">
                          {isRTL ? 'القسم' : 'Department'}
                        </label>
                        <p className="fw-semibold">{transaction.department || '-'}</p>
                      </div>
                    </div>

                    {transaction.description && (
                      <div className="mb-3">
                        <label className="text-muted small">
                          {isRTL ? 'الوصف' : 'Description'}
                        </label>
                        <p className="fw-semibold">{transaction.description}</p>
                      </div>
                    )}

                    {transaction.due_date && (
                      <div className="mb-3">
                        <label className="text-muted small">
                          {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
                        </label>
                        <p className="fw-semibold">
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                {/* Assignment Info */}
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">
                      {isRTL ? 'معلومات التعيين' : 'Assignment Info'}
                    </h6>
                    <div className="mb-2">
                      <label className="text-muted small d-block">
                        {isRTL ? 'معين إلى' : 'Assigned To'}
                      </label>
                      <span className="fw-semibold">
                        {transaction.assigned_to_name || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <label className="text-muted small d-block">
                        {isRTL ? 'أنشئ بواسطة' : 'Created By'}
                      </label>
                      <span className="fw-semibold">
                        {transaction.created_by_name || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">
                      {isRTL ? 'الجدول الزمني' : 'Timeline'}
                    </h6>
                    <div className="mb-2">
                      <label className="text-muted small d-block">
                        {isRTL ? 'تاريخ الإنشاء' : 'Created At'}
                      </label>
                      <span className="fw-semibold">
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <label className="text-muted small d-block">
                        {isRTL ? 'آخر تحديث' : 'Last Updated'}
                      </label>
                      <span className="fw-semibold">
                        {new Date(transaction.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                {transaction.qr_code && (
                  <div className="card mt-3">
                    <div className="card-body text-center">
                      <h6 className="card-title">
                        {isRTL ? 'رمز QR' : 'QR Code'}
                      </h6>
                      <img 
                        src={transaction.qr_code} 
                        alt="QR Code" 
                        className="img-fluid"
                        style={{ maxWidth: '200px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <TransactionComments
              transactionId={id || ''}
              isRTL={isRTL}
            />
          )}

          {activeTab === 'attachments' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  {isRTL ? 'المرفقات' : 'Attachments'}
                </h5>
                {transaction.attachments && transaction.attachments.length > 0 ? (
                  <div className="list-group">
                    {transaction.attachments.map((attachment: any) => (
                      <div key={attachment.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <i className="bi bi-paperclip me-2"></i>
                            <a
                              href={attachment.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              {attachment.original_filename}
                            </a>
                            <small className="text-muted ms-2">
                              ({attachment.file_size_formatted})
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <small className="text-muted">
                              {new Date(attachment.created_at).toLocaleDateString()}
                            </small>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.original_filename)}
                              title={isRTL ? 'حذف الملف' : 'Delete attachment'}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                        {attachment.description && (
                          <small className="text-muted d-block mt-1">
                            {attachment.description}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-paperclip fs-1"></i>
                    <p>{isRTL ? 'لا توجد مرفقات' : 'No attachments'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <TransactionHistory
              transactionId={id || ''}
              isRTL={isRTL}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TransactionDetailPage;