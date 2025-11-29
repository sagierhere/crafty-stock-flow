import { AUTH_TOKEN_KEY } from '@/constants/auth';

// Read API base URL from environment (Vite uses `import.meta.env` for runtime builds).
// Set `VITE_API_BASE_URL` when building the frontend, e.g.:
// VITE_API_BASE_URL="https://api.example.com/api" npm run build
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://localhost:7240/api';

export const api = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return JSON.parse(text) as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      return text as unknown as T;
    }
  },

  get: <T>(endpoint: string): Promise<T> => {
    return api.request<T>(endpoint);
  },

  post: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return api.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return api.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: <T>(endpoint: string): Promise<T> => {
    return api.request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};
