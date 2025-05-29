// Chat functionality - Système de chat modulaire simplifié et robuste
import { api } from './api';

// Blocking system manager - Version simplifiée et fiable
class BlockingManager {
    private blockedUsers: Set<number> = new Set();
    private blockedByUsers: Set<number> = new Set();
    private isLoading: boolean = false;
    
    constructor() {
        this.loadBlockedUsers();
        this.setupWebSocketHandlers();
    }
    
    private setupWebSocketHandlers() {
        const websocketService = (window as any).websocketService;
        if (!websocketService) {
            console.warn('⚠️ WebSocket service not available for blocking system');
            return;
        }

        // Listen for successful block confirmation
        websocketService.on('user-block-success', (data: any) => {
            console.log('✅ Block confirmed via WebSocket:', data);
            this.blockedUsers.add(data.blocked_id);
            
            // Update chat interface if currently viewing this user
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.blocked_id) {
                console.log('🔄 Updating chat interface after block');
                chatManager.showBlockedInterface(data.blocked_id, data.blocked_username, true);
            }
        });

        // Listen for successful unblock confirmation
        websocketService.on('user-unblock-success', (data: any) => {
            console.log('✅ Unblock confirmed via WebSocket:', data);
            this.blockedUsers.delete(data.unblocked_id);
            
            // Force immediate chat interface refresh
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.unblocked_id) {
                console.log('🔄 Refreshing chat interface after unblock');
                // Clear the blocked interface and reload chat properly
                chatManager.forceRefreshChat(data.unblocked_id, data.unblocked_username);
            }
        });

        // Listen for being blocked by someone
        websocketService.on('user-blocked-by', (data: any) => {
            console.log('🚫 Blocked by user via WebSocket:', data);
            this.blockedByUsers.add(data.blocker_id);
            
            // If currently chatting with this user, show blocked interface
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.blocker_id) {
                chatManager.showBlockedInterface(data.blocker_id, data.blocker_username, false);
            }
        });

        // Listen for being unblocked by someone
        websocketService.on('user-unblocked-by', (data: any) => {
            console.log('✅ Unblocked by user via WebSocket:', data);
            this.blockedByUsers.delete(data.unblocker_id);
            
            // If currently viewing this user's chat, refresh it immediately
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.unblocker_id) {
                console.log('🔄 Refreshing chat interface after being unblocked');
                chatManager.forceRefreshChat(data.unblocker_id, data.unblocker_username);
            }
        });
    }
    
    async loadBlockedUsers() {
        if (this.isLoading) {
            console.log('⏳ Already loading blocked users, skipping');
            return;
        }
        
        this.isLoading = true;
        try {
            const response = await api.chat.getBlockedUsers();
            if (response.success && response.data) {
                this.blockedUsers.clear();
                this.blockedByUsers.clear();
                
                const currentUserId = this.getCurrentUserId();
                if (!currentUserId) return;
                
                response.data.forEach((block: any) => {
                    if (block.blocker_id === currentUserId) {
                        this.blockedUsers.add(block.blocked_id);
                    } else if (block.blocked_id === currentUserId) {
                        this.blockedByUsers.add(block.blocker_id);
                    }
                });
                
                console.log(`📛 ${this.blockedUsers.size} blocked, ${this.blockedByUsers.size} blocked by`);
            }
        } catch (error) {
            console.error('❌ Error loading blocked users:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async blockUser(userId: number): Promise<boolean> {
        try {
            const websocketService = (window as any).websocketService;
            
            // Try WebSocket first - NO optimistic updates
            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                console.log(`🚫 Blocking user ${userId} via WebSocket`);
                websocketService.send('user-block', { blockedUserId: userId });
                return true;
            } else {
                // Fallback to REST API
                console.log(`🚫 Blocking user ${userId} via REST API`);
                const response = await api.chat.blockUser(userId);
                if (response.success) {
                    // Only update state after successful API response
                    this.blockedUsers.add(userId);
                    console.log(`✅ User ${userId} blocked via REST API`);
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ Error blocking user:', error);
            return false;
        }
    }
    
    async unblockUser(userId: number): Promise<boolean> {
        if (!this.isBlocked(userId)) {
            console.log(`ℹ️ User ${userId} is not blocked, skipping unblock`);
            return true;
        }
        
        try {
            const websocketService = (window as any).websocketService;
            
            // Try WebSocket first - NO optimistic updates
            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                console.log(`✅ Unblocking user ${userId} via WebSocket`);
                websocketService.send('user-unblock', { unblockedUserId: userId });
                return true;
            } else {
                // Fallback to REST API
                console.log(`✅ Unblocking user ${userId} via REST API`);
                const response = await api.chat.unblockUser(userId);
                if (response.success) {
                    // Only update state after successful API response
                    this.blockedUsers.delete(userId);
                    console.log(`✅ User ${userId} unblocked via REST API`);
                    return true;
                } else {
                    console.error('❌ REST API unblock failed:', response);
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ Error unblocking user:', error);
            return false;
        }
    }
    
    isBlocked(userId: number): boolean {
        return this.blockedUsers.has(userId);
    }
    
    isBlockedBy(userId: number): boolean {
        return this.blockedByUsers.has(userId);
    }
    
    canChat(userId: number): boolean {
        return !this.isBlocked(userId) && !this.isBlockedBy(userId);
    }
    
    private getCurrentUserId(): number | null {
        // Try to get from auth service first
        const authService = (window as any).authService;
        if (authService?.getUserId) {
            const userId = parseInt(authService.getUserId());
            if (!isNaN(userId)) return userId;
        }
        
        const userIdStr = localStorage.getItem('user_id');
        if (userIdStr) {
            const userId = parseInt(userIdStr);
            if (!isNaN(userId)) return userId;
        }
        
        return null;
    }
}

export class ChatManager {
    private currentChatUserId: number | null = null;
    private currentChatUsername: string | null = null;
    private chatHistory: Map<number, any[]> = new Map();
    private chatWebSocketSetup = false;
    private blockingManager: BlockingManager;
    
    constructor() {
        this.chatHistory = new Map();
        this.currentChatUserId = null;
        this.blockingManager = new BlockingManager();
        
        // Initialize blocking system
        this.initializeBlockingSystem();
        
        this.initializeChatEventListeners();
        this.setupChatWebSocket();
    }
    
    private async initializeBlockingSystem() {
        try {
            await this.blockingManager.loadBlockedUsers();
            console.log('✅ Blocking system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize blocking system:', error);
        }
    }
    
    async openChatWithFriend(friendId: number, friendUsername: string) {
        console.log(`💬 Opening chat with ${friendUsername} (ID: ${friendId})`);
        
        // Ensure blocking system is loaded before checking permissions
        try {
            await this.blockingManager.loadBlockedUsers();
            console.log('✅ Blocking system refreshed before opening chat');
        } catch (error) {
            console.warn('⚠️ Could not refresh blocking system:', error);
        }
        
        // Check if chat is allowed AFTER ensuring data is loaded
        if (!this.blockingManager.canChat(friendId)) {
            console.log(`🚫 Chat not allowed with ${friendUsername}`);
            
            if (this.blockingManager.isBlocked(friendId)) {
                console.log(`📛 User ${friendUsername} is blocked by me`);
                this.showBlockedInterface(friendId, friendUsername, true);
            } else if (this.blockingManager.isBlockedBy(friendId)) {
                console.log(`🚫 I am blocked by ${friendUsername}`);
                this.showBlockedInterface(friendId, friendUsername, false);
            }
            return;
        }
        
        // Si on ouvre la même conversation, ne rien faire
        if (this.currentChatUserId === friendId) {
            console.log('ℹ️ Same chat already open');
            this.switchToChatTab();
            return;
        }
        
        // Configure WebSockets if needed
        if (!this.chatWebSocketSetup) {
            this.setupChatWebSocket();
            this.chatWebSocketSetup = true;
        }
        
        // Clear interface immediately
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Update current chat variables
        this.currentChatUserId = friendId;
        this.currentChatUsername = friendUsername;
        
        // Switch to chat tab
        this.switchToChatTab();
        
        // Setup chat interface
        this.setupChatInterface(friendId, friendUsername);
        
        // Load chat history with small delay to avoid race conditions
        setTimeout(async () => {
            if (this.currentChatUserId === friendId && this.blockingManager.canChat(friendId)) {
                await this.loadChatHistory(friendId);
            }
        }, 50);
        
        console.log(`✅ Chat opened with ${friendUsername}`);
    }
    
    private switchToChatTab() {
        // Get the tab elements
        const searchTabBtn = document.getElementById('search-tab-btn') as HTMLButtonElement;
        const chatTabBtn = document.getElementById('chat-tab-btn') as HTMLButtonElement;
        const searchTab = document.getElementById('search-tab') as HTMLElement;
        const chatTab = document.getElementById('chat-tab') as HTMLElement;
        
        if (!searchTabBtn || !chatTabBtn || !searchTab || !chatTab) {
            console.error('Chat tab elements not found');
            return;
        }
        
        // Update search tab button
        searchTabBtn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white', 'shadow-lg');
        searchTabBtn.classList.add('bg-dark-700', 'text-gray-400');
        
        // Update chat tab button
        chatTabBtn.classList.remove('bg-dark-700', 'text-gray-400');
        chatTabBtn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white', 'shadow-lg');
        
        // Hide search tab and show chat tab
        searchTab.classList.add('hidden');
        chatTab.classList.remove('hidden');
    }
    
    private setupChatInterface(friendId: number, friendUsername: string) {
        // Get chat elements
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const noChatSelected = document.getElementById('no-chat-selected') as HTMLElement;
        const chatInput = document.getElementById('chat-input') as HTMLElement;
        
        if (!chatMessages || !chatInput) {
            console.error('❌ Essential chat elements not found');
            return;
        }
        
        // Hide "no chat selected" message if it exists
        if (noChatSelected) {
            noChatSelected.classList.add('hidden');
        }
        
        // Show chat input
        chatInput.classList.remove('hidden');
        console.log('💬 Chat interface ready');
        
        // Clear previous messages from UI
        chatMessages.innerHTML = '';
        
        // Add simplified header with friend info
        const chatHeader = document.createElement('div');
        chatHeader.className = 'sticky top-0 bg-dark-800 border-b border-dark-600 p-3 mb-2 z-10';
        chatHeader.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mr-3 flex items-center justify-center">
                        <i class="fas fa-user text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-medium text-white">${friendUsername}</h3>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="invite-game-chat" class="px-3 py-1.5 text-white text-sm rounded-lg transition-all duration-200 
                        bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 
                        flex items-center justify-center font-medium">
                        <i class="fas fa-gamepad mr-1.5"></i> 
                        Jouer
                    </button>
                    <button id="block-user-chat" class="px-3 py-1.5 text-gray-400 hover:text-red-400 text-sm rounded-lg transition-all duration-200 
                        hover:bg-red-500/10 flex items-center justify-center">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </div>
        `;
        chatMessages.appendChild(chatHeader);
        
        // Add event listener to close button
        const closeButton = chatHeader.querySelector('#close-chat');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeChatConversation();
            });
        }
        
        // Add event listener to game invite button
        const gameInviteButton = chatHeader.querySelector('#invite-game-chat');
        if (gameInviteButton) {
            gameInviteButton.addEventListener('click', () => {
                this.sendGameInvitation(friendId, friendUsername);
            });
        }
        
        // Add event listener to block button
        const blockButton = chatHeader.querySelector('#block-user-chat');
        if (blockButton) {
            blockButton.addEventListener('click', () => {
                this.blockUser(friendId, friendUsername);
            });
        }
    }
    
    closeChatConversation() {
        this.currentChatUserId = null;
        this.currentChatUsername = null;
        
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const noChatSelected = document.getElementById('no-chat-selected') as HTMLElement;
        const chatInput = document.getElementById('chat-input') as HTMLElement;
        
        if (chatMessages && noChatSelected && chatInput) {
            chatMessages.innerHTML = '';
            noChatSelected.classList.remove('hidden');
            chatInput.classList.add('hidden');
        }
    }
    
    async sendChatMessage() {
        const messageInput = document.getElementById('message-input') as HTMLInputElement;
        
        if (!messageInput) {
            console.error('❌ Message input not found');
            return;
        }
        
        const message = messageInput.value.trim();
        
        if (!message || !this.currentChatUserId) {
            return;
        }
        
        // Check if chat is allowed with current user
        if (!this.blockingManager.canChat(this.currentChatUserId)) {
            console.log('❌ Cannot send message - user blocked');
            messageInput.value = '';
            return;
        }
        
        console.log(`📤 Sending: "${message}"`);
        
        // Clear input immediately to provide immediate feedback
        messageInput.value = '';
        
        // Send message via WebSocket with improved connection handling
        const websocketService = (window as any).websocketService;
        if (websocketService) {
            try {
                // Ensure connection is established before sending
                const sent = await websocketService.send('chat-message', {
                    receiver_id: this.currentChatUserId,
                    content: message,
                    type: 'text'
                });
                
                if (!sent) {
                    console.warn('⚠️ Failed to send message, restoring input');
                    // Restore message in input if sending failed
                    messageInput.value = message;
                    
                    // Show user feedback
                    this.showTemporaryError('Message non envoyé - problème de connexion');
                }
            } catch (error) {
                console.error('❌ Error sending message:', error);
                // Restore message in input if sending failed
                messageInput.value = message;
                this.showTemporaryError('Erreur lors de l\'envoi du message');
            }
        } else {
            console.warn('⚠️ WebSocket service not available');
            // Restore message in input
            messageInput.value = message;
            this.showTemporaryError('Service de chat indisponible');
        }
    }
    
    private showTemporaryError(message: string) {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500/20 border border-red-500/30 rounded-lg p-3 mx-4 mb-3 text-red-300 text-sm';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
        
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove error after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }
    
    // Alias pour compatibilité
    sendMessage() {
        this.sendChatMessage();
    }
    
    private addMessageToChat(messageData: any, isSentByMe: boolean = false) {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        
        if (!chatMessages) {
            console.error('❌ Chat messages container not found');
            return;
        }
        
        // Simple check: only add if we're in a chat
        if (!this.currentChatUserId) {
            return;
        }
        
        console.log(`💬 Adding message: ${messageData.content} (sent by me: ${isSentByMe})`);
        
        // Create simple message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex mb-3 px-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-[70%] rounded-lg px-3 py-2 ${
            isSentByMe 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-700 text-gray-200 border border-dark-600'
        }`;
        
        const messageText = document.createElement('div');
        messageText.className = 'break-words';
        messageText.textContent = messageData.content;
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);
        
        // Add to chat
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simple cache management
        if (!this.chatHistory.has(this.currentChatUserId)) {
            this.chatHistory.set(this.currentChatUserId, []);
        }
        const history = this.chatHistory.get(this.currentChatUserId);
        if (history && !history.find(msg => msg.id === messageData.id)) {
            history.push(messageData);
        }
    }
    
    private addGameInviteToChat(inviteData: any, isSentByMe: boolean = false) {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        
        if (!chatMessages) {
            console.error('❌ Chat messages container not found');
            return;
        }
        
        // Create simple game invite message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex mb-3 px-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-[70%] rounded-lg px-3 py-2 border ${
            isSentByMe 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-purple-600/20 text-gray-200 border-purple-500'
        }`;
        
        // Simple game invite content
        const inviteText = document.createElement('div');
        inviteText.className = 'flex items-center mb-2';
        inviteText.innerHTML = `
            <i class="fas fa-gamepad mr-2"></i>
            <span class="text-sm">${isSentByMe ? 'Invitation envoyée' : 'Invitation à jouer'}</span>
        `;
        
        messageContent.appendChild(inviteText);
        
        // Add action buttons ONLY for received invitations
        if (!isSentByMe) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex space-x-2';
            actionsDiv.innerHTML = `
                <button class="accept-game-invite px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">
                    Accepter
                </button>
                <button class="reject-game-invite px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded">
                    Refuser
                </button>
            `;
            messageContent.appendChild(actionsDiv);
            
            // Add event listeners for buttons
            const acceptBtn = actionsDiv.querySelector('.accept-game-invite') as HTMLButtonElement;
            const rejectBtn = actionsDiv.querySelector('.reject-game-invite') as HTMLButtonElement;
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    this.acceptGameInvitation(inviteData.id);
                    actionsDiv.innerHTML = `<span class="text-green-300 text-xs">✓ Acceptée</span>`;
                });
            }
            
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => {
                    this.rejectGameInvitation(inviteData.id);
                    actionsDiv.innerHTML = `<span class="text-gray-300 text-xs">✗ Refusée</span>`;
                });
            }
        }
        
        messageDiv.appendChild(messageContent);
        
        // Add to chat
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        console.log(`🎮 Game invitation added - Sent by me: ${isSentByMe}`);
    }
    
    private async loadChatHistory(friendId: number) {
        // Refresh blocking system before checking permissions
        try {
            await this.blockingManager.loadBlockedUsers();
            console.log('✅ Blocking system refreshed before loading chat history');
        } catch (error) {
            console.warn('⚠️ Could not refresh blocking system:', error);
        }
        
        // Verify chat is still allowed and we're in the right conversation
        if (!this.blockingManager.canChat(friendId)) {
            console.log('🚫 Chat history loading blocked - user restrictions');
            // Show blocked interface instead of error
            if (this.currentChatUserId === friendId) {
                this.showBlockedInterface(friendId, this.currentChatUsername || 'Utilisateur', 
                    this.blockingManager.isBlocked(friendId));
            }
            return;
        }
        
        // Verify we're still in the right conversation
        if (this.currentChatUserId !== friendId) {
            console.log('⚠️ Chat history loading cancelled - conversation changed');
            return;
        }
        
        // Check if we have cached history
        if (this.chatHistory.has(friendId)) {
            console.log('📚 Loading from cache');
            const messages = this.chatHistory.get(friendId)!;
            const currentUserId = this.getCurrentUserId();
            
            if (currentUserId) {
                messages.forEach((message: any) => {
                    const isSentByMe = message.sender_id === currentUserId;
                    
                    if (message.type === 'game_invite') {
                        this.addGameInviteToChat(message, isSentByMe);
                    } else {
                        this.addMessageToChat(message, isSentByMe);
                    }
                });
                
                if (messages.length === 0) {
                    this.showNoMessagesIndicator();
                }
            }
            return;
        }
        
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) {
            return;
        }
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chat-loading';
        loadingDiv.className = 'text-center text-gray-400 py-4';
        loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Chargement...`;
        chatMessages.appendChild(loadingDiv);
        
        console.log('📡 Loading chat history from API');
        
        try {
            const response = await api.chat.getMessages(friendId);
            
            // Check we're still in the right conversation and it's allowed
            if (this.currentChatUserId !== friendId) {
                console.log('⚠️ Chat history response ignored - conversation changed');
                return;
            }
            
            if (!this.blockingManager.canChat(friendId)) {
                console.log('🚫 Chat history response ignored - user now blocked');
                // Remove loading and show blocked interface
                const loading = document.getElementById('chat-loading');
                if (loading) loading.remove();
                this.showBlockedInterface(friendId, this.currentChatUsername || 'Utilisateur', 
                    this.blockingManager.isBlocked(friendId));
                return;
            }
            
            // Remove loading indicator
            const loading = document.getElementById('chat-loading');
            if (loading) loading.remove();
            
            if (response.success && response.data) {
                const messages = response.data;
                const currentUserId = this.getCurrentUserId();
                
                // Cache the messages
                this.chatHistory.set(friendId, messages);
                
                if (messages.length > 0 && currentUserId) {
                    messages.forEach((message: any) => {
                        const isSentByMe = message.sender_id === currentUserId;
                        
                        if (message.type === 'game_invite') {
                            this.addGameInviteToChat(message, isSentByMe);
                        } else {
                            this.addMessageToChat(message, isSentByMe);
                        }
                    });
                } else {
                    this.showNoMessagesIndicator();
                }
            } else {
                console.error('❌ Failed to load chat history:', response);
                
                // Check if it's a blocking-related error - check both message and error fields
                const errorMessage = response.error || response.message || '';
                const isBlockingError = (
                    errorMessage.includes('blocked') || 
                    errorMessage.includes('access') ||
                    errorMessage.includes('forbidden') ||
                    errorMessage.includes('Cannot access') ||
                    response.status === 403
                );
                
                if (isBlockingError) {
                    console.log('🚫 Chat access denied - refreshing blocking status and showing blocked interface');
                    
                    // Force refresh blocking status from server since there's a mismatch
                    try {
                        await this.blockingManager.loadBlockedUsers();
                        console.log('✅ Blocking status refreshed after 403 error');
                    } catch (error) {
                        console.warn('⚠️ Could not refresh blocking status:', error);
                    }
                    
                    // Determine who blocked whom based on the current blocking state
                    const iBlockedThem = this.blockingManager.isBlocked(friendId);
                    const theyBlockedMe = this.blockingManager.isBlockedBy(friendId);
                    
                    // Show appropriate blocked interface
                    if (iBlockedThem) {
                        console.log('📛 I have blocked this user');
                        this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', true);
                    } else if (theyBlockedMe) {
                        console.log('🚫 This user has blocked me');
                        this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
                    } else {
                        // If blocking status is still unclear, assume they blocked me (since we got 403)
                        console.log('🚫 403 error but unclear blocking status - assuming they blocked me');
                        this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
                    }
                } else {
                    // Only show error for non-blocking related issues
                    this.showChatError('Impossible de charger l\'historique');
                }
            }
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
        } catch (error: any) {
            console.error('❌ Error loading chat history:', error);
            
            // Check we're still in the right conversation
            if (this.currentChatUserId !== friendId) {
                return;
            }
            
            // Remove loading indicator
            const loading = document.getElementById('chat-loading');
            if (loading) loading.remove();
            
            // Check if it's a blocking-related error
            const errorMessage = error.message || error.toString() || '';
            const isBlockingError = (
                errorMessage.includes('blocked') || 
                errorMessage.includes('403') || 
                errorMessage.includes('access') ||
                errorMessage.includes('forbidden') ||
                errorMessage.includes('Cannot access') ||
                error.status === 403
            );
            
            if (isBlockingError) {
                console.log('🚫 Chat access denied - refreshing blocking status and showing blocked interface');
                
                // Force refresh blocking status from server since there's a mismatch
                try {
                    await this.blockingManager.loadBlockedUsers();
                    console.log('✅ Blocking status refreshed after error');
                } catch (refreshError) {
                    console.warn('⚠️ Could not refresh blocking status:', refreshError);
                }
                
                // Determine who blocked whom based on the current blocking state
                const iBlockedThem = this.blockingManager.isBlocked(friendId);
                const theyBlockedMe = this.blockingManager.isBlockedBy(friendId);
                
                // Show appropriate blocked interface
                if (iBlockedThem) {
                    console.log('📛 I have blocked this user');
                    this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', true);
                } else if (theyBlockedMe) {
                    console.log('🚫 This user has blocked me');
                    this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
                } else {
                    // If blocking status is still unclear, assume they blocked me (since we got 403)
                    console.log('🚫 403 error but unclear blocking status - assuming they blocked me');
                    this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
                }
            } else {
                // Only show error for non-blocking related issues
                this.showChatError('Erreur de connexion');
            }
        }
    }
    
    private showNoMessagesIndicator() {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) return;
        
        const noMessagesDiv = document.createElement('div');
        noMessagesDiv.className = 'text-center text-gray-500 py-12 px-6';
        noMessagesDiv.innerHTML = `
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-500/30">
                <i class="fas fa-comments text-2xl text-blue-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-300 mb-2">Aucun message encore</h3>
            <p class="text-sm text-gray-500 mb-4">Commencez la conversation avec ${this.currentChatUsername || 'votre ami'} !</p>
            <div class="flex items-center justify-center space-x-4 text-xs text-gray-600">
                <div class="flex items-center">
                    <i class="fas fa-paper-plane mr-1"></i>
                    <span>Tapez votre message</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-gamepad mr-1"></i>
                    <span>Ou lancez un défi</span>
                </div>
            </div>
        `;
        chatMessages.appendChild(noMessagesDiv);
    }
    
    private showChatError(message: string) {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'flex flex-col items-center justify-center h-full py-16 px-6 text-center';
        errorDiv.innerHTML = `
            <div class="w-16 h-16 bg-red-500/20 rounded-full mb-6 flex items-center justify-center border border-red-500/30">
                <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
            </div>
            <h3 class="text-lg font-medium text-white mb-3">Erreur lors du chargement</h3>
            <p class="text-gray-400 text-sm mb-6">${message}</p>
            <button onclick="location.reload()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-all duration-200">
                <i class="fas fa-redo mr-2"></i>
                Réessayer
            </button>
        `;
        chatMessages.appendChild(errorDiv);
    }
    
    private async setupChatWebSocket() {
        const websocketService = (window as any).websocketService;
        if (!websocketService) {
            console.error('❌ WebSocket service not available');
            return;
        }

        // Avoid multiple setups
        if (this.chatWebSocketSetup) {
            return;
        }

        console.log('🔌 Setting up chat WebSocket');

        // Ensure WebSocket is connected before setting up listeners
        try {
            if (!websocketService.isConnected()) {
                console.log('🔌 WebSocket not connected, establishing connection...');
                await websocketService.connect();
                console.log('✅ WebSocket connection established for chat');
            }
        } catch (error) {
            console.error('❌ Failed to establish WebSocket connection for chat:', error);
            // Continue with setup anyway, listeners will be attached when connection is established
        }

        // Listen for incoming chat messages
        websocketService.on('chat-message-received', (data: any) => {
            console.log('📨 Received message from:', data.sender_id);
            
            // Filter blocked users
            if (!this.blockingManager.canChat(data.sender_id)) {
                console.log('🚫 Message filtered - user is blocked or has blocked you');
                return;
            }
            
            // Simple check: only show if it's from current chat user
            if (this.currentChatUserId && data.sender_id === this.currentChatUserId) {
                this.addMessageToChat({
                    content: data.content,
                    type: data.type || 'text',
                    sender_id: data.sender_id,
                    receiver_id: this.getCurrentUserId(),
                    id: data.id
                }, false);
            }
            
            // Always cache the message for the sender (if not blocked)
            if (!this.chatHistory.has(data.sender_id)) {
                this.chatHistory.set(data.sender_id, []);
            }
            const senderHistory = this.chatHistory.get(data.sender_id);
            if (senderHistory && !senderHistory.find(msg => msg.id === data.id)) {
                senderHistory.push(data);
            }
        });

        // Listen for message confirmations
        websocketService.on('chat-message-sent', (data: any) => {
            console.log('✅ Message sent confirmation');
            
            // Check if message is blocked
            if (!this.blockingManager.canChat(data.receiver_id)) {
                console.log('🚫 Message not sent - receiver is blocked or has blocked you');
                return;
            }
            
            // Check if we're currently chatting with this user
            if (this.currentChatUserId === data.receiver_id) {
                this.addMessageToChat(data, true);
            } else {
                console.log('📤 Message sent to different user, not displaying in current chat');
            }
        });

        // Listen for WebSocket errors
        websocketService.on('error', (data: any) => {
            console.error('❌ WebSocket error:', data);
            
            // Handle blocking-related errors
            if (data.message && data.message.includes('blocked')) {
                console.log('🚫 Message bloqué - utilisateur indisponible');
                // Refresh blocking status
                this.refreshBlockedUsers();
            }
        });

        // Listen for game invitation confirmations
        websocketService.on('game-invite-sent', (data: any) => {
            console.log('✅ Game invitation sent');
        });

        // Listen for incoming game invitations
        websocketService.on('game-invite-received', (data: any) => {
            console.log('🎮 Game invitation received from:', data.sender_id);
            
            // Filter blocked users for game invitations too
            if (!this.blockingManager.canChat(data.sender_id)) {
                console.log('🚫 Game invitation filtered - user is blocked or has blocked you');
                return;
            }
            
            const invitationData = {
                id: data.id,
                sender_id: data.sender_id,
                receiver_id: this.getCurrentUserId(),
                type: 'game_invite',
                content: 'Invitation à jouer'
            };
            
            // Add to current chat if it's from current user
            if (this.currentChatUserId === data.sender_id) {
                this.addGameInviteToChat(invitationData, false);
            }
            
            // Always cache for later (if not blocked)
            if (!this.chatHistory.has(data.sender_id)) {
                this.chatHistory.set(data.sender_id, []);
            }
            const senderHistory = this.chatHistory.get(data.sender_id);
            if (senderHistory) {
                senderHistory.push(invitationData);
            }
        });

        // Mark as setup
        this.chatWebSocketSetup = true;
    }
    
    private getFriendNameById(friendId: number): string | null {
        // Try to find the friend name in the friends list
        const friendItems = document.querySelectorAll('.friend-item');
        for (const item of Array.from(friendItems)) {
            if (item.getAttribute('data-id') === friendId.toString()) {
                const usernameElement = item.querySelector('.friend-username');
                return usernameElement ? usernameElement.textContent : null;
            }
        }
        return null;
    }
    
    private initializeChatEventListeners() {
        console.log('🎧 Initializing chat listeners');
        
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            // Chat form submission
            const chatForm = document.getElementById('chat-form') as HTMLFormElement;
            if (chatForm) {
                chatForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendChatMessage();
                });
            }
            
            // Chat input enter key
            const messageInput = document.getElementById('message-input') as HTMLInputElement;
            if (messageInput) {
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendChatMessage();
                    }
                });
            }
        });
    }
    
    // Public method to get current chat user (for external access)
    getCurrentChatUserId(): number | null {
        return this.currentChatUserId;
    }
    
    getCurrentChatUsername(): string | null {
        return this.currentChatUsername;
    }
    
    // Get current user ID
    private getCurrentUserId(): number | null {
        // Try to get from auth service first
        const authService = (window as any).authService;
        if (authService?.getUserId) {
            const userId = parseInt(authService.getUserId());
            if (!isNaN(userId)) return userId;
        }
        
        const userIdStr = localStorage.getItem('user_id');
        if (userIdStr) {
            const userId = parseInt(userIdStr);
            if (!isNaN(userId)) return userId;
        }
        
        return null;
    }

    // Method to clear chat history cache
    clearChatHistory(friendId?: number) {
        if (friendId) {
            this.chatHistory.delete(friendId);
        } else {
            this.chatHistory.clear();
        }
    }
    
    // Method to send game invitation
    sendGameInvitation(friendId: number, friendUsername: string) {
        console.log(`🎮 Sending game invitation to ${friendUsername} (${friendId})`);
        
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite', { friendId });
            console.log(`🎮 Game invitation sent to ${friendUsername}`);
        } else {
            console.warn('⚠️ WebSocket not available for game invitation');
        }
    }
    
    // Method to accept game invitation
    acceptGameInvitation(inviteId: number) {
        console.log(`🎮 Accepting game invitation ${inviteId}`);
        
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite-accept', { inviteId });
            console.log('🎮 Game invitation accepted, redirecting...');
            
            // Redirect to game page
            setTimeout(() => {
                window.location.href = '/game.html';
            }, 1000);
        } else {
            console.warn('⚠️ WebSocket not available for game invitation');
        }
    }
    
    // Method to reject game invitation
    rejectGameInvitation(inviteId: number) {
        console.log(`🎮 Rejecting game invitation ${inviteId}`);
        
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite-reject', { inviteId });
            console.log('🎮 Game invitation rejected');
        } else {
            console.warn('⚠️ WebSocket not available for game invitation');
        }
    }
    
    // Simplified block user method with immediate WebSocket feedback
    async blockUser(userId: number, username: string) {
        console.log(`🚫 Blocking ${username}...`);
        
        try {
            const success = await this.blockingManager.blockUser(userId);
            if (success) {
                console.log(`✅ User ${username} blocked successfully`);
                
                // If currently chatting with this user, show blocked interface
                if (this.currentChatUserId === userId) {
                    this.showBlockedInterface(userId, username, true);
                }
            } else {
                console.error('❌ Failed to block user');
            }
        } catch (error) {
            console.error('❌ Error blocking user:', error);
        }
    }
    
    // FIXED: Simple and reliable blocked interface
    showBlockedInterface(friendId: number, friendUsername: string, iBlockedThem: boolean) {
        console.log(`🚫 Showing blocked interface for ${friendUsername} (I blocked them: ${iBlockedThem})`);
        
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const chatInput = document.getElementById('chat-input') as HTMLElement;
        const noChatSelected = document.getElementById('no-chat-selected') as HTMLElement;
        
        if (!chatMessages) return;
        
        // Hide chat input and no-chat-selected
        if (chatInput) chatInput.classList.add('hidden');
        if (noChatSelected) noChatSelected.classList.add('hidden');
        
        // Clear messages and show blocked interface
        chatMessages.innerHTML = '';
        
        const blockedDiv = document.createElement('div');
        blockedDiv.className = 'flex flex-col items-center justify-center h-full text-center p-8';
        
        const message = iBlockedThem 
            ? `Vous avez bloqué ${friendUsername}` 
            : `${friendUsername} vous a bloqué`;
        
        const description = iBlockedThem 
            ? 'Vous ne pouvez pas envoyer ou recevoir de messages.'
            : 'Vous ne pouvez pas envoyer de messages à cet utilisateur.';
        
        blockedDiv.innerHTML = `
            <div class="bg-dark-700 border border-dark-600 rounded-lg p-6 max-w-md">
                <div class="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 border border-red-500/30">
                    <i class="fas fa-ban text-red-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">${message}</h3>
                <p class="text-gray-400 mb-4">${description}</p>
                ${iBlockedThem ? `
                    <button id="unblock-user-btn" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium">
                        <i class="fas fa-unlock mr-2"></i>Débloquer ${friendUsername}
                    </button>
                ` : `
                    <div class="text-center">
                        <div class="inline-flex items-center px-4 py-2 bg-gray-700/50 rounded-lg text-gray-400 text-sm">
                            <i class="fas fa-info-circle mr-2"></i>
                            Aucune action disponible
                        </div>
                    </div>
                `}
            </div>
        `;
        
        chatMessages.appendChild(blockedDiv);
        
        // Add unblock functionality if I blocked them
        if (iBlockedThem) {
            const unblockBtn = document.getElementById('unblock-user-btn') as HTMLButtonElement;
            if (unblockBtn) {
                unblockBtn.addEventListener('click', async () => {
                    console.log(`🔓 Attempting to unblock ${friendUsername}`);
                    
                    // Disable button immediately to prevent double-clicks
                    unblockBtn.disabled = true;
                    unblockBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Déblocage...';
                    
                    try {
                        // Unblock the user
                        await this.blockingManager.unblockUser(friendId);
                        console.log(`✅ Successfully unblocked ${friendUsername}`);
                        
                        // Force refresh the chat to ensure clean state
                        this.forceRefreshChat(friendId, friendUsername);
                        
                    } catch (error) {
                        console.error(`❌ Failed to unblock ${friendUsername}:`, error);
                        
                        // Re-enable button and show error
                        unblockBtn.disabled = false;
                        unblockBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Débloquer ' + friendUsername;
                        
                        // Show error message
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center';
                        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Erreur lors du déblocage. Veuillez réessayer.';
                        unblockBtn.parentElement?.appendChild(errorDiv);
                        
                        // Remove error after 3 seconds
                        setTimeout(() => {
                            if (errorDiv.parentElement) {
                                errorDiv.remove();
                            }
                        }, 3000);
                    }
                });
            }
        }
    }
    
    // Public methods to access blocking system
    isUserBlocked(userId: number): boolean {
        return this.blockingManager.isBlocked(userId);
    }
    
    isBlockedByUser(userId: number): boolean {
        return this.blockingManager.isBlockedBy(userId);
    }
    
    canChatWithUser(userId: number): boolean {
        return this.blockingManager.canChat(userId);
    }
    
    async refreshBlockedUsers() {
        await this.blockingManager.loadBlockedUsers();
    }

    // NEW: Force refresh chat after unblock - clears everything and reloads properly
    forceRefreshChat(friendId: number, friendUsername: string) {
        console.log(`🔄 Force refreshing chat with ${friendUsername} (ID: ${friendId})`);
        
        // Clear current state completely
        this.currentChatUserId = null;
        this.currentChatUsername = null;
        
        // Clear chat history cache for this user
        this.chatHistory.delete(friendId);
        
        // Clear the interface
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const chatInput = document.getElementById('chat-input') as HTMLElement;
        const noChatSelected = document.getElementById('no-chat-selected') as HTMLElement;
        
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        if (chatInput) {
            chatInput.classList.add('hidden');
        }
        
        if (noChatSelected) {
            noChatSelected.classList.remove('hidden');
        }
        
        // Wait a bit then reopen the chat properly
        setTimeout(() => {
            this.openChatWithFriend(friendId, friendUsername);
        }, 100);
    }
}

// Export a singleton instance
export const chatManager = new ChatManager();

// Expose globally for HTML access
if (typeof window !== 'undefined') {
    (window as any).chatManager = chatManager;
    (window as any).ChatManager = ChatManager;
} 