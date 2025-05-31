// Add at the top for TypeScript global typing

declare global {
  interface Window {
    authService?: {
      isAuthenticated?: () => boolean;
    };
  }
}

// Global Presence Service for Online/Offline Status
// Usage: Import and call PresenceService.start() after authentication

import { websocketService } from './websocket';

class PresenceService {
  private heartbeatInterval: number = 20000; // 20 seconds
  private reconnectBaseDelay: number = 2000; // 2 seconds
  private reconnectMaxDelay: number = 30000; // 30 seconds
  private reconnectAttempts: number = 0;
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isStarted: boolean = false;
  private isConnected: boolean = false;
  private lastPing: number = 0;

  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.connect();
    this.setupEventListeners();
  }

  stop() {
    this.isStarted = false;
    this.clearHeartbeat();
    this.clearReconnect();
    if (websocketService && websocketService.disconnect) {
      websocketService.disconnect();
    }
    this.isConnected = false;
  }

  private connect() {
    if (!this.isStarted) return;
    if (
      typeof window.authService === 'undefined' ||
      typeof window.authService.isAuthenticated !== 'function' ||
      !window.authService.isAuthenticated()
    ) {
      this.isConnected = false;
      return;
    }
    websocketService.connect().then((connected: boolean) => {
      if (connected) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.sendStatus('online');
        this.listenSocketEvents();
      } else {
        this.isConnected = false;
        this.scheduleReconnect();
      }
    }).catch(() => {
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  private listenSocketEvents() {
    if (!websocketService || !websocketService.socket) return;
    websocketService.socket.on('disconnect', () => {
      this.isConnected = false;
      this.clearHeartbeat();
      this.scheduleReconnect();
    });
    websocketService.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.sendStatus('online');
    });
    websocketService.socket.on('friend-status-change', (data: any) => {
      // Optionally, broadcast to app or update UI
      window.dispatchEvent(new CustomEvent('presence:friend-status', { detail: data }));
    });
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
    this.sendHeartbeat();
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat() {
    if (websocketService && websocketService.socket && websocketService.socket.connected) {
      websocketService.socket.emit('heartbeat', { ts: Date.now() });
      this.lastPing = Date.now();
    }
  }

  private sendStatus(status: 'online' | 'offline') {
    if (websocketService && websocketService.socket && websocketService.socket.connected) {
      websocketService.socket.emit('status-update', { status });
    }
  }

  private scheduleReconnect() {
    this.clearReconnect();
    if (!this.isStarted) return;
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts), this.reconnectMaxDelay);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      if (this.isStarted) this.connect();
    });
    window.addEventListener('offline', () => {
      this.stop();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isStarted) {
        this.connect();
      }
    });
  }
}

export const presenceService = new PresenceService();
(window as any).presenceService = presenceService; 