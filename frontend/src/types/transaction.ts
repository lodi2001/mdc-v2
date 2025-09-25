export interface TransactionForm {
  // Basic Information
  title: string;
  external_id: string;
  description: string;
  client_id?: number;  // Client ID for linking to user
  client_name: string;
  client_email: string;
  client_phone: string;
  company_name?: string;  // Company name from client data
  transaction_type: string;
  priority: string;

  // Assignment & Schedule
  assigned_to: string;
  due_date: string;
  project_id: string;
  department: string;
  tags: string;
  internal_notes: string;

  // Status
  status: string;

  // Files
  attachments?: File[];
  client_visible_attachments?: boolean;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  reference_number: string;
  title: string;
  external_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  transaction_type: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by: number;
  created_by_name: string;
  department?: string;
  project_id?: string;
  tags?: string[];
  internal_notes?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  attachments_count?: number;
  comments_count?: number;
  status_display?: string;
  priority_display?: string;
  attachments?: Array<{
    id: number;
    original_filename: string;
    download_url: string;
    file_size_formatted: string;
    created_at: string;
    description?: string;
  }>;
}

export const TRANSACTION_TYPES = [
  { value: 'document_review', label: 'Document Review' },
  { value: 'approval_request', label: 'Approval Request' },
  { value: 'permit_application', label: 'Permit Application' },
  { value: 'license_renewal', label: 'License Renewal' },
  { value: 'inspection_request', label: 'Inspection Request' },
  { value: 'submission', label: 'Submission' },
  { value: 'information_request', label: 'Information Request' },
  { value: 'status_update', label: 'Status Update' },
  { value: 'task_assignment', label: 'Task Assignment' },
  { value: 'review_completed', label: 'Review Completed' },
];

export const TRANSACTION_CATEGORIES = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'construction', label: 'Construction' },
  { value: 'planning', label: 'Planning' },
  { value: 'consultation', label: 'Consultation' },
];

export const TRANSACTION_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'normal', label: 'Normal', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'danger' },
];

export const TRANSACTION_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'submitted', label: 'Submitted', color: 'primary' },
  { value: 'under_review', label: 'Under Review', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'info' },
  { value: 'in_progress', label: 'In Progress', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'danger' },
  { value: 'cancelled', label: 'Cancelled', color: 'danger' },
  { value: 'on_hold', label: 'On Hold', color: 'secondary' },
];

export const DEPARTMENTS = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'legal', label: 'Legal' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
];

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_TRANSACTION = 20;