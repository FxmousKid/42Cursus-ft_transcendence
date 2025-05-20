import { apiService, authApi } from './api';
import { toastUtils } from '../utils/toast';
import { User, UserProfile } from '../types/index';

// Type pour représenter l'état actuel de l'authentification
type AuthState = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
};

// Type pour les écouteurs d'événements d'authentification
type AuthChangeListener = (state: AuthState) => void;

/**
 * Service pour gérer l'authentification
 */
class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true
  };
  
  private authChangeListeners: AuthChangeListener[] = [];
  
  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }
  
  /**
   * Récupère le token d'authentification
   */
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  /**
   * Récupère l'utilisateur actuellement connecté
   */
  getCurrentUser(): UserProfile | null {
    return this.authState.user;
  }
  
  /**
   * Charge les données utilisateur depuis le stockage local
   */
  loadFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('current_user');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.setCurrentUser(user, token);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        this.clearStoredAuth();
      }
    } else {
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }
  
  /**
   * Convertit un User en UserProfile
   */
  private convertUserToUserProfile(user: User): UserProfile {
    return {
      ...user,
      stats: {
        wins: 0,
        losses: 0,
        rank: 0,
        total_games: 0,
        win_rate: 0
      },
      achievements: [],
      recent_matches: []
    };
  }
  
  /**
   * Définit l'utilisateur courant
   */
  setCurrentUser(user: User | UserProfile, token?: string): void {
    // Si un token est fourni, le stocker
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    // Convertir en UserProfile si nécessaire
    const userProfile = 'stats' in user ? user : this.convertUserToUserProfile(user);
    
    // Stocker les données utilisateur
    localStorage.setItem('current_user', JSON.stringify(userProfile));
    
    // Mettre à jour l'état d'authentification
    this.setAuthState({
      isAuthenticated: true,
      user: userProfile,
      loading: false
    });
  }
  
  /**
   * Met à jour l'état d'authentification et notifie les écouteurs
   */
  private setAuthState(newState: AuthState): void {
    this.authState = { ...newState };
    this.notifyListeners();
  }
  
  /**
   * Notifie tous les écouteurs de changements d'authentification
   */
  private notifyListeners(): void {
    this.authChangeListeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('Erreur dans un écouteur d\'authentification:', error);
      }
    });
  }
  
  /**
   * Efface les données d'authentification stockées
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    
    this.setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  }
  
  /**
   * Connecte un utilisateur
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await authApi.login({ username, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        this.setCurrentUser(user, token);
        toastUtils.success(`Bienvenue, ${user.username} !`);
        return true;
      } else {
        toastUtils.error(response.error || 'Échec de la connexion');
        return false;
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toastUtils.error('Une erreur est survenue lors de la connexion');
      return false;
    }
  }
  
  /**
   * Inscrit un nouvel utilisateur
   */
  async register(username: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await authApi.register({ username, email, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        this.setCurrentUser(user, token);
        toastUtils.success('Compte créé avec succès !');
        return true;
      } else {
        toastUtils.error(response.error || 'Échec de l\'inscription');
        return false;
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      toastUtils.error('Une erreur est survenue lors de l\'inscription');
      return false;
    }
  }
  
  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    try {
      // Tenter de notifier le serveur de la déconnexion
      await authApi.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      // Toujours effacer les données locales même si la requête échoue
      this.clearStoredAuth();
      toastUtils.info('Vous êtes déconnecté');
    }
  }
  
  /**
   * Ajoute un écouteur de changements d'authentification
   */
  onAuthChange(listener: AuthChangeListener): () => void {
    this.authChangeListeners.push(listener);
    
    // Appeler immédiatement l'écouteur avec l'état actuel
    listener(this.authState);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      const index = this.authChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.authChangeListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Vérifie l'état d'authentification actuel avec le serveur
   */
  async validateToken(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      const response = await authApi.getCurrentUser();
      
      if (response.success && response.data) {
        // Mettre à jour les données utilisateur
        this.setCurrentUser(response.data);
        return true;
      } else {
        // Token invalide, effacer l'authentification
        this.clearStoredAuth();
        return false;
      }
    } catch (error) {
      console.error('Erreur de validation du token:', error);
      return false;
    }
  }
}

// Exporter une instance unique du service
export const authService = new AuthService();

// Initialiser le service en chargeant les données du stockage
authService.loadFromStorage(); 