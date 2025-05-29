// WebSocket URL configuration
const WS_URL = ( 
  window.location.hostname === 'localhost' &&
  window.location.port === '5173'
)
  ? 'http://localhost:3000'
  : '/api';

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
  private connectionPromise: Promise<boolean> | null = null;
  private isConnecting = false;

  // Connect to the Socket.io server
  connect(): Promise<boolean> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket && this.socket.connected) {
      console.log('[Socket.io] Already connected');
      return Promise.resolve(true);
    }

    if (!this.isBackendAvailable) {
      console.log('[Socket.io] Backend previously marked as unavailable, skipping connection attempt');
      return Promise.resolve(false);
    }

    // Create a new connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      this.isConnecting = true;

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
        this.isConnecting = false;
        this.connectionPromise = null;
        resolve(false);
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
          script.onload = () => this.initializeSocket(token, resolve, reject);
          script.onerror = () => {
            console.error('[Socket.io] Failed to load Socket.io script');
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Failed to load Socket.io script'));
          };
          document.head.appendChild(script);
        } else {
          this.initializeSocket(token, resolve, reject);
        }
      } catch (error) {
        console.error('[Socket.io] Setup error:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Initialize Socket.io connection
  private initializeSocket(token: string, resolve: (value: boolean) => void, reject: (reason?: any) => void) {
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
        this.isConnecting = false;
        this.connectionPromise = null;
        
        // Wait a bit before reattaching listeners to ensure connection is stable
        setTimeout(() => {
          this.reattachListeners();
          resolve(true);
        }, 100);
      });

      // Connection error
      this.socket.on('connect_error', (error: any) => {
        console.error('[Socket.io] Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          console.log('[Socket.io] Max reconnect attempts reached, giving up');
          this.isBackendAvailable = false;
          this.isConnecting = false;
          this.connectionPromise = null;
          this.socket.disconnect();
          reject(error);
        }
      });

      // Handle disconnect
      this.socket.on('disconnect', (reason: string) => {
        console.log(`[Socket.io] Disconnected: ${reason}`);
        this.isConnecting = false;
        this.connectionPromise = null;
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          setTimeout(() => {
            this.connect();
          }, 2000);
        }
      });

      // Handle errors from server
      this.socket.on('error', (data: any) => {
        console.error('[Socket.io] Error from server:', data);
        if (data && data.message) {
          console.error(`WebSocket Error: ${data.message}`);
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
      this.isConnecting = false;
      this.connectionPromise = null;
      reject(error);
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
    this.isConnecting = false;
    this.connectionPromise = null;
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
      // Remove existing listeners for this event to avoid duplicates
      this.socket.off(event);
      this.socket.on(event, (data: any) => {
        console.log(`[Socket.io] Direct event ${event}:`, data);
        // Add type if missing
        if (!data.type) {
          data.type = event;
        }
        // Call all callbacks for this event
        const eventCallbacks = this.listeners.get(event);
        if (eventCallbacks) {
          eventCallbacks.forEach(cb => cb(data));
        }
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

  // Send a message to the server with connection check
  async send(type: string, data: any): Promise<boolean> {
    // Ensure we're connected before sending
    if (!this.isConnected()) {
      console.log('[Socket.io] Not connected, attempting to connect before sending message');
      try {
        const connected = await this.connect();
        if (!connected) {
          console.warn('[Socket.io] Failed to connect, cannot send message');
          return false;
        }
        // Wait a bit more to ensure connection is stable
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('[Socket.io] Connection failed:', error);
        return false;
      }
    }

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
    const connected = this.socket && this.socket.connected;
    console.log('[Socket.io] Checking connection status:', connected || false);
    return connected;
  }

  // Check if currently connecting
  isCurrentlyConnecting() {
    return this.isConnecting;
  }

  // Reattach all event listeners after reconnect
  private reattachListeners() {
    if (!this.socket || !this.socket.connected) return;

    console.log('[Socket.io] Reattaching event listeners');
    
    // Don't clear all listeners, just reattach our custom ones
    this.listeners.forEach((callbacks, event) => {
      console.log(`[Socket.io] Resubscribing to event: ${event}`);
      
      // Remove existing listener for this event to avoid duplicates
      this.socket.off(event);
      
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
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    console.log('[Socket.io] Auto-connecting...');
    try {
      await websocketService.connect();
      console.log('[Socket.io] Auto-connection successful');
    } catch (error) {
      console.error('[Socket.io] Auto-connection failed:', error);
    }
  }
}); 
