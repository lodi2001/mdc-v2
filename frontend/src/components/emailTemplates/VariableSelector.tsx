import React, { useState } from 'react';
import emailTemplateService from '../../services/api/emailTemplateService';

interface VariableSelectorProps {
  onSelectVariable: (variable: string) => void;
  isRTL: boolean;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({ onSelectVariable, isRTL }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Get all available template variables
  const variables = emailTemplateService.getTemplateVariables();

  // Filter variables based on search
  const filteredVariables = variables.filter(
    variable =>
      variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVariableClick = (variable: string) => {
    onSelectVariable(variable);
    // Show a brief tooltip to confirm insertion
    setShowTooltip(variable);
    setTimeout(() => setShowTooltip(null), 1500);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          {isRTL ? 'المتغيرات المتاحة' : 'Available Variables'}
        </h6>
      </div>

      <div className="card-body">
        {/* Search Input */}
        <div className="mb-3">
          <div className="input-group input-group-sm">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={isRTL ? 'البحث عن متغير...' : 'Search variables...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-info py-2 px-3 small">
          <i className="bi bi-info-circle me-1"></i>
          {isRTL
            ? 'انقر على المتغير لإدراجه في القالب'
            : 'Click on a variable to insert it into the template'}
        </div>

        {/* Variables Grid */}
        <div className="row g-2">
          {filteredVariables.length === 0 ? (
            <div className="col-12 text-center py-3 text-muted">
              {isRTL ? 'لا توجد متغيرات مطابقة' : 'No matching variables'}
            </div>
          ) : (
            filteredVariables.map((variable) => (
              <div key={variable.key} className="col-12">
                <button
                  className="btn btn-sm btn-outline-primary w-100 text-start position-relative"
                  onClick={() => handleVariableClick(variable.label)}
                  title={variable.description}
                  style={{ fontSize: '0.875rem' }}
                >
                  <code className="me-2">{variable.label}</code>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                    {variable.description}
                  </small>
                  {showTooltip === variable.label && (
                    <span
                      className="position-absolute badge bg-success"
                      style={{
                        top: '50%',
                        right: '10px',
                        transform: 'translateY(-50%)',
                        animation: 'fadeIn 0.3s'
                      }}
                    >
                      {isRTL ? 'تم الإدراج' : 'Inserted'}
                    </span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Common Patterns Section */}
        <div className="mt-4">
          <h6 className="text-muted small mb-2">
            {isRTL ? 'أنماط شائعة' : 'Common Patterns'}
          </h6>
          <div className="d-grid gap-1">
            <button
              className="btn btn-sm btn-outline-secondary text-start"
              onClick={() =>
                handleVariableClick(
                  isRTL
                    ? 'عزيزي {{user_name}}،'
                    : 'Dear {{user_name}},'
                )
              }
            >
              <small>{isRTL ? 'تحية رسمية' : 'Formal greeting'}</small>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary text-start"
              onClick={() =>
                handleVariableClick(
                  'Transaction #{{transaction_id}} - {{transaction_title}}'
                )
              }
            >
              <small>{isRTL ? 'معرف المعاملة مع العنوان' : 'Transaction ID with title'}</small>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary text-start"
              onClick={() =>
                handleVariableClick(
                  isRTL
                    ? 'الموعد النهائي: {{due_date}}'
                    : 'Due by: {{due_date}}'
                )
              }
            >
              <small>{isRTL ? 'تاريخ الاستحقاق' : 'Due date'}</small>
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-4 pt-3 border-top">
          <h6 className="text-muted small mb-2">
            {isRTL ? 'نصائح' : 'Tips'}
          </h6>
          <ul className="small text-muted mb-0">
            <li>
              {isRTL
                ? 'استخدم المتغيرات لجعل رسائل البريد الإلكتروني ديناميكية'
                : 'Use variables to make emails dynamic'}
            </li>
            <li>
              {isRTL
                ? 'سيتم استبدال المتغيرات بالقيم الفعلية عند الإرسال'
                : 'Variables will be replaced with actual values when sent'}
            </li>
            <li>
              {isRTL
                ? 'تأكد من كتابة المتغيرات بشكل صحيح'
                : 'Make sure variables are spelled correctly'}
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default VariableSelector;