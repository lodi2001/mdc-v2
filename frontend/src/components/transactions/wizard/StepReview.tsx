import React, { useEffect, useState } from 'react';
import { TransactionForm, TRANSACTION_TYPES, TRANSACTION_PRIORITIES, DEPARTMENTS } from '../../../types/transaction';

interface StepReviewProps {
  formData: TransactionForm;
  updateFormData: (updates: Partial<TransactionForm>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

const StepReview: React.FC<StepReviewProps> = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const [transactionId, setTransactionId] = useState<string>('');
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    // Generate transaction ID for preview
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 100000);
    const id = `TRX-${year}-${String(randomNum).padStart(5, '0')}`;
    setTransactionId(id);
  }, []);

  const getLabel = (value: string, options: Array<{value: string, label: string}>): string => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value || '-';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return isRTL ? 'غير محدد' : 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-QA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(transactionId)}`;

  return (
    <div className="step-content">
      <h4 className="mb-4">
        {isRTL ? 'مراجعة تفاصيل المعاملة' : 'Review Transaction Details'}
      </h4>

      <div className="row">
        {/* Transaction Summary */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">
                <i className="bi bi-file-text me-2"></i>
                {isRTL ? 'ملخص المعاملة' : 'Transaction Summary'}
              </h5>

              {/* Transaction ID */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'معرف المعاملة' : 'Transaction ID'}
                </div>
                <div className="summary-value">
                  <strong>{transactionId}</strong>
                  <span className="text-muted ms-2">
                    ({isRTL ? 'تم إنشاؤه تلقائياً' : 'Auto-generated'})
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'العنوان' : 'Title'}
                </div>
                <div className="summary-value">
                  {formData.title || '-'}
                </div>
              </div>

              {/* Client */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'العميل' : 'Client'}
                </div>
                <div className="summary-value">
                  {formData.client_name || '-'}
                  {formData.client_email && (
                    <span className="text-muted ms-2">({formData.client_email})</span>
                  )}
                </div>
              </div>

              {/* External Reference ID */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'المرجع الخارجي' : 'External Reference ID'}
                </div>
                <div className="summary-value">
                  {formData.external_id || (isRTL ? 'غير مقدم' : 'Not provided')}
                </div>
              </div>

              {/* Type */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'النوع' : 'Type'}
                </div>
                <div className="summary-value">
                  {getLabel(formData.transaction_type, TRANSACTION_TYPES)}
                </div>
              </div>

              {/* Priority */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'الأولوية' : 'Priority'}
                </div>
                <div className="summary-value">
                  <span className={`badge bg-${TRANSACTION_PRIORITIES.find(p => p.value === formData.priority)?.color || 'secondary'}`}>
                    {getLabel(formData.priority, TRANSACTION_PRIORITIES)}
                  </span>
                </div>
              </div>

              {/* Department */}
              {formData.department && (
                <div className="summary-item">
                  <div className="summary-label">
                    {isRTL ? 'القسم' : 'Department'}
                  </div>
                  <div className="summary-value">
                    {getLabel(formData.department, DEPARTMENTS)}
                  </div>
                </div>
              )}

              {/* Assigned To */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'معين إلى' : 'Assigned To'}
                </div>
                <div className="summary-value">
                  {formData.assigned_to || (isRTL ? 'غير معين' : 'Not assigned')}
                </div>
              </div>

              {/* Due Date */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
                </div>
                <div className="summary-value">
                  {formatDate(formData.due_date)}
                </div>
              </div>

              {/* Attachments */}
              <div className="summary-item">
                <div className="summary-label">
                  {isRTL ? 'المرفقات' : 'Attachments'}
                </div>
                <div className="summary-value">
                  {formData.attachments?.length || 0} {isRTL ? 'ملف(ات)' : 'file(s)'}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <span className="text-muted ms-2">
                      ({formData.client_visible_attachments 
                        ? (isRTL ? 'مرئي للعميل' : 'Visible to client')
                        : (isRTL ? 'داخلي فقط' : 'Internal only')
                      })
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {formData.tags && (
                <div className="summary-item">
                  <div className="summary-label">
                    {isRTL ? 'الوسوم' : 'Tags'}
                  </div>
                  <div className="summary-value">
                    {formData.tags.split(',').map((tag, index) => (
                      <span key={index} className="badge bg-secondary me-1">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {formData.description && (
                <div className="summary-item">
                  <div className="summary-label">
                    {isRTL ? 'الوصف' : 'Description'}
                  </div>
                  <div className="summary-value">
                    <p className="mb-0">{formData.description}</p>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              {formData.internal_notes && (
                <div className="summary-item">
                  <div className="summary-label">
                    <i className="bi bi-lock-fill me-1"></i>
                    {isRTL ? 'ملاحظات داخلية' : 'Internal Notes'}
                  </div>
                  <div className="summary-value">
                    <p className="mb-0 text-muted">{formData.internal_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code and Actions */}
        <div className="col-lg-4">
          {/* QR Code Preview */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">
                <i className="bi bi-qr-code me-2"></i>
                {isRTL ? 'معاينة رمز QR' : 'QR Code Preview'}
              </h5>
              <div className="qr-preview text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="img-fluid"
                  style={{ maxWidth: '200px' }}
                />
                <p className="small text-muted mt-2">
                  {isRTL ? 'رمز QR تم إنشاؤه تلقائياً' : 'Auto-generated QR Code'}
                </p>
                <p className="small">
                  <strong>{transactionId}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                {isRTL ? 'معلومات الحالة' : 'Status Information'}
              </h6>
              <div className="mb-2">
                <small className="text-muted d-block">
                  {isRTL ? 'الحالة الأولية' : 'Initial Status'}
                </small>
                <span className="badge bg-secondary">
                  {isRTL ? 'مسودة' : 'Draft'}
                </span>
              </div>
              <div>
                <small className="text-muted d-block">
                  {isRTL ? 'تاريخ الإنشاء' : 'Created Date'}
                </small>
                <p className="mb-0">
                  {new Date().toLocaleDateString(isRTL ? 'ar-QA' : 'en-US')}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Note */}
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>{isRTL ? 'تنبيه:' : 'Note:'}</strong>
            <p className="mb-0 small mt-1">
              {isRTL 
                ? 'يرجى مراجعة جميع المعلومات بعناية قبل الإرسال. بمجرد الإرسال، ستحتاج إلى إذن المسؤول لإجراء تغييرات.'
                : 'Please review all information carefully before submission. Once submitted, you will need administrator permission to make changes.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Final Actions Info */}
      <div className="card bg-light">
        <div className="card-body">
          <h6 className="card-title">
            <i className="bi bi-check2-square me-2"></i>
            {isRTL ? 'الخطوات التالية' : 'Next Steps'}
          </h6>
          <ul className="mb-0">
            <li>
              {isRTL 
                ? 'سيتم إرسال المعاملة للمعالجة فور النقر على "إرسال المعاملة"'
                : 'Transaction will be submitted for processing upon clicking "Submit Transaction"'
              }
            </li>
            <li>
              {isRTL 
                ? 'سيتم إشعار الشخص المعين (إن وجد) عبر البريد الإلكتروني'
                : 'Assigned person (if any) will be notified via email'
              }
            </li>
            <li>
              {isRTL 
                ? 'يمكنك تتبع حالة المعاملة من لوحة التحكم'
                : 'You can track the transaction status from the dashboard'
              }
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StepReview;