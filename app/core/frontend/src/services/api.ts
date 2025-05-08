// Utiliser la variable d'environnement injectée par Docker
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('[API Service] Using API URL:', API_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      console.log(`[API] Making ${options.method} request to: ${url}`);
      
      if (options.body) {
        console.log(`[API] Request body:`, options.body);
      }
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors'
      });
      
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      
      // Traiter différents types de réponses
      if (response.status === 204) {
        return { data: {} as T };
      }
      
      let data;
      try {
        const text = await response.text();
        
        if (text && text.trim()) {
          data = JSON.parse(text);
        } else {
          data = {};
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        const message = data?.message || `Error ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      // Gérer la réponse structurée
      if (data?.success === true && data?.user) {
        return { data: data.user as T };
      } else if (data?.success === true && data?.data) {
        return { data: data.data as T };
      }
      
      return { data: data as T };
    } catch (error) {
      console.error('[API] Request error:', error);
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  auth = {
    register: (data: RegisterData) =>
      this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginData) =>
      this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
}

export const api = new ApiService(); 