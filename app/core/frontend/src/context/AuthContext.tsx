import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number | string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  toggleDevMode: () => void;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Création d'un utilisateur de test pour le mode développement
const DEV_USER: User = {
  id: 42,
  username: 'devuser',
  email: 'dev@example.com',
};

// Détection de l'environnement de développement
const isDevelopmentEnv = import.meta.env.DEV || import.meta.env.MODE === 'development';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Le mode développement ne sera activable que dans l'environnement de développement
  const [isDevMode, setIsDevMode] = useState<boolean>(
    isDevelopmentEnv && localStorage.getItem('devMode') === 'true'
  );

  useEffect(() => {
    // Si on n'est pas en environnement de développement et que le mode dev est activé,
    // on le désactive pour éviter des problèmes en production
    if (!isDevelopmentEnv && isDevMode) {
      console.log('Production environment detected - disabling dev mode');
      setIsDevMode(false);
      localStorage.removeItem('devMode');
    }
  }, [isDevMode]);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Vérifier d'abord si le mode développement est activé
        if (isDevelopmentEnv && isDevMode) {
          console.log('🔧 Development mode active - bypassing authentication');
          setUser(DEV_USER);
          return;
        }
        
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
  }, [isDevMode]);

  const toggleDevMode = () => {
    // Ne permettre le basculement que dans l'environnement de développement
    if (!isDevelopmentEnv) {
      console.warn('Dev mode can only be enabled in development environment');
      return;
    }
    
    const newDevModeState = !isDevMode;
    setIsDevMode(newDevModeState);
    localStorage.setItem('devMode', newDevModeState.toString());
    
    if (newDevModeState) {
      setUser(DEV_USER);
      console.log('🔧 Development mode activated - bypassing authentication');
    } else {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('🔧 Development mode deactivated');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Si on est en mode développement, connecter directement
      if (isDevelopmentEnv && isDevMode) {
        console.log('🔧 Dev mode: Bypassing login API call');
        setUser(DEV_USER);
        return {};
      }
      
      console.log("Submitting login:", { email, password });
      
      const result = await api.auth.login({ email, password });
      
      if (result.error) {
        console.error('Login failed:', result.error);
        return { error: result.error };
      }
      
      if (result.data) {
        // Store user data in state and localStorage
        setUser(result.data);
        localStorage.setItem('token', 'token-value'); // Replace with actual token from API
        localStorage.setItem('user', JSON.stringify(result.data));
        return {};
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
      // Si on est en mode développement, ne rien faire mais désactiver le mode dev
      if (isDevelopmentEnv && isDevMode) {
        toggleDevMode();
        return;
      }
      
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
      // Si on est en mode développement, simuler l'enregistrement
      if (isDevelopmentEnv && isDevMode) {
        console.log('🔧 Dev mode: Bypassing register API call');
        return;
      }
      
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
    register,
    toggleDevMode,
    isDevMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Ajout d'un commentaire pour désactiver l'avertissement car nous voulons permettre HMR tout en gardant
// la définition dans le même fichier pour une meilleure cohésion
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 