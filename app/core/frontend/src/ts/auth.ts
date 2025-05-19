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

export class AuthService {
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
      console.log('Auth: Attempting login for:', email);
      
      // Get global API instance
      const api = (window as any).api;
      if (!api || !api.auth) {
        console.error('API not initialized');
        return false;
      }

      const response = await api.auth.login(email, password);
      console.log('Auth: Login response:', response);
      
      if (response.success && response.data) {
        console.log('Auth: Login successful, setting auth state');
        // Set auth state
        this.setAuthState(response.data, rememberMe);
        return true;
      }
      
      console.log('Auth: Login failed:', response.message || 'Unknown error');
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
      // Get global API instance
      const api = (window as any).api;
      if (!api || !api.auth) {
        console.error('API not initialized');
        return false;
      }
      
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
      // Get global API instance
      const api = (window as any).api;
      if (api && api.auth) {
        // Call logout API endpoint
        await api.auth.logout();
      }
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
    console.log('Auth: Checking authentication status');
    
    // Check if internal state says we're authenticated
    if (this.state.isAuthenticated && this.state.token) {
      console.log('Auth: State has authenticated=true and token is present');
      
      // Check if token is expired
      if (this.state.expiresAt && this.state.expiresAt > Date.now()) {
        console.log('Auth: Token is valid, user is authenticated');
        return true;
      } else {
        console.log('Auth: Token is expired, clearing session');
        this.clearSession();
        return false;
      }
    }
    
    // If internal state says we're not authenticated, check if we have a token in storage
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    console.log('Auth: Token in storage:', !!token);
    
    if (token) {
      // Check for user ID in storage
      const userId = localStorage.getItem(USER_ID_KEY) || sessionStorage.getItem(USER_ID_KEY);
      console.log('Auth: User ID in storage:', !!userId);
      
      if (userId) {
        console.log('Auth: Found token and userID in storage, restoring session');
        // If we found token and userID but they weren't loaded in state, restore session
        this.restoreSession();
        // Return the authentication state after restoration
        return this.state.isAuthenticated;
      }
    }
    
    console.log('Auth: No valid auth data found, user is not authenticated');
    return false;
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
   * Update username in auth state
   */
  public updateUsername(username: string): void {
    if (!username) return;
    
    // Update state
    this.state.username = username;
    
    // Update in storage
    if (this.state.rememberMe) {
      localStorage.setItem(USERNAME_KEY, username);
    } else {
      sessionStorage.setItem(USERNAME_KEY, username);
    }
    
    console.log('Auth: Username updated to:', username);
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
      rememberMe: this.state.rememberMe,
      expiresAt: null
    };
    
    // Clear localStorage and sessionStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear any pending token refresh
    if (this.refreshTimeout !== null) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    console.log('Auth: Session cleared');
  }
  
  /**
   * Restore session from localStorage or sessionStorage
   * Made public to allow external components to force a session restore
   */
  public restoreSession(): void {
    console.log('Auth: Attempting to restore session');
    
    // Try to get token from localStorage first, then sessionStorage
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      console.log('Auth: No token found in storage');
      return;
    }
    
    // Get user ID and other data
    const userId = localStorage.getItem(USER_ID_KEY) || sessionStorage.getItem(USER_ID_KEY);
    const username = localStorage.getItem(USERNAME_KEY) || sessionStorage.getItem(USERNAME_KEY);
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    // Get token expiry
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    const expiresAt = expiryStr ? parseInt(expiryStr, 10) : null;
    
    console.log('Auth: Found token data in storage', { 
      hasToken: !!token, 
      hasUserId: !!userId, 
      hasUsername: !!username, 
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null 
    });
    
    // Check if we have all required data and token is not expired
    if (token && userId && (expiresAt === null || expiresAt > Date.now())) {
      // Update state
      this.state = {
        isAuthenticated: true,
        token,
        userId,
        username,
        rememberMe,
        expiresAt
      };
      
      console.log('Auth: Session restored successfully. User is authenticated.');
      
      // Schedule token refresh if we have an expiry
      if (expiresAt) {
        this.scheduleTokenRefresh();
      }
    } else {
      console.log('Auth: Session restoration failed - invalid or expired token');
      this.clearSession(); // Clean up any invalid data
    }
  }

  /**
   * Set authentication state from login/register response
   */
  private setAuthState(authData: any, rememberMe: boolean): void {
    console.log('Auth: Setting auth state with data:', {
      id: authData.id,
      username: authData.username,
      tokenPresent: !!authData.token,
      rememberMe
    });
    
    // Calculate token expiry time
    const expiresAt = Date.now() + DEFAULT_TOKEN_EXPIRY;
    console.log('Auth: Token will expire at:', new Date(expiresAt).toLocaleString());
    
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
    
    // Verify the data was stored correctly
    console.log('Auth: Session data persisted, state is now:', {
      isAuthenticated: this.state.isAuthenticated,
      username: this.state.username,
      rememberMe: this.state.rememberMe
    });
  }

  /**
   * Persist session data in storage
   */
  private persistSession(): void {
    console.log('Auth: Persisting session data, rememberMe =', this.state.rememberMe);
    
    const storage = this.state.rememberMe ? localStorage : sessionStorage;
    const storageType = this.state.rememberMe ? 'localStorage' : 'sessionStorage';
    
    storage.setItem(TOKEN_KEY, this.state.token || '');
    storage.setItem(USER_ID_KEY, this.state.userId || '');
    storage.setItem(USERNAME_KEY, this.state.username || '');
    storage.setItem(TOKEN_EXPIRY_KEY, this.state.expiresAt?.toString() || '');
    
    // Always store remember me preference in localStorage
    localStorage.setItem(REMEMBER_ME_KEY, this.state.rememberMe.toString());
    
    console.log(`Auth: Session persisted in ${storageType}`, {
      token: !!this.state.token,
      userId: this.state.userId,
      username: this.state.username
    });
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(): void {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // If token is set to expire
    if (this.state.expiresAt) {
      // Calculate time until refresh (15 minutes before expiry)
      const refreshTime = this.state.expiresAt - Date.now() - (15 * 60 * 1000);
      
      // Schedule refresh
      if (refreshTime > 0) {
        this.refreshTimeout = window.setTimeout(() => {
          this.refreshToken();
        }, refreshTime);
      } else {
        // Token is about to expire or already expired, refresh immediately
        this.refreshToken();
      }
    }
  }

  /**
   * Refresh auth token
   */
  private async refreshToken(): Promise<void> {
    try {
      // For now, we don't have a token refresh endpoint
      // This is where you would call the refresh token API
      // For now, we'll just check token validity and logout if expired
      
      if (this.state.expiresAt && this.state.expiresAt < Date.now()) {
        console.log('Token expired, logging out');
        this.clearSession();
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login.html') {
          window.location.href = '/login.html';
        }
      } else {
        // Re-schedule the refresh for the remaining time
        this.scheduleTokenRefresh();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // If refresh fails, clear session and redirect to login
      this.clearSession();
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
  }

  /**
   * Check token validity when window gains focus
   */
  private checkTokenValidity(): void {
    // If token is expired, clear session and redirect to login
    if (this.state.expiresAt && this.state.expiresAt < Date.now()) {
      console.log('Token expired on window focus, logging out');
      this.clearSession();
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
  }
}

// Create and export auth service instance
export const authService = new AuthService();

// Initialize auth service
authService.init();

// Make auth service globally available for legacy code
if (typeof window !== 'undefined') {
  (window as any).authService = authService;
} 