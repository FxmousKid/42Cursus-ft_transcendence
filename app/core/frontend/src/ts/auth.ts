import { api, AuthResponse } from './api';

// Constants
const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const USERNAME_KEY = 'username';
const REMEMBER_ME_KEY = 'remember_me';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Default token expiry time (24 hours)
const DEFAULT_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Authentication state interface
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  username: string | null;
  rememberMe: boolean;
  expiresAt: number | null;
}

class AuthService {
  private state: AuthState;
  private refreshTimeout: number | null = null;

  constructor() {
    // Initialize auth state from localStorage
    this.state = {
      isAuthenticated: false,
      token: null,
      userId: null,
      username: null,
      rememberMe: localStorage.getItem(REMEMBER_ME_KEY) === 'true',
      expiresAt: null
    };

    // Try to restore session on initialization
    this.restoreSession();
  }

  /**
   * Initialize auth service and restore session if available
   */
  public init(): void {
    // Add event listeners for token refresh
    window.addEventListener('focus', () => this.checkTokenValidity());
    
    // Schedule token refresh if user is authenticated
    if (this.state.isAuthenticated && this.state.expiresAt) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Login user and store authentication data
   */
  public async login(email: string, password: string, rememberMe: boolean): Promise<boolean> {
    try {
      const response = await api.auth.login(email, password);
      
      if (response.success && response.data) {
        // Set auth state
        this.setAuthState(response.data, rememberMe);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * Register new user
   */
  public async register(username: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await api.auth.register(username, email, password);
      
      if (response.success && response.data) {
        // Set auth state (automatically logged in after registration)
        this.setAuthState(response.data, false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  /**
   * Logout user and clear session data
   */
  public async logout(): Promise<void> {
    try {
      // Call logout API endpoint
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session data even if API call fails
      this.clearSession();
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Get current auth token
   */
  public getToken(): string | null {
    return this.state.token;
  }

  /**
   * Get current user ID
   */
  public getUserId(): string | null {
    return this.state.userId;
  }

  /**
   * Get current username
   */
  public getUsername(): string | null {
    return this.state.username;
  }

  /**
   * Clear session data (exposed for API module)
   */
  public clearSession(): void {
    // Clear state
    this.state = {
      isAuthenticated: false,
      token: null,
      userId: null,
      username: null,
      rememberMe: false,
      expiresAt: null
    };
    
    // Clear storages
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Keep remember me preference
    localStorage.setItem(REMEMBER_ME_KEY, 'false');
    
    // Clear token refresh timeout
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  /**
   * Set authentication state from login/register response
   */
  private setAuthState(authData: AuthResponse, rememberMe: boolean): void {
    // Calculate token expiry time
    const expiresAt = Date.now() + DEFAULT_TOKEN_EXPIRY;
    
    // Update state
    this.state = {
      isAuthenticated: true,
      token: authData.token,
      userId: authData.id.toString(),
      username: authData.username,
      rememberMe,
      expiresAt
    };
    
    // Store in localStorage or sessionStorage based on rememberMe
    this.persistSession();
    
    // Schedule token refresh
    this.scheduleTokenRefresh();
  }

  /**
   * Persist session data in storage
   */
  private persistSession(): void {
    const storage = this.state.rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(TOKEN_KEY, this.state.token || '');
    storage.setItem(USER_ID_KEY, this.state.userId || '');
    storage.setItem(USERNAME_KEY, this.state.username || '');
    storage.setItem(TOKEN_EXPIRY_KEY, this.state.expiresAt?.toString() || '');
    
    // Always store remember me preference in localStorage
    localStorage.setItem(REMEMBER_ME_KEY, this.state.rememberMe.toString());
  }

  /**
   * Restore session from storage
   */
  private restoreSession(): void {
    // Try to get token from localStorage first (for remember me)
    let token = localStorage.getItem(TOKEN_KEY);
    let userId = localStorage.getItem(USER_ID_KEY);
    let username = localStorage.getItem(USERNAME_KEY);
    let expiresAtStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    let rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    // If not found in localStorage and not using remember me, try sessionStorage
    if (!token && !rememberMe) {
      token = sessionStorage.getItem(TOKEN_KEY);
      userId = sessionStorage.getItem(USER_ID_KEY);
      username = sessionStorage.getItem(USERNAME_KEY);
      expiresAtStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    }
    
    // If token exists and is not expired
    if (token && userId && username) {
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
      
      // Check if token is still valid
      if (expiresAt && expiresAt > Date.now()) {
        this.state = {
          isAuthenticated: true,
          token,
          userId,
          username,
          rememberMe,
          expiresAt
        };
        
        // Schedule token refresh
        this.scheduleTokenRefresh();
      } else {
        // Token expired, clear session
        this.clearSession();
      }
    }
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(): void {
    // Clear existing timeout if any
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    if (!this.state.expiresAt) return;
    
    // Calculate time to refresh (5 minutes before expiry)
    const timeToRefresh = this.state.expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (timeToRefresh <= 0) {
      // Token already expired or about to expire, refresh immediately
      this.refreshToken();
    } else {
      // Schedule refresh
      this.refreshTimeout = window.setTimeout(() => this.refreshToken(), timeToRefresh);
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    try {
      // Check if user is authenticated
      if (!this.state.isAuthenticated || !this.state.token) {
        return;
      }
      
      // TODO: Implement token refresh endpoint on backend
      // For now, we'll just extend the expiry time
      const expiresAt = Date.now() + DEFAULT_TOKEN_EXPIRY;
      this.state.expiresAt = expiresAt;
      
      // Update expiry in storage
      const storage = this.state.rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      
      // Schedule next refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, logout user
      this.clearSession();
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
  }

  /**
   * Check token validity and refresh if needed
   */
  private checkTokenValidity(): void {
    if (this.state.isAuthenticated && this.state.expiresAt) {
      // If token expires in less than 5 minutes, refresh it
      if (this.state.expiresAt - Date.now() < 5 * 60 * 1000) {
        this.refreshToken();
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Make it globally available
(window as any).authService = authService; 