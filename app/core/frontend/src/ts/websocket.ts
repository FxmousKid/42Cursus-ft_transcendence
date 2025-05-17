// WebSocket URL configuration
const WS_URL = 'http://localhost:3000';

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds initial delay

  // Connect to the WebSocket server
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('[WebSocket] No token available for connection');
      return;
    }

    try {
      // Close any existing connection
      this.disconnect();

      // Create a new connection with the token
      this.socket = new WebSocket(`${WS_URL.replace('http', 'ws')}/ws?token=${token}`);

      // Connection opened
      this.socket.addEventListener('open', () => {
        console.log('[WebSocket] Connected successfully');
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Register all existing event listeners
        this.reattachListeners();
      });

      // Listen for messages
      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type;
          
          if (eventType && this.listeners.has(eventType)) {
            this.listeners.get(eventType)?.forEach(callback => {
              callback(data);
            });
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      // Connection closed (attempt reconnect)
      this.socket.addEventListener('close', (event) => {
        console.log(`[WebSocket] Connection closed: ${event.code} ${event.reason}`);
        this.attemptReconnect();
      });

      // Connection error
      this.socket.addEventListener('error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.attemptReconnect();
      });
    } catch (error) {
      console.error('[WebSocket] Setup error:', error);
      this.attemptReconnect();
    }
  }

  // Disconnect from the WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
  }

  // Subscribe to an event
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // If socket is open, send a subscription message
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action: 'subscribe', event }));
    }
  }

  // Unsubscribe from an event
  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
    
    // If no more listeners for this event, send unsubscribe message
    if (this.listeners.get(event)?.size === 0 && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action: 'unsubscribe', event }));
    }
  }

  // Send a message to the server
  send(type: string, data: any) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: connection not open');
      return;
    }

    this.socket.send(JSON.stringify({ type, ...data }));
  }

  // Reattach all event listeners after reconnect
  private reattachListeners() {
    if (this.socket?.readyState !== WebSocket.OPEN) return;

    this.listeners.forEach((_, event) => {
      this.socket?.send(JSON.stringify({ action: 'subscribe', event }));
    });
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached, giving up');
      return;
    }

    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService(); 