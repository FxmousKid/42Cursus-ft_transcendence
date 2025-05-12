import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id?: number;
  username: string;
  email: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          // No token, not authenticated
          setUser(null);
          return;
        }
        
        // Here you would typically make an API call to validate the token and get user data
        // For now, we'll use a mock implementation that checks localStorage for user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user data:', e);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // Token exists but no user data, attempt to fetch user data
          // This is a placeholder for a real API call to get user info from token
          console.log('Token exists but no user data, would fetch from API in production');
          
          // For now, clear token since we can't validate it
          setUser(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Submitting login:", { email });
      
      const result = await api.auth.login({ email, password });
      
      if (result.error) {
        // Pour les échecs d'authentification, pas besoin de log détaillé
        if (result.error === 'Invalid email or password' || 
            result.error.includes('authentication') || 
            result.error.includes('Invalid token')) {
          // Ne pas logger en détail les erreurs courantes d'authentification
          return { error: 'Invalid email or password' };
        }
        
        // Pour les autres types d'erreurs, on les log normalement
        console.error('Login error:', result.error);
        return { error: result.error };
      }
      
      if (result.data) {
        console.log("Login successful, data structure:", JSON.stringify(result.data, null, 2));
        
        // Store user data in state and localStorage
        const userData = {
          id: result.data.id,
          username: result.data.username,
          email: result.data.email,
          token: result.data.access_token
        };
        
        setUser(userData);
        
        if (result.data.access_token) {
          localStorage.setItem('token', result.data.access_token);
          console.log("Token stored in localStorage:", result.data.access_token.substring(0, 20) + "...");
          
          // Validate token structure
          const isTokenValid = api.checkToken();
          if (!isTokenValid) {
            console.error("Token validation failed, might not be properly formatted");
          }
          
          // Store the user data separately for future use
          localStorage.setItem('user', JSON.stringify(userData));
          return {};
        } else {
          console.error("No access_token found in response data");
          console.log("Full response data:", result.data);
          return { error: 'Login failed: No token received' };
        }
      } else {
        return { error: 'Login failed: No user data received' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  };

  const logout = async () => {
    try {
      // TODO: Implement actual logout API call
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const registerData = { username, email, password };
      const result = await api.auth.register(registerData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // In most applications, you wouldn't automatically log in after registration
      // But if you want to, you could use the login function here
      
      return; // Just return success, don't log in automatically
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 