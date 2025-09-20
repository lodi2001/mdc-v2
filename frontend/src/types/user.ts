export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: 'admin' | 'editor' | 'client';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department?: string;
  company_name?: string;
  phone?: string;
  national_id?: string;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  permissions?: string[];
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  active_percentage: number;
  editors_count: number;
  editors_percentage: number;
  clients_count: number;
  clients_percentage: number;
  pending_registrations: number;
  monthly_growth: number;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface CreateUserRequest {
  username?: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'editor' | 'client';
  department?: string;
  company_name?: string;
  phone?: string;
  send_welcome_email?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'editor' | 'client';
  status?: 'active' | 'inactive' | 'suspended';
  department?: string;
  company_name?: string;
  phone?: string;
  is_active?: boolean;
}

export interface PendingRegistration {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  national_id: string;
  registration_date: string;
  ip_address?: string;
  user_agent?: string;
  is_verified: boolean;
}

export interface UserApprovalRequest {
  user_id: number;
  action: 'approve' | 'reject';
  reason?: string;
  send_email?: boolean;
}

export interface BulkUserOperation {
  user_ids: number[];
  action: 'activate' | 'deactivate' | 'delete' | 'change_role' | 'export';
  role?: 'admin' | 'editor' | 'client';
  send_notification?: boolean;
}

export interface PasswordResetRequest {
  user_id: number;
  send_email: boolean;
}

// Helper functions
export const getRoleBadgeClass = (role: string): string => {
  const roleClasses: { [key: string]: string } = {
    'admin': 'bg-danger',
    'editor': 'bg-info',
    'client': 'bg-secondary'
  };
  return roleClasses[role] || 'bg-secondary';
};

export const getStatusBadgeClass = (status: string): string => {
  const statusClasses: { [key: string]: string } = {
    'active': 'bg-success',
    'inactive': 'bg-warning',
    'suspended': 'bg-danger',
    'pending': 'bg-info'
  };
  return statusClasses[status] || 'bg-secondary';
};

export const getDepartmentLabel = (department: string): string => {
  const departments: { [key: string]: string } = {
    'engineering': 'Engineering',
    'operations': 'Operations',
    'management': 'Management',
    'architecture': 'Architecture',
    'legal': 'Legal',
    'finance': 'Finance',
    'external': 'External'
  };
  return departments[department] || department;
};

export const generatePassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const getUserInitials = (user: User): string => {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  } else if (user.username) {
    return user.username.substring(0, 2).toUpperCase();
  } else if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return 'U';
};

export const formatLastActive = (lastLogin?: string): string => {
  if (!lastLogin) return 'Never';
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};