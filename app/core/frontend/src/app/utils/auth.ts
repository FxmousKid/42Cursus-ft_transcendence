import { User } from '../types/index';
import { socketService } from '../services/socket';

// Auth storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Auth utils singleton
export class AuthUtils {
  private static instance: AuthUtils;
  private currentUser: User | null = null;
  private authListeners: Set<(user: User | null) => void> = new Set();

  private constructor() {
    // Initialize current user from local storage
    this.loadUserFromStorage();
  }

  public static getInstance(): AuthUtils {
    if (!AuthUtils.instance) {
      AuthUtils.instance = new AuthUtils();
    }
    return AuthUtils.instance;
  }

  // Load user data from localStorage
  private loadUserFromStorage(): void {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
    } catch (e) {
      console.error('Failed to load user from storage:', e);
      this.currentUser = null;
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  // Get the saved auth token
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Get the current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Set authentication data
  public setAuth(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser = user;
    
    // Connect to WebSocket with the new token
    socketService.connect(token);
    
    // Notify listeners
    this.notifyAuthListeners();
  }

  // Clear authentication data
  public clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser = null;
    
    // Close WebSocket connection
    socketService.close();
    
    // Notify listeners
    this.notifyAuthListeners();
  }

  // Update current user data
  public updateCurrentUser(userData: Partial<User>): void {
    if (!this.currentUser) return;
    
    this.currentUser = { ...this.currentUser, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
    
    // Notify listeners
    this.notifyAuthListeners();
  }

  // Add auth state change listener
  public addAuthStateListener(listener: (user: User | null) => void): void {
    this.authListeners.add(listener);
    // Immediately call the listener with current state
    listener(this.currentUser);
  }

  // Remove auth state change listener
  public removeAuthStateListener(listener: (user: User | null) => void): void {
    this.authListeners.delete(listener);
  }

  // Notify all listeners about auth state change
  private notifyAuthListeners(): void {
    this.authListeners.forEach(listener => {
      listener(this.currentUser);
    });
  }
}

// Export singleton instance
export const authUtils = AuthUtils.getInstance(); 