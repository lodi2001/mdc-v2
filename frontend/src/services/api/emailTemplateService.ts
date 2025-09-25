/**
 * Email Template API Service
 */

import apiClient from './client';
import type {
  EmailTemplate,
  EmailTemplateFilter,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  TemplateTestRequest,
  TemplateTestResponse
} from '../../types/emailTemplate';

const ENDPOINT = '/notifications/templates';

export const emailTemplateService = {
  /**
   * Get all email templates
   */
  async getTemplates(filters?: EmailTemplateFilter): Promise<{ results: EmailTemplate[]; count: number }> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.language) params.append('language', filters.language);
      if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters.search) params.append('search', filters.search);
    }

    const response = await apiClient.get(`${ENDPOINT}/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single email template by ID
   */
  async getTemplate(id: number): Promise<EmailTemplate> {
    const response = await apiClient.get(`${ENDPOINT}/${id}/`);
    return response.data;
  },

  /**
   * Create a new email template
   */
  async createTemplate(data: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    const response = await apiClient.post(`${ENDPOINT}/`, data);
    return response.data;
  },

  /**
   * Update an existing email template
   */
  async updateTemplate(id: number, data: UpdateEmailTemplateRequest): Promise<EmailTemplate> {
    const response = await apiClient.patch(`${ENDPOINT}/${id}/`, data);
    return response.data;
  },

  /**
   * Delete an email template
   */
  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}/`);
  },

  /**
   * Preview a rendered email template with test variables
   */
  async previewTemplate(id: number, data: TemplatePreviewRequest): Promise<TemplatePreviewResponse> {
    const response = await apiClient.post(`${ENDPOINT}/${id}/preview/`, data);
    return response.data;
  },

  /**
   * Send a test email using the template
   */
  async testTemplate(id: number, data: TemplateTestRequest): Promise<TemplateTestResponse> {
    const response = await apiClient.post(`${ENDPOINT}/${id}/test_template/`, data);
    return response.data;
  },

  /**
   * Duplicate an existing template
   */
  async duplicateTemplate(id: number, name: string): Promise<EmailTemplate> {
    const response = await apiClient.post(`${ENDPOINT}/${id}/duplicate/`, { name });
    return response.data;
  },

  /**
   * Toggle template active status
   */
  async toggleTemplateStatus(id: number, is_active: boolean): Promise<EmailTemplate> {
    const response = await apiClient.patch(`${ENDPOINT}/${id}/`, { is_active });
    return response.data;
  },

  /**
   * Export templates to JSON
   */
  async exportTemplates(ids?: number[]): Promise<Blob> {
    const params = ids ? `?ids=${ids.join(',')}` : '';
    const response = await apiClient.get(`${ENDPOINT}/export/${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Import templates from JSON
   */
  async importTemplates(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${ENDPOINT}/import/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get template categories/types
   */
  getTemplateCategories() {
    return [
      { value: 'transaction_created', label: 'Transaction Created', labelAr: 'تم إنشاء المعاملة' },
      { value: 'status_update', label: 'Status Update', labelAr: 'تحديث الحالة' },
      { value: 'task_assignment', label: 'Task Assignment', labelAr: 'تعيين المهمة' },
      { value: 'approval_required', label: 'Approval Required', labelAr: 'مطلوب الموافقة' },
      { value: 'transaction_completed', label: 'Transaction Completed', labelAr: 'اكتملت المعاملة' },
      { value: 'welcome_email', label: 'Welcome Email', labelAr: 'بريد الترحيب' },
      { value: 'password_reset', label: 'Password Reset', labelAr: 'إعادة تعيين كلمة المرور' },
      { value: 'reminder', label: 'Reminder', labelAr: 'تذكير' },
      { value: 'custom', label: 'Custom', labelAr: 'مخصص' }
    ];
  },

  /**
   * Get available template variables
   */
  getTemplateVariables() {
    return [
      { key: 'user_name', label: '{{user_name}}', description: 'Name of the user' },
      { key: 'user_email', label: '{{user_email}}', description: 'Email of the user' },
      { key: 'transaction_id', label: '{{transaction_id}}', description: 'Transaction ID' },
      { key: 'transaction_title', label: '{{transaction_title}}', description: 'Title of the transaction' },
      { key: 'transaction_type', label: '{{transaction_type}}', description: 'Type of transaction' },
      { key: 'priority', label: '{{priority}}', description: 'Priority level' },
      { key: 'status', label: '{{status}}', description: 'Current status' },
      { key: 'created_date', label: '{{created_date}}', description: 'Date when created' },
      { key: 'created_by', label: '{{created_by}}', description: 'Creator name' },
      { key: 'description', label: '{{description}}', description: 'Description text' },
      { key: 'due_date', label: '{{due_date}}', description: 'Due date' },
      { key: 'assignee', label: '{{assignee}}', description: 'Assigned user' },
      { key: 'department', label: '{{department}}', description: 'Department name' },
      { key: 'link', label: '{{link}}', description: 'Direct link to transaction' },
      { key: 'company_name', label: '{{company_name}}', description: 'Company/Client name' }
    ];
  },

  /**
   * Generate sample data for template preview
   */
  getSampleData() {
    return {
      user_name: 'John Doe',
      user_email: 'john@example.com',
      transaction_id: 'TRX-2024-0001',
      transaction_title: 'Technical Review Request',
      transaction_type: 'Review',
      priority: 'High',
      status: 'In Progress',
      created_date: new Date().toLocaleDateString(),
      created_by: 'Admin User',
      description: 'This transaction requires immediate technical review for the project specifications.',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      assignee: 'Jane Smith',
      department: 'Technical Department',
      link: `${window.location.origin}/transactions/123`,
      company_name: 'ABC Corporation'
    };
  }
};

export default emailTemplateService;