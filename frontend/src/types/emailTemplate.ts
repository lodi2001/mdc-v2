/**
 * Email Template types and interfaces
 */

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: TemplateVariables;
  language: TemplateLanguage;
  language_display?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  updated_by?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_by_name?: string;
}

export interface TemplateVariables {
  [key: string]: {
    description: string;
    example?: string;
    required?: boolean;
  };
}

export enum TemplateLanguage {
  Arabic = 'ar',
  English = 'en'
}

export enum TemplateStatus {
  Active = 'active',
  Draft = 'draft',
  Inactive = 'inactive'
}

export enum TemplateCategory {
  TransactionCreated = 'transaction_created',
  StatusUpdate = 'status_update',
  TaskAssignment = 'task_assignment',
  ApprovalRequired = 'approval_required',
  TransactionCompleted = 'transaction_completed',
  WelcomeEmail = 'welcome_email',
  PasswordReset = 'password_reset',
  Reminder = 'reminder',
  Custom = 'custom'
}

export interface TemplatePreviewRequest {
  test_variables: Record<string, any>;
}

export interface TemplatePreviewResponse {
  subject: string;
  html_body: string;
  text_body: string;
}

export interface TemplateTestRequest {
  recipient_email: string;
  test_variables?: Record<string, any>;
}

export interface TemplateTestResponse {
  message: string;
  recipient_email: string;
}

export interface EmailTemplateFilter {
  language?: TemplateLanguage;
  is_active?: boolean;
  search?: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables?: TemplateVariables;
  language: TemplateLanguage;
  is_active?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  variables?: TemplateVariables;
  language?: TemplateLanguage;
  is_active?: boolean;
}

// Common template variables used across the system
export const COMMON_TEMPLATE_VARIABLES = {
  user_name: {
    tag: '{{user_name}}',
    description: 'Name of the user',
    example: 'John Doe'
  },
  user_email: {
    tag: '{{user_email}}',
    description: 'Email of the user',
    example: 'john@example.com'
  },
  transaction_id: {
    tag: '{{transaction_id}}',
    description: 'Transaction ID',
    example: 'TRX-2024-0001'
  },
  transaction_title: {
    tag: '{{transaction_title}}',
    description: 'Title of the transaction',
    example: 'Technical Review Request'
  },
  transaction_type: {
    tag: '{{transaction_type}}',
    description: 'Type of transaction',
    example: 'Review'
  },
  priority: {
    tag: '{{priority}}',
    description: 'Priority level',
    example: 'High'
  },
  status: {
    tag: '{{status}}',
    description: 'Current status',
    example: 'In Progress'
  },
  created_date: {
    tag: '{{created_date}}',
    description: 'Date when created',
    example: 'Jan 25, 2024'
  },
  created_by: {
    tag: '{{created_by}}',
    description: 'Creator name',
    example: 'Admin User'
  },
  description: {
    tag: '{{description}}',
    description: 'Description text',
    example: 'This transaction requires...'
  },
  due_date: {
    tag: '{{due_date}}',
    description: 'Due date',
    example: 'Feb 1, 2024'
  },
  assignee: {
    tag: '{{assignee}}',
    description: 'Assigned user',
    example: 'Jane Smith'
  },
  department: {
    tag: '{{department}}',
    description: 'Department name',
    example: 'Technical Department'
  },
  link: {
    tag: '{{link}}',
    description: 'Direct link to transaction',
    example: 'https://system.com/transaction/123'
  },
  company_name: {
    tag: '{{company_name}}',
    description: 'Company/Client name',
    example: 'ABC Corporation'
  }
};

// Default template configurations
export const DEFAULT_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    name: 'transaction_created',
    subject: 'New Transaction Created - {{transaction_id}}',
    body_html: `<p>Dear {{user_name}},</p>
<p>A new transaction has been created with the following details:</p>
<ul>
  <li><strong>Transaction ID:</strong> {{transaction_id}}</li>
  <li><strong>Title:</strong> {{transaction_title}}</li>
  <li><strong>Type:</strong> {{transaction_type}}</li>
  <li><strong>Priority:</strong> {{priority}}</li>
  <li><strong>Created Date:</strong> {{created_date}}</li>
  <li><strong>Created By:</strong> {{created_by}}</li>
</ul>
<p><strong>Description:</strong><br>{{description}}</p>
<p>Please log in to the system to view more details and take necessary actions.</p>
<p>Best regards,<br>MDC Transaction Tracking System</p>
<hr>
<small>This is an automated notification. Please do not reply to this email.</small>`,
    body_text: `Dear {{user_name}},

A new transaction has been created with the following details:

Transaction ID: {{transaction_id}}
Title: {{transaction_title}}
Type: {{transaction_type}}
Priority: {{priority}}
Created Date: {{created_date}}
Created By: {{created_by}}

Description:
{{description}}

Please log in to the system to view more details and take necessary actions.

Best regards,
MDC Transaction Tracking System

---
This is an automated notification. Please do not reply to this email.`,
    is_active: true
  }
];