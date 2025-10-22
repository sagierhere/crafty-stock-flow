import { api } from '@/lib/api';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export const authService = {
  async login(data: LoginRequest) {
    const response = await api.post<{ token: string }>('/Auth/login', data);
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  async register(data: RegisterRequest) {
    return api.post('/Auth/register', data);
  },

  logout() {
    localStorage.removeItem('authToken');
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
};
