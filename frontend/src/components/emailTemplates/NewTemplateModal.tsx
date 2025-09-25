import React, { useState } from 'react';
import type { CreateEmailTemplateRequest, TemplateLanguage } from '../../types/emailTemplate';
import emailTemplateService from '../../services/api/emailTemplateService';
import { DEFAULT_TEMPLATES } from '../../types/emailTemplate';

interface NewTemplateModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (template: CreateEmailTemplateRequest) => Promise<void>;
  isRTL: boolean;
}

const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  show,
  onClose,
  onCreate,
  isRTL
}) => {
  const [formData, setFormData] = useState({
    name: '',
    templateType: '',
    description: '',
    language: 'en' as TemplateLanguage,
    useDefaultTemplate: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = emailTemplateService.getTemplateCategories();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'اسم القالب مطلوب' : 'Template name is required';
    }

    if (!formData.templateType) {
      newErrors.templateType = isRTL ? 'نوع القالب مطلوب' : 'Template type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      // Get default template if selected
      let templateData: CreateEmailTemplateRequest;

      if (formData.useDefaultTemplate && formData.templateType) {
        const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.name === formData.templateType);
        if (defaultTemplate) {
          templateData = {
            name: formData.name,
            subject: defaultTemplate.subject || '',
            body_html: defaultTemplate.body_html || '',
            body_text: defaultTemplate.body_text || '',
            language: formData.language,
            is_active: true
          };
        } else {
          // Create empty template
          templateData = {
            name: formData.name,
            subject: `${formData.name} - {{transaction_id}}`,
            body_html: '<p>Dear {{user_name}},</p>\n<p>Your template content here...</p>',
            body_text: 'Dear {{user_name}},\n\nYour template content here...',
            language: formData.language,
            is_active: true
          };
        }
      } else {
        // Create empty template
        templateData = {
          name: formData.name,
          subject: '',
          body_html: '',
          body_text: '',
          language: formData.language,
          is_active: false
        };
      }

      await onCreate(templateData);

      // Reset form
      setFormData({
        name: '',
        templateType: '',
        description: '',
        language: 'en' as TemplateLanguage,
        useDefaultTemplate: true
      });

      onClose();
    } catch (error) {
      console.error('Error creating template:', error);
      alert(isRTL ? 'فشل إنشاء القالب' : 'Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isRTL ? 'إنشاء قالب جديد' : 'Create New Template'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={isCreating}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label required-field">
                    {isRTL ? 'اسم القالب' : 'Template Name'}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={isRTL ? 'أدخل اسم القالب' : 'Enter template name'}
                    required
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label required-field">
                    {isRTL ? 'نوع القالب' : 'Template Type'}
                  </label>
                  <select
                    className={`form-select ${errors.templateType ? 'is-invalid' : ''}`}
                    name="templateType"
                    value={formData.templateType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">
                      {isRTL ? 'اختر النوع...' : 'Select type...'}
                    </option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {isRTL ? category.labelAr : category.label}
                      </option>
                    ))}
                  </select>
                  {errors.templateType && (
                    <div className="invalid-feedback">{errors.templateType}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'اللغة' : 'Language'}
                  </label>
                  <select
                    className="form-select"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'الوصف' : 'Description'}
                  </label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={isRTL
                      ? 'وصف اختياري للقالب'
                      : 'Optional description for the template'}
                  />
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="useDefaultTemplate"
                    id="useDefaultTemplate"
                    checked={formData.useDefaultTemplate}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="useDefaultTemplate">
                    {isRTL
                      ? 'استخدام محتوى القالب الافتراضي'
                      : 'Use default template content'}
                  </label>
                  <small className="form-text text-muted d-block">
                    {isRTL
                      ? 'سيتم ملء القالب بمحتوى نموذجي يمكنك تعديله لاحقًا'
                      : 'Template will be pre-filled with sample content you can edit later'}
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isCreating}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {isRTL ? 'جاري الإنشاء...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      {isRTL ? 'إنشاء القالب' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewTemplateModal;