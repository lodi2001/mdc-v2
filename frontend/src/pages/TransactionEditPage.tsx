import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import apiClient from '../services/api/client';
import { Transaction, TRANSACTION_TYPES, TRANSACTION_STATUSES, TRANSACTION_PRIORITIES, DEPARTMENTS } from '../types/transaction';
import ClientSearchDropdown from '../components/common/ClientSearchDropdown';

const TransactionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRTL = localStorage.getItem('language') === 'ar';

  const [formData, setFormData] = useState({
    title: '',
    reference_number: '',
    client_name: '',
    client_id: null as number | null,
    client_email: '',
    client_phone: '',
    transaction_type: '',
    description: '',
    status: '',
    priority: '',
    due_date: '',
    department: '',
    project_id: '',
    tags: '',
    internal_notes: ''
  });

  // Keep track of original values to send only changed fields
  const [originalData, setOriginalData] = useState({
    title: '',
    reference_number: '',
    client_name: '',
    client_id: null as number | null,
    client_email: '',
    client_phone: '',
    transaction_type: '',
    description: '',
    status: '',
    priority: '',
    due_date: '',
    department: '',
    project_id: '',
    tags: '',
    internal_notes: ''
  });

  // State for file attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions/${id}/`);
      const data = response.data;
      setTransaction(data);

      // Populate form with existing data
      // Normalize transaction_type and status by replacing hyphens with underscores
      const normalizedType = data.transaction_type ? data.transaction_type.replace(/-/g, '_') : '';
      const normalizedStatus = data.status ? data.status.replace(/-/g, '_') : '';

      const initialData = {
        title: data.title || '',
        reference_number: data.reference_number || '',
        client_name: data.client_name || '',
        client_id: data.client || null,
        client_email: data.client_email || '',
        client_phone: data.client_phone || '',
        transaction_type: normalizedType,
        description: data.description || '',
        status: normalizedStatus,
        priority: data.priority || '',
        due_date: data.due_date || '',
        department: data.department || '',
        project_id: data.project_id || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
        internal_notes: data.internal_notes || ''
      };

      setFormData(initialData);
      setOriginalData(initialData);

      // Fetch attachments if transaction has them
      if (data.attachments_count > 0 || data.id) {
        fetchAttachments(data.id);
      }
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (transactionId: number) => {
    try {
      const response = await apiClient.get(`/attachments/?transaction=${transactionId}`);
      setExistingAttachments(response.data.results || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({
      ...prev,
      client_id: client?.id || null,
      client_name: client?.company_name || client?.full_name || '',
      client_email: client?.email || '',
      client_phone: client?.phone || ''
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('Files selected:', files?.length, files);
    if (files) {
      const fileArray = Array.from(files);
      console.log('Adding files to attachments state:', fileArray);
      setAttachments(prev => {
        const newAttachments = [...prev, ...fileArray];
        console.log('New attachments state will be:', newAttachments);
        return newAttachments;
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId: number) => {
    try {
      await apiClient.delete(`/attachments/${attachmentId}/`);
      setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (err) {
      console.error('Error removing attachment:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Build submitData with only changed fields
      const submitData: any = {};

      // Compare each field and only include if changed
      if (formData.title !== originalData.title) {
        submitData.title = formData.title;
      }
      if (formData.reference_number !== originalData.reference_number) {
        submitData.reference_number = formData.reference_number || '';
      }
      if (formData.client_name !== originalData.client_name) {
        submitData.client_name = formData.client_name;
      }
      if (formData.transaction_type !== originalData.transaction_type) {
        submitData.transaction_type = formData.transaction_type.replace(/_/g, '-');
      }
      if (formData.description !== originalData.description) {
        submitData.description = formData.description || '';
      }
      if (formData.status !== originalData.status) {
        submitData.status = formData.status;  // Keep underscores, don't convert
      }
      if (formData.priority !== originalData.priority) {
        submitData.priority = formData.priority;
      }
      if (formData.due_date !== originalData.due_date) {
        submitData.due_date = formData.due_date || null;
      }
      if (formData.department !== originalData.department) {
        submitData.department = formData.department || '';
      }
      if (formData.project_id !== originalData.project_id) {
        submitData.project_id = formData.project_id || '';
      }
      if (formData.tags !== originalData.tags) {
        submitData.tags = formData.tags || '';
      }
      if (formData.internal_notes !== originalData.internal_notes) {
        submitData.internal_notes = formData.internal_notes || '';
      }

      // Check if we need to update transaction data or just upload attachments
      if (Object.keys(submitData).length > 0) {
        // Update transaction if there are field changes
        const response = await apiClient.patch(`/transactions/${id}/`, submitData);
      }

      // Upload new attachments if any (even if no field changes)
      console.log('Checking attachments:', attachments.length, attachments);
      if (attachments.length > 0) {
        setUploadingFiles(true);
        console.log('Uploading attachments for transaction:', id);
        const formData = new FormData();
        attachments.forEach(file => {
          console.log('Adding file to formData:', file.name, file.size);
          formData.append('files', file);
        });
        formData.append('transaction', id!);

        try {
          console.log('Sending attachment upload request...');
          const uploadResponse = await apiClient.post('/attachments/attachments/bulk_upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Attachment upload response:', uploadResponse.data);

          // Clear the attachments state and file input after successful upload
          setAttachments([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          // Show success message
          const uploadedCount = uploadResponse.data?.data?.attachments?.length || attachments.length;
          alert(isRTL
            ? `تم رفع ${uploadedCount} ملف(ات) بنجاح`
            : `${uploadedCount} file(s) uploaded successfully`);
        } catch (uploadErr) {
          console.error('Error uploading attachments:', uploadErr);
          // Show error to user but don't prevent navigation
          alert(isRTL
            ? 'تحذير: قد لا يتم رفع بعض المرفقات. يرجى التحقق من تفاصيل المعاملة.'
            : 'Warning: Some attachments may not have been uploaded. Please check the transaction details.');
        } finally {
          setUploadingFiles(false);
        }
      } else {
        console.log('No attachments to upload');
      }

      navigate(`/transactions/${id}`);
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      console.error('Error response:', err.response?.data);

      let errorMsg = 'Failed to update transaction';

      // Handle different error formats from backend
      if (err.response?.data) {
        const data = err.response.data;

        // Handle field-specific validation errors
        if (typeof data === 'object' && !data.message && !data.detail) {
          const errors = [];
          for (const [field, messages] of Object.entries(data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMsg = errors.join('; ');
        } else if (data.errors?.status) {
          // Handle status transition errors specifically
          const statusError = Array.isArray(data.errors.status)
            ? data.errors.status[0]
            : data.errors.status;

          // Provide helpful message about valid transitions
          const validTransitions: Record<string, string[]> = {
            'draft': ['submitted', 'cancelled'],
            'submitted': ['under_review', 'draft', 'cancelled'],
            'under_review': ['approved', 'submitted', 'cancelled'],
            'approved': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'on_hold', 'cancelled'],
            'on_hold': ['in_progress', 'cancelled']
          };

          const currentStatus = originalData.status;  // Use underscore format
          const validNext = validTransitions[currentStatus] || [];

          errorMsg = `${statusError}. Valid transitions from '${currentStatus}': ${validNext.join(', ') || 'none'}`;
        } else {
          errorMsg = data.message || data.detail || errorMsg;
        }
      }

      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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
        <div className="alert alert-danger" role="alert">
          {error || 'Transaction not found'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="page-title">
              {isRTL ? 'تعديل المعاملة' : 'Edit Transaction'}
            </h2>
            <p className="text-muted mb-0">
              {isRTL ? `رقم المرجع: ${transaction.transaction_id}` : `Reference: ${transaction.transaction_id}`}
            </p>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => navigate(`/transactions/${id}`)}
              disabled={saving || uploadingFiles}
            >
              <i className="bi bi-x-circle me-2"></i>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              form="editTransactionForm"
              className="btn btn-primary"
              disabled={saving || uploadingFiles}
            >
              {saving || uploadingFiles ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {uploadingFiles ? (isRTL ? 'جاري رفع الملفات...' : 'Uploading files...') : (isRTL ? 'جاري الحفظ...' : 'Saving...')}
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Edit Form */}
        <form id="editTransactionForm" onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <div className="row">
                {/* Basic Information Section */}
                <div className="col-md-6">
                  <h5 className="mb-3">{isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</h5>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'عنوان المعاملة' : 'Transaction Title'}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'رقم المعاملة الخارجي' : 'External Reference'}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'اسم العميل' : 'Client Name'}</label>
                    <ClientSearchDropdown
                      value={formData.client_name}
                      onClientSelect={handleClientSelect}
                      required
                    />
                    {formData.client_email && (
                      <small className="text-muted d-block mt-1">
                        <i className="bi bi-envelope me-1"></i> {formData.client_email}
                        {formData.client_phone && (
                          <span className="ms-2">
                            <i className="bi bi-telephone me-1"></i> {formData.client_phone}
                          </span>
                        )}
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'نوع المعاملة' : 'Transaction Type'}</label>
                    <select
                      className="form-select"
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{isRTL ? 'اختر النوع...' : 'Select type...'}</option>
                      {TRANSACTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status and Priority Section */}
                <div className="col-md-6">
                  <h5 className="mb-3">{isRTL ? 'الحالة والأولوية' : 'Status & Priority'}</h5>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'الحالة' : 'Status'}</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {TRANSACTION_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'الأولوية' : 'Priority'}</label>
                    <select
                      className="form-select"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      {TRANSACTION_PRIORITIES.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                    <input
                      type="date"
                      className="form-control"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'القسم' : 'Department'}</label>
                    <select
                      className="form-select"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      <option value="">{isRTL ? 'اختر القسم...' : 'Select department...'}</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="col-12">
                  <h5 className="mb-3 mt-3">{isRTL ? 'معلومات إضافية' : 'Additional Information'}</h5>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'الوصف' : 'Description'}</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'معرف المشروع' : 'Project ID'}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'الوسوم' : 'Tags'}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder={isRTL ? 'مفصولة بفواصل' : 'Separated by commas'}
                    />
                    <small className="text-muted">
                      {isRTL ? 'أدخل الوسوم مفصولة بفواصل' : 'Enter tags separated by commas'}
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'ملاحظات داخلية' : 'Internal Notes'}</label>
                    <textarea
                      className="form-control"
                      name="internal_notes"
                      value={formData.internal_notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>
                      {isRTL ? 'هذه الملاحظات للاستخدام الداخلي فقط' : 'These notes are for internal use only'}
                    </small>
                  </div>

                  {/* File Attachments Section */}
                  <div className="mb-3">
                    <label className="form-label">{isRTL ? 'المرفقات' : 'Attachments'}</label>

                    {/* Existing attachments */}
                    {existingAttachments.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">
                          {isRTL ? 'المرفقات الحالية:' : 'Current attachments:'}
                        </small>
                        <div className="list-group">
                          {existingAttachments.map((attachment, index) => (
                            <div key={attachment.id || index} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <i className="bi bi-paperclip me-2"></i>
                                <a
                                  href={attachment.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  {attachment.file_name}
                                </a>
                                {attachment.file_size && (
                                  <small className="text-muted ms-2">
                                    ({(attachment.file_size / 1024).toFixed(2)} KB)
                                  </small>
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeExistingAttachment(attachment.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New attachments */}
                    {attachments.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">
                          {isRTL ? 'مرفقات جديدة:' : 'New attachments:'}
                        </small>
                        <div className="list-group">
                          {attachments.map((file, index) => (
                            <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <i className="bi bi-file-earmark-plus me-2 text-success"></i>
                                {file.name}
                                <small className="text-muted ms-2">
                                  ({(file.size / 1024).toFixed(2)} KB)
                                </small>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeAttachment(index)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={uploadingFiles}
                    />
                    <small className="text-muted">
                      {isRTL
                        ? 'الملفات المسموح بها: PDF, Word, Excel, الصور (PNG, JPG). الحجم الأقصى: 10MB لكل ملف'
                        : 'Allowed files: PDF, Word, Excel, Images (PNG, JPG). Max size: 10MB per file'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TransactionEditPage;