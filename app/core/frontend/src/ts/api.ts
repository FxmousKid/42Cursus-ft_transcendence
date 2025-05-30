// API URL configuration
export const API_URL = (
  window.location.hostname === 'localhost' &&
  window.location.port === '5173'
)
  ? 'http://localhost:3000'
  : '/api';

// Types for API responses
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  has_avatar_data?: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchData {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_username: string;
  player2_username: string;
  player1_score: number;
  player2_score: number;
  winner_id?: number;
  status: string;
  match_date?: string; // Added for Paris timezone match completion time
  created_at?: string;
  updated_at?: string;
}

// Helper for API requests
async function request(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);
    
    // Get the most up-to-date token
    const authService = (window as any).authService;
    let token;
    
    if (authService && authService.getToken) {
      // Get the token directly from auth service if available
      token = authService.getToken();
      console.log(`[API] Got token from authService: ${!!token}`);
    } else {
      // Fallback to localStorage
      token = localStorage.getItem('auth_token');
      console.log(`[API] Got token from localStorage: ${!!token}`);
    }
    
    // Prepare headers - don't set Content-Type for FormData
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    // Only set Content-Type if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add custom headers
    Object.assign(headers, options.headers || {});
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Clear the timeout
    
    console.log(`[API] Response status: ${response.status}`);
    
    // Handle authentication errors
    if (response.status === 401) {
      console.log('[API] Authentication error (401) received');
      
      // Use the auth service to clear the session if available
      if (authService && authService.clearSession) {
        console.log('[API] Using authService to clear session');
        authService.clearSession();
      } else {
        // Fallback manual cleanup
        console.log('[API] Manually clearing auth data from storage');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar_url');
        
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_id');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('avatar_url');
      }
      
      // Get the current path and check if we need to redirect
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on login page to avoid redirect loop
      if (!currentPath.includes('login') && !currentPath.includes('register')) {
        console.log('[API] Redirecting to login page due to 401 error');
        window.location.href = '/login.html';
      } else {
        console.log('[API] Already on login/register page, not redirecting');
      }
      
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }
    
    // Handle 404 errors
    if (response.status === 404) {
      console.warn(`[API] Endpoint not found: ${endpoint}`);
      return {
        success: false,
        message: `Endpoint not found: ${endpoint}`,
        data: [] // Renvoyer un tableau vide par défaut
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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('[API] Failed to fetch. The backend server may be down or unreachable.');
      // Show a user-friendly message in the console that could be displayed to the user
      console.log('[API] Connection to server failed. Please check if the backend is running.');
    }
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      data: [] // Return an empty array by default
    };
  }
}

// Helper function to get avatar URL
export function getAvatarUrl(user: { id: number; has_avatar_data?: boolean; avatar_url?: string }): string {
  // Prioritize uploaded avatar data over URL
  if (user.has_avatar_data) {
    return `${API_URL}/users/avatar/${user.id}`;
  }
  // Fall back to avatar URL if available
  if (user.avatar_url) {
    return user.avatar_url;
  }
  // Return empty string - let the UI handle the default
  return '';
}

// Create and export API object
export const api = {
  baseUrl: API_URL,
  
  // Auth services
  auth: {
    async login(email: string, password: string) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    
    async register(username: string, email: string, password: string) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
    },
    
    async logout() {
      return request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    
	async verify2FA(userId: number, code: string) {
      return request('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ userId, code })
      });
    },

    async setup2FA() {
      return request('/auth/2fa/setup', {
        method: 'GET'
      });
    },

    async enable2FA(code: string) {
      return request('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    },

    async disable2FA(userID: any) {
      return request('/auth/2fa/disable', {
        method: 'POST',
		body: JSON.stringify({ userID })
      });
    },
  },
  
  // User services
  user: {
    async getProfile() {
      return request('/users/profile');  // Use /users/profile instead of /users/${id}
    },
    
    async updateProfile(data: any) {
      return request('/users/profile', {  // Use /users/profile instead of /users/${userId}
        method: 'PUT',  // Use PUT instead of PATCH to match backend
        body: JSON.stringify(data)
      });
    },
    
    async deleteProfile() {
      return request('/users/profile', {
        method: 'DELETE'
      });
    },

    async getMatches(): Promise<{ success: boolean; data?: MatchData[]; message?: string }> {
      return request('/matches/user');  // Changed from '/users/matches' to '/matches/user'
    },
    
    async getAll() {
      return request('/users');
    },
    
    async searchUsers(username: string) {
      return request(`/users/search?username=${encodeURIComponent(username)}`);
    },

    async getUser(id: number) {
      return request(`/users/${id}/profile`);
    },

    async checkUsername(username: string) {
      return request(`/users/check-username?username=${encodeURIComponent(username)}`);
    },
    
    // New avatar methods
    async uploadAvatar(file: File): Promise<{ success: boolean; message?: string; data?: any }> {
      const formData = new FormData();
      formData.append('file', file);
      
      return request('/users/profile/avatar', {
        method: 'POST',
        body: formData
      });
    },
    
    async deleteAvatar(): Promise<{ success: boolean; message?: string; data?: any }> {
      return request('/users/profile/avatar', {
        method: 'DELETE'
      });
    }
  },
  
  // Friendship services
  friendship: {
    async getFriends() {
      return request('/friendships');
    },
    
    async getPendingRequests() {
      return request('/friendships/requests');
    },
    
    async sendFriendRequest(friendId: number) {
      return request('/friendships/request', {
        method: 'POST',
        body: JSON.stringify({ friend_id: friendId })
      });
    },
    
    async acceptFriendRequest(requestId: number) {
      return request(`/friendships/accept/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    
    async rejectFriendRequest(requestId: number) {
      return request(`/friendships/reject/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    
    async removeFriend(friendId: number) {
      return request(`/friendships/${friendId}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Game services
  game: {
    async getAllMatches() {
      return request('/game/matches');
    },

    async createMatch(player1: number, player2: number) {
      return request('/matches', {
        method: 'POST',
        body: JSON.stringify({ player1_id: player1, player2_id: player2 }),
      })
    },

    async updateMatch(id: number, player1_score: number, player2_score: number, status: string) {
      return request(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify( { player1_score: player1_score, player2_score: player2_score, status: status }),
      })
    },
  },

  // Chat services
  chat: {
    async getMessages(userId: number) {
      return request(`/chat/messages/${userId}`);
    },
    
    async getUnreadCount() {
      return request('/chat/unread');
    },
    
    async blockUser(userId: number) {
      return request('/chat/block', {
        method: 'POST',
        body: JSON.stringify({ blocked_id: userId })
      });
    },
    
    async unblockUser(userId: number) {
      return request(`/chat/block/${userId}`, {
        method: 'DELETE'
      });
    },
    
    async getBlockedUsers() {
      return request('/chat/blocks');
    }
  },

  // Tournament services - Creation d'un tournamene et des matches_tournament sur la DB
  tournament: {
    async createTournament(host_id: number, users: string[]) {
      return request('/tournaments', {
        method: 'POST',
        body: JSON.stringify( {host_id: host_id, users: users} ),
      })
    },

    async updateStatusTournament(id: number, status: string) {
      return request('/tournaments/status', {
        method: 'PATCH',
        body: JSON.stringify( {id: id, status: status} ),
      })
    },

    async createMatchTournament(host_id: number, player1: string, player2: string) {
      return request('/match_tournaments', {
        method: 'POST',
        body: JSON.stringify( {tournament_id: host_id, player1_name: player1, player2_name: player2} )
      })
    },

    async updateScoreMatchTournament(id: number, p1_score: number, p2_score: number, winner: string) {
      return request('/match_tournaments/scores', {
        method: 'PATCH',
        body: JSON.stringify( {id: id, player1_score: p1_score, player2_score: p2_score, winner_name: winner} )
      })
    },

    async updateStatusMatchTournament(id: number, status: string) {
      return request('/match_tournaments/status', {
        method: 'PATCH',
        body: JSON.stringify( {id: id, status: status} )
      })
    },
  },
};

// Pour la rétrocompatibilité, on expose aussi API globalement
if (typeof window !== 'undefined') {
  (window as any).api = api;
  (window as any).getAvatarUrl = getAvatarUrl;
}