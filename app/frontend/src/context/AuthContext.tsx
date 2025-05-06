import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, AuthResponse } from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in when app starts
  useEffect(() => {
    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', { email });
      
      const result = await api.auth.login({ email, password });
      console.log('AuthContext: Login API response:', result);
      
      if (result.error) {
        console.error('AuthContext: Login error:', result.error);
        return { success: false, error: result.error };
      }
      
      if (result.data) {
        console.log('AuthContext: Login successful, setting user data');
        setUser(result.data);
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(result.data));
        return { success: true };
      }
      
      console.error('AuthContext: Login failed - no error but also no data');
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('AuthContext: Login error (caught):', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 