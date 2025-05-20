// WebSocket events we can listen for
export var SocketEvent;
(function (SocketEvent) {
    SocketEvent["CONNECT"] = "connect";
    SocketEvent["DISCONNECT"] = "disconnect";
    SocketEvent["ERROR"] = "error";
    SocketEvent["ONLINE_USERS"] = "online-users";
    SocketEvent["FRIEND_REQUEST_RECEIVED"] = "friend-request-received";
    SocketEvent["FRIEND_REQUEST_ACCEPTED"] = "friend-request-accepted";
    SocketEvent["FRIEND_STATUS_CHANGED"] = "friend-status-changed";
    SocketEvent["GAME_INVITATION_RECEIVED"] = "game-invitation-received";
    SocketEvent["GAME_INVITATION_RESPONSE"] = "game-invitation-response";
    SocketEvent["GAME_STARTED"] = "game-started";
    SocketEvent["GAME_STATE_UPDATE"] = "game-state-update";
    SocketEvent["GAME_ENDED"] = "game-ended";
    SocketEvent["CHAT_MESSAGE"] = "chat-message";
})(SocketEvent || (SocketEvent = {}));
// Socket service singleton
export class SocketService {
    constructor() {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "token", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "reconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxReconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "reconnectTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Initialize listeners map
        Object.values(SocketEvent).forEach(event => {
            this.listeners[event] = new Set();
        });
    }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    connect(token) {
        this.token = token;
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        // Close existing socket if any
        this.close();
        // Create new WebSocket connection
        const wsUrl = `ws://localhost:3001/socket.io/?token=${token}`;
        this.socket = new WebSocket(wsUrl);
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.notifyListeners(SocketEvent.CONNECT);
        };
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event && typeof data.event === 'string' && data.data) {
                    this.notifyListeners(data.event, data.data);
                }
            }
            catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.notifyListeners(SocketEvent.ERROR, { message: 'WebSocket connection error' });
        };
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.notifyListeners(SocketEvent.DISCONNECT);
            this.attemptReconnect();
        };
    }
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
            const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${timeout}ms...`);
            this.reconnectTimeout = window.setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(this.token);
            }, timeout);
        }
    }
    close() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = new Set();
        }
        this.listeners[event].add(listener);
    }
    off(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event].delete(listener);
        }
    }
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => {
                listener(data);
            });
        }
    }
    emit(event, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ event, data }));
        }
        else {
            console.error('Cannot emit event: WebSocket not connected');
        }
    }
    // Friend-related methods
    sendFriendRequest(friendId) {
        this.emit('friend-request', { friendId });
    }
    respondToFriendRequest(friendId, accept) {
        this.emit('friend-request-response', { friendId, accept });
    }
    // Game-related methods
    sendGameInvitation(friendId) {
        this.emit('game-invitation', { friendId });
    }
    respondToGameInvitation(friendId, accept) {
        this.emit('game-invitation-response', { friendId, accept });
    }
    sendGameInput(direction) {
        this.emit('game-input', { direction });
    }
    // Chat-related methods
    sendChatMessage(roomId, message) {
        this.emit('chat-message', { roomId, message });
    }
}
// Export singleton instance
export const socketService = SocketService.getInstance();
//# sourceMappingURL=socket.js.map