import apiClient from './client';
import {
  User,
  UserListResponse,
  UserStatistics,
  UserFilter,
  CreateUserRequest,
  UpdateUserRequest,
  PendingRegistration,
  UserApprovalRequest,
  BulkUserOperation,
  PasswordResetRequest
} from '../../types/user';

class UserService {
  private baseUrl = '/users';

  // Get list of users with filtering and pagination
  async getUsers(filters?: UserFilter): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.department) params.append('department', filters.department);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        if (filters.ordering) params.append('ordering', filters.ordering);
      }
      
      const response = await apiClient.get<UserListResponse>(`${this.baseUrl}/?${params.toString()}`);
      
      // Ensure response has the expected structure
      return {
        results: response.data?.results || [],
        count: response.data?.count || 0,
        next: response.data?.next || null,
        previous: response.data?.previous || null
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return safe default structure
      return {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
    }
  }

  // Get single user by ID
  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<User>(`${this.baseUrl}/${id}/`);
    return response.data;
  }

  // Create new user
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>(`${this.baseUrl}/`, data);
    return response.data;
  }

  // Update existing user
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`${this.baseUrl}/${id}/`, data);
    return response.data;
  }

  // Partial update user
  async patchUser(id: number, data: Partial<UpdateUserRequest>): Promise<User> {
    const response = await apiClient.patch<User>(`${this.baseUrl}/${id}/`, data);
    return response.data;
  }

  // Delete user
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/`);
  }

  // Get user statistics
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await apiClient.get<UserStatistics>(`${this.baseUrl}/statistics/`);
      return response.data || {
        total_users: 0,
        active_users: 0,
        active_percentage: 0,
        editors_count: 0,
        editors_percentage: 0,
        clients_count: 0,
        clients_percentage: 0,
        pending_registrations: 0,
        monthly_growth: 0
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      // Return safe default structure
      return {
        total_users: 0,
        active_users: 0,
        active_percentage: 0,
        editors_count: 0,
        editors_percentage: 0,
        clients_count: 0,
        clients_percentage: 0,
        pending_registrations: 0,
        monthly_growth: 0
      };
    }
  }

  // Get pending registrations
  async getPendingRegistrations(): Promise<PendingRegistration[]> {
    try {
      const response = await apiClient.get<PendingRegistration[]>(`${this.baseUrl}/pending/`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      return [];
    }
  }

  // Approve user registration
  async approveUser(userId: number, sendEmail: boolean = true): Promise<User> {
    const response = await apiClient.post<User>(`${this.baseUrl}/${userId}/approve/`, {
      send_email: sendEmail
    });
    return response.data;
  }

  // Reject user registration
  async rejectUser(userId: number, reason?: string, sendEmail: boolean = true): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${userId}/reject/`, {
      reason,
      send_email: sendEmail
    });
  }

  // Bulk approve users
  async bulkApproveUsers(userIds: number[], sendEmail: boolean = true): Promise<{ approved: number; failed: number }> {
    const response = await apiClient.post<{ approved: number; failed: number }>(`${this.baseUrl}/bulk-approve/`, {
      user_ids: userIds,
      send_email: sendEmail
    });
    return response.data;
  }

  // Reset user password
  async resetUserPassword(userId: number, sendEmail: boolean = true): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`${this.baseUrl}/${userId}/reset_password/`, {
      send_email: sendEmail
    });
    return response.data;
  }

  // Change user status
  async changeUserStatus(userId: number, status: 'active' | 'inactive' | 'suspended'): Promise<User> {
    const response = await apiClient.post<User>(`${this.baseUrl}/${userId}/change_status/`, {
      status
    });
    return response.data;
  }

  // Bulk operations
  async bulkOperation(operation: BulkUserOperation): Promise<{ success: number; failed: number }> {
    const response = await apiClient.post<{ success: number; failed: number }>(`${this.baseUrl}/bulk-operation/`, operation);
    return response.data;
  }

  // Export users
  async exportUsers(filters?: UserFilter, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
    }
    
    params.append('format', format);
    
    const response = await apiClient.get(`${this.baseUrl}/export/?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(`${this.baseUrl}/me/`);
    return response.data;
  }

  // Update current user profile
  async updateCurrentUser(data: Partial<UpdateUserRequest>): Promise<User> {
    const response = await apiClient.patch<User>(`${this.baseUrl}/me/`, data);
    return response.data;
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ exists: boolean }>(`${this.baseUrl}/check-email/`, {
        params: { email }
      });
      return response.data.exists;
    } catch {
      return false;
    }
  }

  // Get user permissions
  async getUserPermissions(userId: number): Promise<string[]> {
    const response = await apiClient.get<{ permissions: string[] }>(`${this.baseUrl}/${userId}/permissions/`);
    return response.data.permissions;
  }

  // Update user permissions
  async updateUserPermissions(userId: number, permissions: string[]): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${userId}/permissions/`, { permissions });
  }

  // Get user activity log
  async getUserActivityLog(userId: number, page: number = 1): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${userId}/activity-log/`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      // Return mock data for now
      return {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
    }
  }

  // Export user data
  async exportUserData(userId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${userId}/export/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      // Create a mock CSV blob
      const csvContent = 'ID,Name,Email,Role,Status\n' +
        `${userId},User Name,user@example.com,client,active`;
      return new Blob([csvContent], { type: 'text/csv' });
    }
  }

  // Send message to user
  async sendMessageToUser(userId: number, subject: string, message: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${userId}/send-message/`, {
      subject,
      message
    });
  }

  // Generate temporary password
  generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export default new UserService();