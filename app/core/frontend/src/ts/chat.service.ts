// Types for chat messages
interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: 'text' | 'game_invite' | 'tournament_notification';
  read: boolean;
  createdAt: Date;
}

class ChatService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private websocketService: any;

  constructor() {
    this.websocketService = (window as any).websocketService;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for chat messages
    this.websocketService.on('chatMessage', (data: ChatMessage) => {
      console.log('[Chat] Received message:', data);
      this.notifyListeners('chatMessage', data);
    });

    // Listen for message read receipts
    this.websocketService.on('messageRead', (data: ChatMessage) => {
      console.log('[Chat] Message read:', data);
      this.notifyListeners('messageRead', data);
    });

    // Listen for game invites
    this.websocketService.on('gameInvite', (data: ChatMessage) => {
      console.log('[Chat] Game invite received:', data);
      this.notifyListeners('gameInvite', data);
    });

    // Listen for tournament notifications
    this.websocketService.on('tournamentNotification', (data: ChatMessage) => {
      console.log('[Chat] Tournament notification received:', data);
      this.notifyListeners('tournamentNotification', data);
    });
  }

  // Send a chat message
  sendMessage(receiverId: number, content: string, type: 'text' | 'game_invite' | 'tournament_notification' = 'text') {
    console.log(`[Chat] Sending message to ${receiverId}:`, content);
    return this.websocketService.send('sendMessage', {
      receiver_id: receiverId,
      content,
      type
    });
  }

  // Send a game invite
  sendGameInvite(receiverId: number, gameId: string) {
    console.log(`[Chat] Sending game invite to ${receiverId} for game ${gameId}`);
    return this.websocketService.send('sendGameInvite', {
      receiver_id: receiverId,
      game_id: gameId
    });
  }

  // Send a tournament notification
  sendTournamentNotification(receiverId: number, tournamentId: number) {
    console.log(`[Chat] Sending tournament notification to ${receiverId} for tournament ${tournamentId}`);
    return this.websocketService.send('sendTournamentNotification', {
      receiver_id: receiverId,
      tournament_id: tournamentId
    });
  }

  // Mark a message as read
  markMessageAsRead(messageId: number) {
    console.log(`[Chat] Marking message ${messageId} as read`);
    return this.websocketService.send('markAsRead', messageId);
  }

  // Subscribe to chat events
  on(event: string, callback: (data: any) => void) {
    console.log(`[Chat] Adding listener for ${event}`);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from chat events
  off(event: string, callback: (data: any) => void) {
    console.log(`[Chat] Removing listener for ${event}`);
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Notify all listeners of an event
  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Create a singleton instance
const chatService = new ChatService();

// Export the chat service
export { chatService };

// Make it globally available
(window as any).chatService = chatService; 