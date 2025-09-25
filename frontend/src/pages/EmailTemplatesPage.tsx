import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import TemplateList from '../components/emailTemplates/TemplateList';
import TemplateEditor from '../components/emailTemplates/TemplateEditor';
import TemplatePreview from '../components/emailTemplates/TemplatePreview';
import VariableSelector from '../components/emailTemplates/VariableSelector';
import NewTemplateModal from '../components/emailTemplates/NewTemplateModal';
import emailTemplateService from '../services/api/emailTemplateService';
import type { EmailTemplate, CreateEmailTemplateRequest } from '../types/emailTemplate';

const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');

  const isRTL = localStorage.getItem('language') === 'ar';
  const insertVariableRef = useRef<(variable: string) => void>(() => {});

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await emailTemplateService.getTemplates();
      setTemplates(response.results);

      // Select first template if available
      if (response.results.length > 0 && !selectedTemplate) {
        setSelectedTemplate(response.results[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      alert(isRTL ? 'فشل تحميل القوالب' : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setActiveView('editor'); // Switch to editor when selecting a template
  };

  const handleCreateTemplate = async (data: CreateEmailTemplateRequest) => {
    try {
      const newTemplate = await emailTemplateService.createTemplate(data);
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate);
      setShowNewModal(false);
      alert(isRTL ? 'تم إنشاء القالب بنجاح' : 'Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  const handleUpdateTemplate = async (data: Partial<EmailTemplate>) => {
    if (!selectedTemplate) return;

    try {
      const updatedTemplate = await emailTemplateService.updateTemplate(selectedTemplate.id, data);

      // Update templates list
      setTemplates(templates.map(t =>
        t.id === updatedTemplate.id ? updatedTemplate : t
      ));
      setSelectedTemplate(updatedTemplate);

      alert(isRTL ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      alert(isRTL ? 'فشل حفظ القالب' : 'Failed to save template');
      throw error;
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await emailTemplateService.deleteTemplate(id);

      // Remove from templates list
      setTemplates(templates.filter(t => t.id !== id));

      // Clear selection or select another template
      if (selectedTemplate?.id === id) {
        const remaining = templates.filter(t => t.id !== id);
        setSelectedTemplate(remaining.length > 0 ? remaining[0] : null);
      }

      alert(isRTL ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(isRTL ? 'فشل حذف القالب' : 'Failed to delete template');
      throw error;
    }
  };

  const handleInsertVariable = (callback: (variable: string) => void) => {
    insertVariableRef.current = callback;
  };

  const handleVariableSelect = (variable: string) => {
    insertVariableRef.current(variable);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
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
            <h2>{isRTL ? 'قوالب البريد الإلكتروني' : 'Email Templates'}</h2>
            <p className="text-muted">
              {isRTL
                ? 'إدارة قوالب إشعارات البريد الإلكتروني للنظام'
                : 'Manage system email notification templates'}
            </p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              {isRTL ? 'قالب جديد' : 'New Template'}
            </button>
          </div>
        </div>

        <div className="row">
          {/* Left Panel - Template List */}
          <div className="col-md-3">
            <TemplateList
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              onRefresh={loadTemplates}
              isRTL={isRTL}
            />
          </div>

          {/* Middle Panel - Editor/Preview */}
          <div className="col-md-6">
            {/* View Toggle */}
            <div className="mb-3">
              <div className="btn-group w-100">
                <button
                  className={`btn ${activeView === 'editor' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('editor')}
                >
                  <i className="bi bi-pencil-square me-2"></i>
                  {isRTL ? 'محرر' : 'Editor'}
                </button>
                <button
                  className={`btn ${activeView === 'preview' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('preview')}
                >
                  <i className="bi bi-eye me-2"></i>
                  {isRTL ? 'معاينة' : 'Preview'}
                </button>
              </div>
            </div>

            {/* Content Area */}
            {activeView === 'editor' ? (
              <TemplateEditor
                template={selectedTemplate}
                onSave={handleUpdateTemplate}
                onDelete={handleDeleteTemplate}
                onInsertVariable={handleInsertVariable}
                isRTL={isRTL}
              />
            ) : (
              <TemplatePreview
                template={selectedTemplate}
                isRTL={isRTL}
              />
            )}
          </div>

          {/* Right Panel - Variable Selector */}
          <div className="col-md-3">
            <VariableSelector
              onSelectVariable={handleVariableSelect}
              isRTL={isRTL}
            />
          </div>
        </div>

        {/* New Template Modal */}
        <NewTemplateModal
          show={showNewModal}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateTemplate}
          isRTL={isRTL}
        />
      </div>
    </Layout>
  );
};

export default EmailTemplatesPage;
