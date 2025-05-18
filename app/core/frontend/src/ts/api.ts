// API URL configuration
const API_URL = 'http://localhost:3000';

// Import auth service (will be imported from module using this file)
// This is done to avoid circular dependency
let _authService: any = null;

// Response and data interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  token: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  status: string;
  avatar_url?: string;
  created_at?: string;
}

export interface MatchData {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  created_at: string;
  player1_username?: string;
  player2_username?: string;
}

export interface FriendRequest {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  user?: UserProfile;
  created_at?: string;
}

export interface Friend {
  id: number;
  username: string;
  status: string;
  avatar_url?: string;
}

// Set auth service reference
export function setAuthService(authService: any) {
  _authService = authService;
}

// Helper for API requests
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);
    
    // Get token from auth service if available, otherwise fallback to localStorage
    let token = null;
    if (_authService && _authService.getToken) {
      token = _authService.getToken();
    } else {
      token = localStorage.getItem('auth_token');
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log(`[API] Response status: ${response.status}`);
    
    // Handle authentication errors
    if (response.status === 401) {
      // If auth service is available, clear session
      if (_authService && _authService.clearSession) {
        _authService.clearSession();
      }
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
      
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }
    
    // Handle no content response
    if (response.status === 204) {
      return { success: true };
    }
    
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error parsing response:', error);
      return { 
        success: false, 
        message: 'Failed to parse server response' 
      };
    }
    
    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || 'An error occurred' 
      };
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Auth services
const auth = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },
  
  async logout(): Promise<ApiResponse<void>> {
    return request<void>('/auth/logout', {
      method: 'POST'
    });
  }
};

// User services
const user = {
  async getProfile(userId?: number): Promise<ApiResponse<UserProfile>> {
    // Get userId from auth service if available
    if (!userId && _authService && _authService.getUserId) {
      const id = _authService.getUserId();
      if (id) {
        return request<UserProfile>(`/users/${id}`);
      }
    }
    
    const id = userId || localStorage.getItem('user_id');
    return request<UserProfile>(`/users/${id}`);
  },
  
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    // Get userId from auth service if available
    let userId = null;
    if (_authService && _authService.getUserId) {
      userId = _authService.getUserId();
    } else {
      userId = localStorage.getItem('user_id');
    }
    
    return request<UserProfile>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  async getMatches(userId?: number): Promise<ApiResponse<MatchData[]>> {
    // Get userId from auth service if available
    if (!userId && _authService && _authService.getUserId) {
      const id = _authService.getUserId();
      if (id) {
        return request<MatchData[]>(`/users/${id}/matches`);
      }
    }
    
    const id = userId || localStorage.getItem('user_id');
    return request<MatchData[]>(`/users/${id}/matches`);
  },
  
  async getAll(): Promise<ApiResponse<UserProfile[]>> {
    return request<UserProfile[]>('/users');
  }
};

// Friendship services
const friendship = {
  async getFriends(): Promise<ApiResponse<Friend[]>> {
    return request<Friend[]>('/friendships');
  },
  
  async getPendingRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return request<FriendRequest[]>('/friendships/requests');
  },
  
  async sendFriendRequest(friendId: number): Promise<ApiResponse<FriendRequest>> {
    return request<FriendRequest>('/friendships/request', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId })
    });
  },
  
  async acceptFriendRequest(requestId: number): Promise<ApiResponse<void>> {
    return request<void>(`/friendships/accept/${requestId}`, {
      method: 'POST'
    });
  },
  
  async rejectFriendRequest(requestId: number): Promise<ApiResponse<void>> {
    return request<void>(`/friendships/reject/${requestId}`, {
      method: 'POST'
    });
  },
  
  async removeFriend(friendId: number): Promise<ApiResponse<void>> {
    return request<void>(`/friendships/${friendId}`, {
      method: 'DELETE'
    });
  }
};

// Game services
const game = {
  async getLeaderboard(): Promise<ApiResponse<UserProfile[]>> {
    return request<UserProfile[]>('/leaderboard');
  },
  
  async getAllMatches(): Promise<ApiResponse<MatchData[]>> {
    return request<MatchData[]>('/matches');
  }
};

export const api = {
  baseUrl: API_URL,
  auth,
  user,
  friendship,
  game
};

// Make API globally available
(window as any).api = api; 