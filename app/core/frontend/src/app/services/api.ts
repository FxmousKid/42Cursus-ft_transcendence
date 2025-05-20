import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, AuthResponse, LoginCredentials, User, UserProfile, Match, Friendship, LoginResponse } from '../types/index';
import { toastUtils } from '../utils/toast';
import { router } from '../utils/router';
import { authService } from './auth';

/**
 * Service pour gérer les communications avec l'API
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  
  constructor() {
    // Créer une instance Axios configurée
    this.axiosInstance = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // Pour inclure les cookies dans les requêtes
    });
    
    // Configurer les intercepteurs de requêtes
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Ajouter le token d'authentification si disponible
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Configurer les intercepteurs de réponses
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Gérer les erreurs d'authentification
        if (error.response && error.response.status === 401) {
          // Si on n'est pas déjà sur la page de login
          if (window.location.pathname !== '/login') {
            // Nettoyer les données d'authentification
            authService.logout();
            
            // Informer l'utilisateur
            toastUtils.error('Votre session a expiré. Veuillez vous reconnecter.');
            
            // Rediriger vers la page de connexion
            router.navigateTo('/login');
          }
        }
        
        // Afficher des erreurs pour certains types d'erreurs
        if (error.response && error.response.status !== 401) {
          const errorMessage = error.response.data?.message || 'Une erreur est survenue.';
          toastUtils.error(errorMessage);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Effectue une requête API
   */
  public async request<T>(
    endpoint: string, 
    method: string = 'GET', 
    data: any = null,
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      let response: AxiosResponse;
      
      // Configurer la requête
      const requestConfig: AxiosRequestConfig = {
        ...config,
        method,
        url: endpoint
      };
      
      // Ajouter les données pour les méthodes autres que GET
      if (data) {
        if (method === 'GET') {
          requestConfig.params = data;
        } else {
          requestConfig.data = data;
        }
      }
      
      // Exécuter la requête
      response = await this.axiosInstance.request<T>(requestConfig);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue';
      
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        errorMessage = 'Aucune réponse du serveur';
      } else {
        // Erreur dans la configuration de la requête
        errorMessage = error.message;
      }
      
      console.error('Erreur API:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Connecte un utilisateur
   */
  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', 'POST', { username, password });
  }
  
  /**
   * Inscrit un nouvel utilisateur
   */
  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', 'POST', { username, email, password });
  }
  
  /**
   * Récupère le profil de l'utilisateur courant
   */
  async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/users/me');
  }
  
  /**
   * Récupère le profil d'un utilisateur par son ID
   */
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/users/${userId}`);
  }
  
  /**
   * Récupère le classement des joueurs
   */
  async getLeaderboard(): Promise<ApiResponse<UserProfile[]>> {
    return this.request<UserProfile[]>('/users/leaderboard');
  }
  
  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/users/me', 'PATCH', profileData);
  }
  
  /**
   * Met à jour l'avatar de l'utilisateur
   */
  async updateAvatar(formData: FormData): Promise<ApiResponse<{ avatar_url: string }>> {
    return this.request<{ avatar_url: string }>('/users/me/avatar', 'POST', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  
  /**
   * Vérifie si le serveur backend est accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Erreur de connexion au serveur:', error);
      return false;
    }
  }
}

// Exporter une instance unique du service
export const apiService = new ApiService();

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => 
    apiService.login(credentials.username, credentials.password),
    
  register: (userData: { username: string, email: string, password: string }): Promise<ApiResponse<AuthResponse>> => 
    apiService.register(userData.username, userData.email, userData.password),
    
  logout: (): Promise<ApiResponse<void>> => 
    apiService.request<void>('/auth/logout', 'POST'),
    
  getCurrentUser: (): Promise<ApiResponse<UserProfile>> => 
    apiService.getCurrentUserProfile()
};

// User API
export const userApi = {
  getProfile: (userId?: number): Promise<ApiResponse<UserProfile>> => 
    apiService.getUserProfile(userId ? userId.toString() : 'me'),
    
  updateProfile: (userData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => 
    apiService.updateProfile(userData),
    
  updateStatus: (status: string): Promise<ApiResponse<UserProfile>> => 
    apiService.request<UserProfile>('/users/status', 'PATCH', { status }),
    
  getLeaderboard: (): Promise<ApiResponse<UserProfile[]>> => 
    apiService.getLeaderboard(),
    
  getFriends: (): Promise<ApiResponse<Friendship[]>> => 
    apiService.request<Friendship[]>('/friendships'),
    
  sendRequest: (friendId: number): Promise<ApiResponse<Friendship>> => 
    apiService.request<Friendship>('/friendships', 'POST', { friend_id: friendId }),
    
  acceptRequest: (requestId: number): Promise<ApiResponse<Friendship>> => 
    apiService.request<Friendship>(`/friendships/${requestId}/accept`, 'POST'),
    
  rejectRequest: (requestId: number): Promise<ApiResponse<void>> => 
    apiService.request<void>(`/friendships/${requestId}/reject`, 'POST'),
    
  removeFriend: (friendshipId: number): Promise<ApiResponse<void>> => 
    apiService.request<void>(`/friendships/${friendshipId}`, 'DELETE')
};

// Match API
export const matchApi = {
  getUserMatches: (userId?: number): Promise<ApiResponse<Match[]>> => 
    apiService.request<Match[]>(userId ? `/matches/user/${userId}` : '/matches/user'),
    
  getMatchDetails: (matchId: number): Promise<ApiResponse<Match>> => 
    apiService.request<Match>(`/matches/${matchId}`),
    
  createMatch: (opponentId: number): Promise<ApiResponse<Match>> => 
    apiService.request<Match>('/matches', 'POST', { opponent_id: opponentId })
}; 