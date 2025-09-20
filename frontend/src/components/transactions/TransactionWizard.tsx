import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StepBasicInfo from './wizard/StepBasicInfo';
import StepAssignment from './wizard/StepAssignment';
import StepAttachments from './wizard/StepAttachments';
import StepReview from './wizard/StepReview';
import AutoSaveIndicator from '../common/AutoSaveIndicator';
import { TransactionForm } from '../../types/transaction';
import apiClient from '../../services/api/client';
import '../../styles/wizard.css';

interface WizardStep {
  id: number;
  label: string;
  labelAr: string;
  component: React.ComponentType<any>;
}

const steps: WizardStep[] = [
  { id: 1, label: 'Basic Information', labelAr: 'المعلومات الأساسية', component: StepBasicInfo },
  { id: 2, label: 'Assignment & Schedule', labelAr: 'التعيين والجدولة', component: StepAssignment },
  { id: 3, label: 'Attachments', labelAr: 'المرفقات', component: StepAttachments },
  { id: 4, label: 'Review & Submit', labelAr: 'المراجعة والإرسال', component: StepReview },
];

const TransactionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TransactionForm>({
    title: '',
    external_id: '',
    description: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    transaction_type: '',
    priority: 'normal',
    assigned_to: '',
    due_date: '',
    project_id: '',
    department: '',
    tags: '',
    internal_notes: '',
    status: 'draft',
    attachments: [],
    client_visible_attachments: true,
  });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || currentStep === 4) return; // Don't auto-save on review step

    const autoSaveTimer = setInterval(() => {
      saveDraft(true);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [formData, currentStep, autoSaveEnabled]);

  // Load draft if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem('transaction_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData);
        setDraftId(draft.id);
        setCompletedSteps(draft.completedSteps || []);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const saveDraft = useCallback(async (isAutoSave = false) => {
    try {
      const draftData = {
        id: draftId || `draft_${Date.now()}`,
        formData,
        completedSteps,
        savedAt: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('transaction_draft', JSON.stringify(draftData));

      // If not auto-save, also save to backend
      if (!isAutoSave) {
        await apiClient.post('/transactions/drafts/', {
          ...formData,
          is_draft: true,
        });
      }

      if (isAutoSave) {
        setShowAutoSave(true);
        setTimeout(() => setShowAutoSave(false), 3000);
      }

      if (!draftId) {
        setDraftId(draftData.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [formData, completedSteps, draftId]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Validate basic information
      if (!formData.title.trim()) {
        newErrors.title = 'Transaction title is required';
      }
      if (!formData.client_name.trim()) {
        newErrors.client_name = 'Client name is required';
      }
      if (!formData.transaction_type) {
        newErrors.transaction_type = 'Transaction type is required';
      }
      if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
        newErrors.client_email = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const newCompletedSteps = completedSteps.includes(currentStep) 
        ? completedSteps 
        : [...completedSteps, currentStep];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleStepClick = (step: number) => {
    // Only allow clicking on completed steps or the next step
    if (completedSteps.includes(step) || step === currentStep || step === currentStep - 1) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Prepare JSON data for submission (not FormData since we're not uploading files directly)
      const submitData: any = {
        title: formData.title || '',  // Send title as title, not as reference_number
        reference_number: formData.external_id || '',  // External ID is the actual reference number
        client_name: formData.client_name || '',
        client: formData.client_id || null,  // Send client ID if selected from dropdown
        transaction_type: formData.transaction_type || 'standard',
        description: formData.description || formData.internal_notes || '',
        status: formData.status || 'draft',  // Include status field
        priority: formData.priority || 'normal',
        department: formData.department || '',
        project_id: formData.project_id || '',
        tags: formData.tags || '',
        internal_notes: formData.internal_notes || '',
      };

      // Only add optional fields if they have values
      if (formData.due_date) {
        submitData.due_date = formData.due_date;
      }
      
      if (formData.assigned_to) {
        submitData.assigned_to = formData.assigned_to;
      }

      // Submit transaction as JSON first
      const response = await apiClient.post('/transactions/', submitData);

      // If there are attachments, upload them separately
      if (formData.attachments && formData.attachments.length > 0 && response.data.id) {
        const fileFormData = new FormData();
        formData.attachments.forEach((file) => {
          fileFormData.append('files', file);
        });
        fileFormData.append('transaction', response.data.id);

        try {
          await apiClient.post('/attachments/attachments/bulk_upload/', fileFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (fileError) {
          console.error('Error uploading attachments:', fileError);
          // Continue even if file upload fails
        }
      }

      // Clear draft from localStorage
      localStorage.removeItem('transaction_draft');

      // Navigate to transaction detail or list
      navigate(`/transactions/${response.data.id}`);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Failed to submit transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    await saveDraft(false);
    alert('Draft saved successfully!');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      localStorage.removeItem('transaction_draft');
      navigate('/transactions');
    }
  };

  const updateFormData = (updates: Partial<TransactionForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isLastStep = currentStep === steps.length;
  const isFirstStep = currentStep === 1;

  return (
    <div className="transaction-wizard">
      {/* Wizard Steps Header */}
      <div className="wizard-steps">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${
              completedSteps.includes(step.id) ? 'completed' : ''
            }`}
            onClick={() => handleStepClick(step.id)}
          >
            <div className="wizard-step-icon">
              {completedSteps.includes(step.id) ? (
                <i className="bi bi-check-lg"></i>
              ) : (
                step.id
              )}
            </div>
            <div className="wizard-step-label">
              <span className="d-none d-md-inline">
                {localStorage.getItem('language') === 'ar' ? step.labelAr : step.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="wizard-progress">
        <div 
          className="wizard-progress-bar" 
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        <CurrentStepComponent
          formData={formData}
          updateFormData={updateFormData}
          errors={errors}
          setErrors={setErrors}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-navigation">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {!isFirstStep && (
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={handlePrevious}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Previous
              </button>
            )}
          </div>

          <div>
            {!isLastStep && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  <i className="bi bi-save me-2"></i>
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </>
            )}
            {isLastStep && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Submit Transaction
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Auto-save Indicator */}
      <AutoSaveIndicator show={showAutoSave} />
    </div>
  );
};

export default TransactionWizard;