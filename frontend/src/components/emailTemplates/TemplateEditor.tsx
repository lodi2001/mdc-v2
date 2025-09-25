import React, { useState, useEffect, useRef } from 'react';
import type { EmailTemplate, TemplateLanguage } from '../../types/emailTemplate';

interface TemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onInsertVariable: (callback: (variable: string) => void) => void;
  isRTL: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onDelete,
  onInsertVariable,
  isRTL
}) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    language: 'en' as TemplateLanguage,
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  // Refs for textarea elements
  const htmlEditorRef = useRef<HTMLTextAreaElement>(null);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body_html: template.body_html || '',
        body_text: template.body_text || '',
        language: template.language || 'en' as TemplateLanguage,
        is_active: template.is_active !== undefined ? template.is_active : true
      });
      setIsEditing(false);
    }
  }, [template]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template || !onDelete) return;

    const confirmMsg = isRTL
      ? 'هل أنت متأكد من حذف هذا القالب؟'
      : 'Are you sure you want to delete this template?';

    if (window.confirm(confirmMsg)) {
      try {
        await onDelete(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const insertVariableAtCursor = (variable: string) => {
    const activeEditor = activeTab === 'html' ? htmlEditorRef.current : textEditorRef.current;

    if (activeEditor) {
      const start = activeEditor.selectionStart;
      const end = activeEditor.selectionEnd;
      const text = activeEditor.value;
      const newText = text.substring(0, start) + variable + text.substring(end);

      const fieldName = activeTab === 'html' ? 'body_html' : 'body_text';
      setFormData(prev => ({
        ...prev,
        [fieldName]: newText
      }));

      // Set cursor position after inserted variable
      setTimeout(() => {
        activeEditor.focus();
        activeEditor.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);

      setIsEditing(true);
    }
  };

  // Register the insert variable handler
  useEffect(() => {
    onInsertVariable(insertVariableAtCursor);
  }, [activeTab]);

  if (!template) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-5 text-muted">
            <i className="bi bi-envelope fs-1"></i>
            <p className="mt-3">
              {isRTL ? 'اختر قالبًا للتحرير' : 'Select a template to edit'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {isRTL ? 'محرر القالب' : 'Template Editor'}
          </h5>
          <div className="d-flex gap-2">
            {onDelete && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                <i className="bi bi-trash me-1"></i>
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            )}
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={!isEditing || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>
                  {isRTL ? 'حفظ' : 'Save'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                {isRTL ? 'اسم القالب' : 'Template Name'}
              </label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label className="form-label">
                {isRTL ? 'الحالة' : 'Status'}
              </label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="is_active"
                  id="templateStatus"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="templateStatus">
                  {formData.is_active
                    ? (isRTL ? 'نشط' : 'Active')
                    : (isRTL ? 'غير نشط' : 'Inactive')}
                </label>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              {isRTL ? 'الموضوع' : 'Subject'}
            </label>
            <input
              type="text"
              className="form-control"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={isRTL
                ? 'مثال: معاملة جديدة - {{transaction_id}}'
                : 'Example: New Transaction - {{transaction_id}}'}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              {isRTL ? 'محتوى البريد' : 'Email Body'}
            </label>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-2">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'html' ? 'active' : ''}`}
                  onClick={() => setActiveTab('html')}
                >
                  HTML
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  {isRTL ? 'نص عادي' : 'Plain Text'}
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              <div className={`tab-pane ${activeTab === 'html' ? 'show active' : ''}`}>
                <textarea
                  ref={htmlEditorRef}
                  className="form-control font-monospace"
                  name="body_html"
                  value={formData.body_html}
                  onChange={handleInputChange}
                  rows={12}
                  style={{ fontSize: '0.9rem' }}
                  placeholder={isRTL ? 'محتوى HTML...' : 'HTML content...'}
                  dir="ltr"
                />
              </div>
              <div className={`tab-pane ${activeTab === 'text' ? 'show active' : ''}`}>
                <textarea
                  ref={textEditorRef}
                  className="form-control font-monospace"
                  name="body_text"
                  value={formData.body_text}
                  onChange={handleInputChange}
                  rows={12}
                  style={{ fontSize: '0.9rem' }}
                  placeholder={isRTL ? 'نص عادي...' : 'Plain text content...'}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="row">
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sendCopy"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="sendCopy">
                  {isRTL ? 'إرسال نسخة للمدير' : 'Send copy to administrator'}
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allowUnsubscribe"
                />
                <label className="form-check-label" htmlFor="allowUnsubscribe">
                  {isRTL ? 'تضمين رابط إلغاء الاشتراك' : 'Include unsubscribe link'}
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateEditor;