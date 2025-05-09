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
  access_token: string;
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

export interface UserProfileData {
  id: number;
  username: string;
  email: string;
  joinDate?: string;
  totalGames?: number;
  winRate?: number;
  matches?: MatchData[];
}

export interface MatchData {
  id?: number;
  opponent: string;
  result: 'Win' | 'Loss';
  score: string;
  date: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  password?: string;
}

export interface Friend {
  id: number;
  username: string;
  email: string;
}

export interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  joinDate?: string;
  totalGames?: number;
  winRate?: number;
  matches?: MatchData[];
  status: string;
}

class ApiService {
  // Add a debug method to check token
  checkToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[API] No token found in localStorage');
      return false;
    }
    
    try {
      // Log token parts for debugging
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('[API] Invalid token format (not a valid JWT format)');
        return false;
      }
      
      // Decode header and payload
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('[API] Token header:', header);
      console.log('[API] Token payload:', payload);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.error('[API] Token is expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[API] Error parsing token:', error);
      return false;
    }
  }

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
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log(`[API] Token from localStorage:`, token ? 'Found token' : 'No token');
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };
      
      console.log(`[API] Request headers:`, headers);
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
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
      console.log("Raw API response data:", data);
      
      if (data?.success === true) {
        // Backend returns { success: true, ...userData, access_token }
        if (data?.access_token) {
          // This is a login response with directly embedded user data and token
          console.log("Found access_token in response, returning full data object:", data);
          
          // Ensure the token is properly structured
          try {
            const tokenParts = data.access_token.split('.');
            if (tokenParts.length !== 3) {
              console.error("[API] Warning: JWT token format is invalid");
            } else {
              console.log("[API] JWT token format looks valid");
            }
          } catch (e) {
            console.error("[API] Error analyzing token format:", e);
          }
          
          return { data: data as T };
        } else if (data?.user) {
          // Response with user nested
          console.log("Found user object in response:", data.user);
          return { data: data.user as T };
        } else if (data?.data) {
          // Response with data field
          console.log("Found data field in response:", data.data);
          return { data: data.data as T };
        }
      }
      
      // Default fallback
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

  user = {
    // Get current user profile
    getProfile: () => 
      this.request<UserProfileData>('/users/profile', {
        method: 'GET',
      }),
    
    // Update user profile
    updateProfile: (data: UpdateProfileData) =>
      this.request<UserProfileData>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // Get match history (Note: This endpoint might not exist yet)
    getMatches: () =>
      this.request<MatchData[]>('/users/matches', {
        method: 'GET',
      }),
      
    // Get all users
    getAllUsers: () =>
      this.request<User[]>('/users', {
        method: 'GET',
      }),
      
    // Get online users
    getOnlineUsers: () =>
      this.request<User[]>('/users/online', {
        method: 'GET',
      }),
      
    // Update user status
    updateStatus: (status: string) =>
      this.request<User>('/users/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  friendship = {
    getFriends: () =>
      this.request<Friend[]>('/friendships', {
        method: 'GET',
      }),
    
    getPendingRequests: () =>
      this.request<FriendRequest[]>('/friendships/requests', {
        method: 'GET',
      }),
    
    sendRequest: (username: string) =>
      this.request('/friendships/request', {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
    
    acceptRequest: (requestId: number) =>
      this.request(`/friendships/accept/${requestId}`, {
        method: 'POST',
      }),
    
    rejectRequest: (requestId: number) =>
      this.request(`/friendships/reject/${requestId}`, {
        method: 'DELETE',
      }),
    
    removeFriend: (friendId: number) =>
      this.request(`/friendships/${friendId}`, {
        method: 'DELETE',
      }),
  };
}

export const api = new ApiService(); 