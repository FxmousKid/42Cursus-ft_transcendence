import { api } from './api';
import { websocketService } from './websocket';

export interface Friend {
  id: number;
  username: string;
  avatar_url: string | null;
  has_avatar_data?: boolean;
  status: string;
}

export interface PendingRequest {
  id: number;
  user: {
    id: number;
    username: string;
    avatar_url: string | null;
    has_avatar_data?: boolean;
  };
}

class FriendshipService {
  private friendListeners: ((friends: Friend[]) => void)[] = [];
  private requestListeners: ((requests: PendingRequest[]) => void)[] = [];
  private notificationListeners: ((message: string, type: 'info' | 'success' | 'error') => void)[] = [];

  constructor() {
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    // Listen for friend request received
    websocketService.on('friend-request-received', (data: any) => {
      console.log('Friend request received via WebSocket:', data);
      this.loadPendingRequests();
      this.notifyListeners(`Nouvelle demande d'ami de ${data.from?.username || 'quelqu\'un'}`, 'info');
    });

    // Listen for friend request sent confirmation
    websocketService.on('friend-request-sent', (data: any) => {
      console.log('Friend request sent via WebSocket:', data);
      this.notifyListeners(`Demande d'ami envoyée à ${data.friend_username}`, 'success');
    });

    // Listen for friend request accepted
    websocketService.on('friend-request-accepted', (data: any) => {
      console.log('Friend request accepted via WebSocket:', data);
      this.loadFriends();
      
      // Different format based on who accepted the request
      if (data.friend) {
        // When someone accepts your request
        this.notifyListeners(`${data.friend.username || 'Quelqu\'un'} a accepté votre demande d'ami`, 'success');
      } else {
        // When you accept someone's request
        this.notifyListeners(`Demande d'ami acceptée`, 'success');
      }
    });

    // Listen for friend request rejected
    websocketService.on('friend-request-rejected', (data: any) => {
      console.log('Friend request rejected via WebSocket:', data);
      this.notifyListeners(`Demande d'ami rejetée`, 'info');
    });

    // Listen for friend removed
    websocketService.on('friend-removed', (data: any) => {
      console.log('Friend removed via WebSocket:', data);
      this.loadFriends();
      this.notifyListeners(`Ami supprimé de votre liste`, 'info');
    });

    // Listen for friend status changes
    websocketService.on('friend-status-change', (data: any) => {
      console.log('Friend status changed via WebSocket:', data);
      // Make sure we're using the right property name for the friend ID
      const friendId = data.friend_id;
      const status = data.status;
      if (friendId && status) {
        this.loadFriends(); // Reload all friends to keep UI in sync
      }
    });
  }

  async sendFriendRequest(friendId: number): Promise<boolean> {
    try {
      // Try WebSocket first
      if (websocketService.isConnected()) {
        websocketService.send('friend-request', { friendId });
        return true;
      } else {
        // Fallback to REST API
        const response = await api.friendship.sendFriendRequest(friendId);
        if (response.success) {
          this.notifyListeners(`Demande d'ami envoyée`, 'success');
          return true;
        } else {
          this.notifyListeners(`Erreur: ${response.message || 'Échec de l\'envoi de la demande d\'ami'}`, 'error');
          return false;
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      this.notifyListeners('Erreur lors de l\'envoi de la demande d\'ami', 'error');
      return false;
    }
  }

  async acceptFriendRequest(friendId: number): Promise<boolean> {
    try {
      // Try WebSocket first
      if (websocketService.isConnected()) {
        websocketService.send('friend-request-response', { friendId, accept: true });
        return true;
      } else {
        // Fallback to REST API for the request ID
        const requests = await this.getPendingRequests();
        const request = requests.find(req => req.user.id === friendId);
        
        if (!request) {
          this.notifyListeners('Demande d\'ami introuvable', 'error');
          return false;
        }
        
        const response = await api.friendship.acceptFriendRequest(request.id);
        if (response.success) {
          this.loadFriends();
          this.loadPendingRequests();
          this.notifyListeners('Demande d\'ami acceptée', 'success');
          return true;
        } else {
          this.notifyListeners(`Erreur: ${response.message || 'Échec de l\'acceptation de la demande d\'ami'}`, 'error');
          return false;
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      this.notifyListeners('Erreur lors de l\'acceptation de la demande d\'ami', 'error');
      return false;
    }
  }

  async rejectFriendRequest(friendId: number): Promise<boolean> {
    try {
      // Try WebSocket first
      if (websocketService.isConnected()) {
        websocketService.send('friend-request-response', { friendId, accept: false });
        return true;
      } else {
        // Fallback to REST API for the request ID
        const requests = await this.getPendingRequests();
        const request = requests.find(req => req.user.id === friendId);
        
        if (!request) {
          this.notifyListeners('Demande d\'ami introuvable', 'error');
          return false;
        }
        
        const response = await api.friendship.rejectFriendRequest(request.id);
        if (response.success) {
          this.loadPendingRequests();
          this.notifyListeners('Demande d\'ami rejetée', 'info');
          return true;
        } else {
          this.notifyListeners(`Erreur: ${response.message || 'Échec du rejet de la demande d\'ami'}`, 'error');
          return false;
        }
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      this.notifyListeners('Erreur lors du rejet de la demande d\'ami', 'error');
      return false;
    }
  }

  async removeFriend(friendId: number): Promise<boolean> {
    try {
      // Try WebSocket first
      if (websocketService.isConnected()) {
        websocketService.send('friend-remove', { friendId });
        return true;
      } else {
        // Fallback to REST API
        const response = await api.friendship.removeFriend(friendId);
        if (response.success) {
          this.loadFriends();
          this.notifyListeners('Ami supprimé avec succès', 'success');
          return true;
        } else {
          this.notifyListeners(`Erreur: ${response.message || 'Échec de la suppression de l\'ami'}`, 'error');
          return false;
        }
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      this.notifyListeners('Erreur lors de la suppression de l\'ami', 'error');
      return false;
    }
  }

  async getFriends(): Promise<Friend[]> {
    try {
      const response = await api.friendship.getFriends();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      this.notifyListeners('Erreur lors du chargement des amis', 'error');
      return [];
    }
  }

  async getPendingRequests(): Promise<PendingRequest[]> {
    try {
      console.log('FriendshipService: Fetching pending requests');
      const response = await api.friendship.getPendingRequests();
      console.log('FriendshipService: Raw API response for pending requests:', response);
      
      if (response.success && response.data) {
        // Normaliser le format des données
        const requests = response.data.map((request: any) => {
          console.log('FriendshipService: Processing request:', request);
          
          let userData = request.user || request.sender;
          if (!userData) {
            console.warn('FriendshipService: Missing user data in request:', request);
            // Créer un objet utilisateur minimal si les données sont manquantes
            userData = {
              id: request.user_id || 0,
              username: 'Utilisateur inconnu',
              avatar_url: null
            };
          }
          
          return {
            id: request.id,
            user: {
              id: userData.id,
              username: userData.username,
              avatar_url: userData.avatar_url,
              has_avatar_data: userData.has_avatar_data || false
            }
          };
        });
        
        console.log('FriendshipService: Normalized pending requests:', requests);
        return requests;
      }
      
      console.log('FriendshipService: No pending requests found or API error');
      return [];
    } catch (error) {
      console.error('FriendshipService: Error fetching pending requests:', error);
      this.notifyListeners('Erreur lors du chargement des demandes d\'ami', 'error');
      return [];
    }
  }

  // Method to add a listener for friend list updates
  onFriendsUpdate(callback: (friends: Friend[]) => void) {
    this.friendListeners.push(callback);
    // Immediately load friends data
    this.loadFriends();
  }

  // Method to add a listener for pending requests updates
  onRequestsUpdate(callback: (requests: PendingRequest[]) => void) {
    this.requestListeners.push(callback);
    // Immediately load pending requests
    this.loadPendingRequests();
  }

  // Method to add a notification listener
  onNotification(callback: (message: string, type: 'info' | 'success' | 'error') => void) {
    this.notificationListeners.push(callback);
  }

  // Helper method to load and broadcast friends
  private async loadFriends() {
    const friends = await this.getFriends();
    this.friendListeners.forEach(listener => listener(friends));
  }

  // Helper method to load and broadcast pending requests
  private async loadPendingRequests() {
    const requests = await this.getPendingRequests();
    this.requestListeners.forEach(listener => listener(requests));
  }

  // Helper method to notify all notification listeners
  private notifyListeners(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.notificationListeners.forEach(listener => listener(message, type));
  }
}

export const friendshipService = new FriendshipService();

// Make it globally available
(window as any).friendshipService = friendshipService; 