import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3001', {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Réécoutez tous les événements enregistrés après la reconnexion
    this.socket.on('connect', () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.on(event, callback);
        });
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }
}

export const websocketService = new WebSocketService(); 