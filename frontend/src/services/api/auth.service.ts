import { api, tokenManager } from './client';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'editor' | 'client';
    company_name?: string;
    language_preference: 'en' | 'ar';
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company_name?: string;
  national_id?: string;
  language_preference?: 'en' | 'ar';
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    status: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

// Authentication Service
class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login/', credentials);
    
    // Store tokens
    tokenManager.setTokens(response.data.access, response.data.refresh);
    
    // Store user data
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refresh = tokenManager.getRefreshToken();
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      tokenManager.clearTokens();
      localStorage.removeItem('user');
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register/', data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<any> {
    const response = await api.post('/auth/verify-email/', { token });
    return response.data;
  }

  async resendVerification(email: string): Promise<any> {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<any> {
    const response = await api.post('/auth/reset-password/', data);
    return response.data;
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<any> {
    const response = await api.post('/auth/reset-password/confirm/', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  async refreshToken(): Promise<string> {
    const refresh = tokenManager.getRefreshToken();
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ access: string }>('/auth/token/refresh/', {
      refresh,
    });

    const { access } = response.data;
    const currentRefresh = tokenManager.getRefreshToken();
    if (currentRefresh) {
      tokenManager.setTokens(access, currentRefresh);
    }

    return access;
  }

  async getProfile(): Promise<any> {
    const response = await api.get('/auth/profile/');
    return response.data;
  }

  async updateProfile(data: any): Promise<any> {
    const response = await api.patch('/auth/profile/', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  isAuthenticated(): boolean {
    const token = tokenManager.getAccessToken();
    return token !== null && !tokenManager.isTokenExpired(token);
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUserRole(): 'admin' | 'editor' | 'client' | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  hasPermission(requiredRole: 'admin' | 'editor' | 'client'): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    const roleHierarchy = {
      admin: 3,
      editor: 2,
      client: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

export const authService = new AuthService();

// Export a simple apiRequest helper for making authenticated requests
export const apiRequest = async (url: string, method: string = 'GET', body?: any) => {
  const token = tokenManager.getAccessToken();
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
  const fullUrl = url.startsWith('/api/') 
    ? url.replace('/api/', `${API_BASE_URL}/`)
    : `${API_BASE_URL}${url}`;

  return fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

export default authService;