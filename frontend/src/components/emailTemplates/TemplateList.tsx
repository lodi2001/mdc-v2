import React, { useState } from 'react';
import type { EmailTemplate } from '../../types/emailTemplate';
import emailTemplateService from '../../services/api/emailTemplateService';

interface TemplateListProps {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  onSelectTemplate: (template: EmailTemplate) => void;
  onRefresh: () => void;
  isRTL: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onRefresh,
  isRTL
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Get template categories for display
  const categories = emailTemplateService.getTemplateCategories();

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get category label for a template
  const getCategoryLabel = (templateName: string) => {
    const category = categories.find(cat => cat.value === templateName);
    if (category) {
      return isRTL ? category.labelAr : category.label;
    }
    // If no matching category, format the template name
    return templateName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get description for template based on name
  const getTemplateDescription = (templateName: string) => {
    const descriptions: { [key: string]: { en: string; ar: string } } = {
      transaction_created: {
        en: 'When new transaction is created',
        ar: 'عند إنشاء معاملة جديدة'
      },
      status_update: {
        en: 'Transaction status change',
        ar: 'تغيير حالة المعاملة'
      },
      task_assignment: {
        en: 'New task assigned to user',
        ar: 'تعيين مهمة جديدة للمستخدم'
      },
      approval_required: {
        en: 'Approval request notification',
        ar: 'إشعار طلب الموافقة'
      },
      transaction_completed: {
        en: 'Completion notification',
        ar: 'إشعار الإكمال'
      },
      welcome_email: {
        en: 'New user registration',
        ar: 'تسجيل مستخدم جديد'
      },
      password_reset: {
        en: 'Password reset request',
        ar: 'طلب إعادة تعيين كلمة المرور'
      },
      reminder: {
        en: 'Task deadline reminder',
        ar: 'تذكير بموعد المهمة'
      }
    };

    const desc = descriptions[templateName];
    return desc ? (isRTL ? desc.ar : desc.en) : '';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {isRTL ? 'مكتبة القوالب' : 'Template Library'}
          </h5>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={onRefresh}
            title={isRTL ? 'تحديث' : 'Refresh'}
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-bottom">
        <div className="input-group input-group-sm">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder={isRTL ? 'البحث في القوالب...' : 'Search templates...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-body p-0">
        <div
          className="list-group list-group-flush"
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        >
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-envelope-open fs-1"></i>
              <p className="mt-2">
                {searchTerm
                  ? (isRTL ? 'لا توجد قوالب مطابقة' : 'No matching templates')
                  : (isRTL ? 'لا توجد قوالب' : 'No templates available')
                }
              </p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <a
                key={template.id}
                href="#"
                className={`list-group-item list-group-item-action ${
                  selectedTemplate?.id === template.id ? 'active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTemplate(template);
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">
                      {getCategoryLabel(template.name)}
                    </h6>
                    <small className={selectedTemplate?.id === template.id ? 'text-white-50' : 'text-muted'}>
                      {getTemplateDescription(template.name)}
                    </small>
                    {/* Language indicator */}
                    <div className="mt-1">
                      <span className={`badge bg-${template.language === 'ar' ? 'info' : 'primary'}-subtle text-${template.language === 'ar' ? 'info' : 'primary'} me-1`}>
                        {template.language === 'ar' ? 'العربية' : 'English'}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    {template.is_active ? (
                      <span className="badge bg-success-subtle text-success">
                        {isRTL ? 'نشط' : 'Active'}
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary">
                        {isRTL ? 'مسودة' : 'Draft'}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="card-footer text-center text-muted small">
        {isRTL
          ? `${filteredTemplates.length} قالب من ${templates.length}`
          : `${filteredTemplates.length} of ${templates.length} templates`}
      </div>
    </div>
  );
};

export default TemplateList;