// WebSocket URL configuration
const WS_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000'  
  : window.location.origin;  // Use the same origin in production

// Log the WebSocket URL for debugging
console.log('[Socket.io] Using WebSocket URL:', WS_URL);

// Définition du type pour io (Socket.io)
declare const io: any;

// Constantes partagées avec auth.ts
const TOKEN_KEY = 'auth_token';

class WebSocketService {
  public socket: any = null; // Socket.io socket instead of WebSocket
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 3000;
  private isBackendAvailable = true;

  // Connect to the Socket.io server
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('[Socket.io] Already connected');
      return;
    }

    if (!this.isBackendAvailable) {
      console.log('[Socket.io] Backend previously marked as unavailable, skipping connection attempt');
      return;
    }

    // Get token from auth service or storage
    let token = null;
    
    // Try to get token from auth service first
    const authService = (window as any).authService;
    if (authService && authService.getToken && typeof authService.getToken === 'function') {
      token = authService.getToken();
      console.log('[Socket.io] Got token from authService:', !!token);
    }
    
    // Fallback to localStorage if token not available from auth service
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
      console.log('[Socket.io] Got token from localStorage:', !!token);
    }
    
    if (!token) {
      console.log('[Socket.io] No token available for connection');
      return;
    }

    try {
      // Close any existing connection
      this.disconnect();

      // Import Socket.io client from CDN if not already available
      if (typeof io === 'undefined') {
        console.log('[Socket.io] io not defined, loading script from CDN');
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
        script.onload = () => this.initializeSocket(token);
        document.head.appendChild(script);
      } else {
        this.initializeSocket(token);
      }
    } catch (error) {
      console.error('[Socket.io] Setup error:', error);
      this.attemptReconnect();
    }
  }

  // Initialize Socket.io connection
  private initializeSocket(token: string) {
    console.log('[Socket.io] Initializing connection');
    try {
      // Log the original token format for debugging
      console.log('[Socket.io] Original token format:', token.startsWith('Bearer ') ? 'Has Bearer prefix' : 'No Bearer prefix');
      
      // Remove Bearer prefix if it exists, to ensure we're not double-prefixing
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      const tokenPreview = cleanToken.length > 20 
        ? cleanToken.substring(0, 15) + '...' + cleanToken.substring(cleanToken.length - 5)
        : cleanToken;
      
      console.log('[Socket.io] Token prepared for connection:', tokenPreview);
      
      // Connect to Socket.io server with clean token (no Bearer prefix)
      this.socket = io(WS_URL, {
        auth: { token: cleanToken },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000
      });

      // Connection success
      this.socket.on('connect', () => {
        console.log('[Socket.io] Connected successfully');
        this.reconnectAttempts = 0;
        this.isBackendAvailable = true;
        this.reattachListeners();
      });

      // Connection error
      this.socket.on('connect_error', (error: any) => {
        console.error('[Socket.io] Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          console.log('[Socket.io] Max reconnect attempts reached, giving up');
          this.isBackendAvailable = false;
          this.socket.disconnect();
        }
      });

      // Handle disconnect
      this.socket.on('disconnect', (reason: string) => {
        console.log(`[Socket.io] Disconnected: ${reason}`);
      });

      // Handle errors from server
      this.socket.on('error', (data: any) => {
        console.error('[Socket.io] Error from server:', data);
        if (data && data.message) {
          alert(`Erreur: ${data.message}`);
        }
      });

      // Setup handlers for standard events we're interested in
      ['friend-request-received', 'friend-request-sent', 'friend-request-accepted', 
       'friend-request-rejected', 'friend-removed', 'friend-status-change', 
       'game-invitation', 'game-started'].forEach(event => {
        this.socket.on(event, (data: any) => {
          console.log(`[Socket.io] Received ${event} event:`, data);
          // Add type field if not present
          if (!data.type) {
            data.type = event;
          }
          // Forward to our listeners
          if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => callback(data));
          }
        });
      });
    } catch (error) {
      console.error('[Socket.io] Initialization error:', error);
      this.attemptReconnect();
    }
  }

  // Disconnect from the Socket.io server
  disconnect() {
    if (this.socket) {
      console.log('[Socket.io] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Subscribe to an event
  on(event: string, callback: (data: any) => void) {
    console.log(`[Socket.io] Registering event handler for: ${event}`);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // If already connected, register with socket.io server
    if (this.socket && this.socket.connected) {
      console.log(`[Socket.io] Already connected, subscribing to ${event}`);
      this.socket.on(event, (data: any) => {
        console.log(`[Socket.io] Direct event ${event}:`, data);
        // Add type if missing
        if (!data.type) {
          data.type = event;
        }
        callback(data);
      });
    }
  }

  // Unsubscribe from an event
  off(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
        // If connected, remove listener from socket.io
        if (this.socket && this.socket.connected) {
          this.socket.off(event);
        }
      }
    }
  }

  // Send a message to the server
  send(type: string, data: any) {
    if (!this.socket || !this.socket.connected) {
      console.warn('[Socket.io] Cannot send message: not connected');
      return false;
    }

    try {
      console.log(`[Socket.io] Emitting ${type}:`, data);
      this.socket.emit(type, data);
      return true;
    } catch (error) {
      console.error('[Socket.io] Error sending message:', error);
      return false;
    }
  }

  // Check if connected
  isConnected() {
    console.log('[Socket.io] Checking connection status:', this.socket?.connected || false);
    return this.socket && this.socket.connected;
  }

  // Reattach all event listeners after reconnect
  private reattachListeners() {
    if (!this.socket || !this.socket.connected) return;

    console.log('[Socket.io] Reattaching event listeners');
    this.listeners.forEach((callbacks, event) => {
      console.log(`[Socket.io] Resubscribing to event: ${event}`);
      
      this.socket.on(event, (data: any) => {
        console.log(`[Socket.io] Received reattached ${event}:`, data);
        // Add type if missing
        if (!data.type) {
          data.type = event;
        }
        callbacks.forEach(callback => callback(data));
      });
    });
  }

  // Attempt to reconnect
  private attemptReconnect() {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('[Socket.io] Max reconnect attempts reached, giving up');
      this.isBackendAvailable = false;
      return;
    }

    const delay = Math.min(10000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    console.log(`[Socket.io] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

// Export the websocket service
export { websocketService };

// Make it globally available
(window as any).websocketService = websocketService;

// Auto-connect if user is authenticated
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    console.log('[Socket.io] Auto-connecting...');
    websocketService.connect();
  }
}); 