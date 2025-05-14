import { GameState } from '../types/index';
import { toastUtils } from '../utils/toast';

// Constantes pour les événements WebSocket
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  GAME_INVITATION_RECEIVED = 'game_invitation_received',
  GAME_INVITATION_ACCEPTED = 'game_invitation_accepted',
  GAME_INVITATION_REJECTED = 'game_invitation_rejected',
  GAME_STARTED = 'game_started',
  GAME_STATE_UPDATE = 'game_state_update',
  GAME_ENDED = 'game_ended',
  FRIEND_REQUEST_RECEIVED = 'friend_request_received',
  FRIEND_ONLINE_STATUS_CHANGED = 'friend_online_status_changed',
  GAME_INPUT = 'game_input',
  ERROR = 'error',
  USER_STATUS_UPDATE = 'user_status_update'
}

/**
 * Service pour la gestion des connexions WebSocket
 */
class SocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private pingInterval: number | null = null;
  
  /**
   * Initialise la connexion WebSocket
   */
  connect(token: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    
    this.token = token;
    
    // On détermine l'URL du WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;
    
    // Créer une nouvelle connexion WebSocket avec le token d'authentification
    this.socket = new WebSocket(wsUrl);
    
    // Gestionnaire d'événement pour l'ouverture de la connexion
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.emit(SocketEvent.CONNECT);
      
      // Configurer le ping pour maintenir la connexion active
      this.startPingInterval();
    };
    
    // Gestionnaire d'événement pour la réception de messages
    this.socket.onmessage = this.handleMessage.bind(this);
    
    // Gestionnaire d'événement pour la fermeture de la connexion
    this.socket.onclose = this.handleClose.bind(this);
    
    // Gestionnaire d'événement pour les erreurs
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit(SocketEvent.ERROR, error);
    };
  }
  
  /**
   * Démarre un intervalle pour envoyer des pings réguliers au serveur
   */
  private startPingInterval(): void {
    // Arrêter l'intervalle existant s'il y en a un
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
    }
    
    // Envoyer un ping toutes les 30 secondes pour maintenir la connexion active
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ event: 'ping' }));
      }
    }, 30000);
  }
  
  /**
   * Arrête l'intervalle de ping
   */
  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Gère la réception de messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Si c'est un pong, on ne fait rien de spécial
      if (data.event === 'pong') {
        return;
      }
      
      // Si le message contient un événement, l'émettre
      if (data.event) {
        this.emit(data.event, data.payload);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Gère la fermeture de la connexion
   */
  private handleClose(event: CloseEvent): void {
    // Arrêter l'intervalle de ping
    this.stopPingInterval();
    
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.emit(SocketEvent.DISCONNECT, { code: event.code, reason: event.reason });
    
    // Tenter de se reconnecter uniquement si la fermeture n'était pas volontaire
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Tente de se reconnecter à WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toastUtils.error('La connexion au serveur a été perdue. Veuillez rafraîchir la page.');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Augmenter le délai à chaque tentative (backoff exponentiel)
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.token) {
        toastUtils.info('Tentative de reconnexion au serveur...');
        this.connect(this.token);
      }
    }, delay);
  }
  
  /**
   * Envoie un message au serveur
   */
  send(event: string, payload?: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }
    
    this.socket.send(JSON.stringify({
      event,
      payload
    }));
  }
  
  /**
   * S'abonne à un événement
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)?.push(callback);
  }
  
  /**
   * Se désabonne d'un événement
   */
  off(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Émet un événement aux abonnés
   */
  private emit(event: string, payload?: any): void {
    const listeners = this.eventListeners.get(event);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      // Arrêter l'intervalle de ping
      this.stopPingInterval();
      
      // Fermer la connexion proprement avec le code 1000 (fermeture normale)
      this.socket.close(1000, 'Disconnected by user');
      this.socket = null;
    }
  }
  
  /**
   * Vérifie si la connexion est établie
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Envoie une invitation de jeu
   */
  sendGameInvitation(userId: number): void {
    this.send(SocketEvent.GAME_INVITATION_RECEIVED, { to_user_id: userId });
  }
  
  /**
   * Répond à une invitation de jeu
   */
  respondToGameInvitation(userId: number, accept: boolean): void {
    if (accept) {
      this.send(SocketEvent.GAME_INVITATION_ACCEPTED, { from_user_id: userId });
    } else {
      this.send(SocketEvent.GAME_INVITATION_REJECTED, { from_user_id: userId });
    }
  }
  
  /**
   * Envoie une entrée de jeu (mouvement)
   */
  sendGameInput(direction: 'up' | 'down' | 'stop'): void {
    this.send(SocketEvent.GAME_INPUT, { direction });
  }
}

// Exporter une instance unique du service
export const socketService = new SocketService(); 