import React from 'react';
import { TransactionForm, TRANSACTION_TYPES, TRANSACTION_PRIORITIES, TRANSACTION_STATUSES } from '../../../types/transaction';
import ClientSearchDropdown from '../../common/ClientSearchDropdown';

interface StepBasicInfoProps {
  formData: TransactionForm;
  updateFormData: (updates: Partial<TransactionForm>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleClientSelect = (client: any) => {
    // Update form with client information
    updateFormData({
      client_name: client.full_name,
      client_email: client.email,
      client_phone: client.phone,
      client_id: client.id,
      company_name: client.company_name
    });

    // Clear any client-related errors
    const newErrors = { ...errors };
    delete newErrors.client_name;
    delete newErrors.client_email;
    delete newErrors.client_phone;
    setErrors(newErrors);
  };

  const isRTL = localStorage.getItem('language') === 'ar';

  return (
    <div className="step-content">
      <h4 className="mb-4">
        {isRTL ? 'معلومات المعاملة الأساسية' : 'Basic Transaction Information'}
      </h4>

      <div className="row">
        {/* Transaction Title */}
        <div className="col-md-6 mb-3">
          <label className="form-label required-field">
            {isRTL ? 'عنوان المعاملة' : 'Transaction Title'}
          </label>
          <input
            type="text"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder={isRTL ? 'أدخل عنوان المعاملة' : 'Enter transaction title'}
            required
          />
          {errors.title && (
            <div className="invalid-feedback">{errors.title}</div>
          )}
        </div>

        {/* External Reference ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'المرجع الخارجي' : 'External Reference ID'}
          </label>
          <input
            type="text"
            className="form-control"
            name="external_id"
            value={formData.external_id}
            onChange={handleInputChange}
            placeholder={isRTL ? 'مثال: REF-2024-XXXX' : 'e.g., REF-2024-XXXX'}
          />
        </div>
      </div>

      <div className="row">
        {/* Description */}
        <div className="col-12 mb-3">
          <label className="form-label">
            {isRTL ? 'الوصف' : 'Description'}
          </label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder={isRTL ? 'أدخل وصف تفصيلي للمعاملة' : 'Enter detailed description of the transaction'}
          />
        </div>
      </div>

      <div className="row">
        {/* Client Selection */}
        <div className="col-md-6 mb-3">
          <ClientSearchDropdown
            value={formData.client_name}
            onClientSelect={handleClientSelect}
            error={errors.client_name}
            required
          />
        </div>

        {/* Priority */}
        <div className="col-md-6 mb-3">
          <label className="form-label required-field">
            {isRTL ? 'الأولوية' : 'Priority'}
          </label>
          <select
            className="form-select"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
          >
            {TRANSACTION_PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        {/* Status */}
        <div className="col-md-6 mb-3">
          <label className="form-label required-field">
            {isRTL ? 'الحالة' : 'Status'}
          </label>
          <select
            className="form-select"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            {TRANSACTION_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <small className="form-text text-muted">
            {isRTL
              ? 'اختر الحالة الأولية للمعاملة. يمكن تغييرها لاحقاً.'
              : 'Select the initial status for the transaction. This can be changed later.'
            }
          </small>
        </div>
      </div>

      <div className="row">
        {/* Client Email (Auto-filled) */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'البريد الإلكتروني للعميل' : 'Client Email'}
          </label>
          <input
            type="email"
            className={`form-control ${errors.client_email ? 'is-invalid' : ''}`}
            name="client_email"
            value={formData.client_email}
            onChange={handleInputChange}
            placeholder={isRTL ? 'سيتم ملؤه تلقائياً عند اختيار العميل' : 'Will be auto-filled when client is selected'}
            readOnly={!!formData.client_id}
          />
          {errors.client_email && (
            <div className="invalid-feedback">{errors.client_email}</div>
          )}
          {formData.client_id && (
            <small className="form-text text-muted">
              <i className="bi bi-info-circle me-1"></i>
              {isRTL ? 'تم ملؤه تلقائياً من بيانات العميل' : 'Auto-filled from client data'}
            </small>
          )}
        </div>

        {/* Client Phone (Auto-filled) */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'رقم هاتف العميل' : 'Client Phone'}
          </label>
          <input
            type="tel"
            className="form-control"
            name="client_phone"
            value={formData.client_phone}
            onChange={handleInputChange}
            placeholder={isRTL ? 'سيتم ملؤه تلقائياً عند اختيار العميل' : 'Will be auto-filled when client is selected'}
            readOnly={!!formData.client_id}
          />
          {formData.client_id && (
            <small className="form-text text-muted">
              <i className="bi bi-info-circle me-1"></i>
              {isRTL ? 'تم ملؤه تلقائياً من بيانات العميل' : 'Auto-filled from client data'}
            </small>
          )}
        </div>
      </div>

      <div className="row">
        {/* Transaction Type */}
        <div className="col-md-6 mb-3">
          <label className="form-label required-field">
            {isRTL ? 'نوع المعاملة' : 'Transaction Type'}
          </label>
          <select
            className={`form-select ${errors.transaction_type ? 'is-invalid' : ''}`}
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleInputChange}
            required
          >
            <option value="">
              {isRTL ? 'اختر النوع' : 'Select type'}
            </option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.transaction_type && (
            <div className="invalid-feedback">{errors.transaction_type}</div>
          )}
        </div>

      </div>

      {/* Info Alert */}
      <div className="alert alert-info mt-3">
        <i className="bi bi-info-circle me-2"></i>
        {isRTL 
          ? 'الحقول المطلوبة محددة بعلامة (*). يرجى التأكد من ملء جميع الحقول المطلوبة قبل المتابعة.'
          : 'Required fields are marked with (*). Please ensure all required fields are filled before proceeding.'
        }
      </div>
    </div>
  );
};

export default StepBasicInfo;