import { socketService } from '../services/socket';
// Auth storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
// Auth utils singleton
export class AuthUtils {
    constructor() {
        Object.defineProperty(this, "currentUser", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "authListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        // Initialize current user from local storage
        this.loadUserFromStorage();
    }
    static getInstance() {
        if (!AuthUtils.instance) {
            AuthUtils.instance = new AuthUtils();
        }
        return AuthUtils.instance;
    }
    // Load user data from localStorage
    loadUserFromStorage() {
        try {
            const userJson = localStorage.getItem(USER_KEY);
            if (userJson) {
                this.currentUser = JSON.parse(userJson);
            }
        }
        catch (e) {
            console.error('Failed to load user from storage:', e);
            this.currentUser = null;
        }
    }
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken() && !!this.currentUser;
    }
    // Get the saved auth token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    // Get the current user
    getCurrentUser() {
        return this.currentUser;
    }
    // Set authentication data
    setAuth(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser = user;
        // Connect to WebSocket with the new token
        socketService.connect(token);
        // Notify listeners
        this.notifyAuthListeners();
    }
    // Clear authentication data
    clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.currentUser = null;
        // Close WebSocket connection
        socketService.close();
        // Notify listeners
        this.notifyAuthListeners();
    }
    // Update current user data
    updateCurrentUser(userData) {
        if (!this.currentUser)
            return;
        this.currentUser = { ...this.currentUser, ...userData };
        localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
        // Notify listeners
        this.notifyAuthListeners();
    }
    // Add auth state change listener
    addAuthStateListener(listener) {
        this.authListeners.add(listener);
        // Immediately call the listener with current state
        listener(this.currentUser);
    }
    // Remove auth state change listener
    removeAuthStateListener(listener) {
        this.authListeners.delete(listener);
    }
    // Notify all listeners about auth state change
    notifyAuthListeners() {
        this.authListeners.forEach(listener => {
            listener(this.currentUser);
        });
    }
}
// Export singleton instance
export const authUtils = AuthUtils.getInstance();
//# sourceMappingURL=auth.js.map