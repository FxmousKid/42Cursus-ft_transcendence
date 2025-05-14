// API configuration
const API_BASE_URL = 'http://localhost:3001';
// Helper function to handle fetch responses
async function handleResponse(response) {
    const text = await response.text();
    try {
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
            return {
                success: false,
                error: data.message || response.statusText
            };
        }
        return {
            success: true,
            data: data.data || data,
            message: data.message
        };
    }
    catch (error) {
        return {
            success: false,
            error: 'Failed to parse server response'
        };
    }
}
// Function to get stored auth token
function getAuthToken() {
    return localStorage.getItem('auth_token');
}
// API request helper
async function apiRequest(endpoint, method = 'GET', body, requiresAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    if (requiresAuth) {
        const token = getAuthToken();
        if (!token) {
            return { success: false, error: 'Authentication required' };
        }
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include'
        });
        return handleResponse(response);
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
// Auth API
export const authApi = {
    login: (credentials) => apiRequest('/auth/login', 'POST', credentials, false),
    register: (userData) => apiRequest('/auth/register', 'POST', userData, false),
    logout: () => apiRequest('/auth/logout', 'POST'),
    getCurrentUser: () => apiRequest('/auth/me')
};
// User API
export const userApi = {
    getProfile: (userId) => apiRequest(userId ? `/users/${userId}/profile` : '/users/profile'),
    updateProfile: (userData) => apiRequest('/users/profile', 'PATCH', userData),
    updateStatus: (status) => apiRequest('/users/status', 'PATCH', { status }),
    getLeaderboard: () => apiRequest('/users/leaderboard')
};
// Friendship API
export const friendshipApi = {
    getFriends: () => apiRequest('/friendship'),
    sendRequest: (friendId) => apiRequest('/friendship', 'POST', { friend_id: friendId }),
    acceptRequest: (requestId) => apiRequest(`/friendship/${requestId}/accept`, 'POST'),
    rejectRequest: (requestId) => apiRequest(`/friendship/${requestId}/reject`, 'POST'),
    removeFriend: (friendshipId) => apiRequest(`/friendship/${friendshipId}`, 'DELETE')
};
// Match API
export const matchApi = {
    getUserMatches: (userId) => apiRequest(userId ? `/matches/user/${userId}` : '/matches/user'),
    getMatchDetails: (matchId) => apiRequest(`/matches/${matchId}`),
    createMatch: (opponentId) => apiRequest('/matches', 'POST', { opponent_id: opponentId })
};
//# sourceMappingURL=api.js.map