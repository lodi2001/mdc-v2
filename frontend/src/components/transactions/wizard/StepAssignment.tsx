import React, { useEffect, useState } from 'react';
import { TransactionForm, DEPARTMENTS } from '../../../types/transaction';
import apiClient from '../../../services/api/client';
import AssignToDropdown from '../../common/AssignToDropdown';

interface StepAssignmentProps {
  formData: TransactionForm;
  updateFormData: (updates: Partial<TransactionForm>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}


const StepAssignment: React.FC<StepAssignmentProps> = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
  const isRTL = localStorage.getItem('language') === 'ar';

  const handleAssigneeSelect = (assignee: any) => {
    updateFormData({
      assigned_to: assignee.id.toString()
    });
    setSelectedAssignee(assignee);

    // Clear any assignment-related errors
    if (errors.assigned_to) {
      const newErrors = { ...errors };
      delete newErrors.assigned_to;
      setErrors(newErrors);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validate that due date is not in the past
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setErrors({ ...errors, due_date: 'Due date cannot be in the past' });
    } else {
      updateFormData({ [name]: value });
      if (errors.due_date) {
        setErrors({ ...errors, due_date: '' });
      }
    }
  };

  return (
    <div className="step-content">
      <h4 className="mb-4">
        {isRTL ? 'التعيين والجدولة' : 'Assignment & Scheduling'}
      </h4>

      <div className="row">
        {/* Assign To */}
        <div className="col-md-6 mb-3">
          <AssignToDropdown
            value={formData.assigned_to}
            onAssigneeSelect={handleAssigneeSelect}
            error={errors.assigned_to}
          />
          <small className="text-muted">
            {isRTL
              ? 'اختياري - يمكن تعيينه لاحقاً'
              : 'Optional - Can be assigned later'
            }
          </small>
        </div>

        {/* Due Date */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
          </label>
          <input
            type="date"
            className={`form-control ${errors.due_date ? 'is-invalid' : ''}`}
            name="due_date"
            value={formData.due_date}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.due_date && (
            <div className="invalid-feedback">{errors.due_date}</div>
          )}
        </div>
      </div>

      <div className="row">
        {/* Project ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'معرف المشروع' : 'Project ID'}
          </label>
          <input
            type="text"
            className="form-control"
            name="project_id"
            value={formData.project_id}
            onChange={handleInputChange}
            placeholder={isRTL ? 'أدخل معرف المشروع (اختياري)' : 'Enter project ID (optional)'}
          />
        </div>

        {/* Department */}
        <div className="col-md-6 mb-3">
          <label className="form-label">
            {isRTL ? 'القسم' : 'Department'}
          </label>
          <select
            className="form-select"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
          >
            <option value="">
              {isRTL ? 'اختر القسم' : 'Select department'}
            </option>
            {DEPARTMENTS.map(dept => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        {/* Tags */}
        <div className="col-12 mb-3">
          <label className="form-label">
            {isRTL ? 'الوسوم' : 'Tags'}
          </label>
          <input
            type="text"
            className="form-control"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder={isRTL 
              ? 'أدخل الوسوم مفصولة بفواصل (مثال: عاجل، مراجعة، المرحلة-2)'
              : 'Enter tags separated by commas (e.g., urgent, review, phase-2)'
            }
          />
          <small className="text-muted">
            {isRTL 
              ? 'الوسوم تساعد في البحث وتصفية المعاملات'
              : 'Tags help in searching and filtering transactions'
            }
          </small>
        </div>
      </div>

      <div className="row">
        {/* Internal Notes */}
        <div className="col-12 mb-3">
          <label className="form-label">
            {isRTL ? 'ملاحظات داخلية' : 'Internal Notes'}
          </label>
          <textarea
            className="form-control"
            name="internal_notes"
            value={formData.internal_notes}
            onChange={handleInputChange}
            rows={3}
            placeholder={isRTL 
              ? 'أدخل ملاحظات داخلية (غير مرئية للعملاء)'
              : 'Enter internal notes (not visible to clients)'
            }
          />
          <small className="text-muted">
            <i className="bi bi-lock-fill me-1"></i>
            {isRTL 
              ? 'هذه الملاحظات للاستخدام الداخلي فقط ولن يتمكن العملاء من رؤيتها'
              : 'These notes are for internal use only and will not be visible to clients'
            }
          </small>
        </div>
      </div>

      {/* Schedule Summary Card */}
      <div className="card bg-light mt-4">
        <div className="card-body">
          <h6 className="card-title">
            <i className="bi bi-calendar-check me-2"></i>
            {isRTL ? 'ملخص الجدولة' : 'Schedule Summary'}
          </h6>
          <div className="row">
            <div className="col-md-6">
              <small className="text-muted d-block">
                {isRTL ? 'معين إلى' : 'Assigned to'}
              </small>
              <p className="mb-2">
                {selectedAssignee
                  ? `${selectedAssignee.full_name} (${selectedAssignee.role})`
                  : formData.assigned_to
                    ? isRTL ? 'محدد' : 'Assigned'
                    : isRTL ? 'غير معين' : 'Not assigned'
                }
              </p>
            </div>
            <div className="col-md-6">
              <small className="text-muted d-block">
                {isRTL ? 'تاريخ الاستحقاق' : 'Due date'}
              </small>
              <p className="mb-2">
                {formData.due_date 
                  ? new Date(formData.due_date).toLocaleDateString(isRTL ? 'ar-QA' : 'en-US')
                  : isRTL ? 'غير محدد' : 'Not set'
                }
              </p>
            </div>
          </div>
          {formData.department && (
            <div>
              <small className="text-muted d-block">
                {isRTL ? 'القسم' : 'Department'}
              </small>
              <p className="mb-0">
                {DEPARTMENTS.find(d => d.value === formData.department)?.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepAssignment;