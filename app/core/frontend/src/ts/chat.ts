// Chat functionality - Système de chat modulaire
import { api } from './api';

// Blocking system manager - Fixed with consistent WebSocket support
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

        // FIXED: Listen for successful block confirmation
        websocketService.on('user-block-success', (data: any) => {
            console.log('✅ Block confirmed via WebSocket:', data);
            
            // Update state immediately and consistently
            this.blockedUsers.add(data.blocked_id);
            
            // Update UI immediately without delays
            this.updateAllFriendsUI();
            
            // Update chat interface if currently viewing this user
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.blocked_id) {
                console.log('🔄 Updating chat interface after block');
                chatManager.showBlockedInterface(data.blocked_id, data.blocked_username, true);
            }
        });

        // FIXED: Listen for successful unblock confirmation
        websocketService.on('user-unblock-success', (data: any) => {
            console.log('✅ Unblock confirmed via WebSocket:', data);
            
            // Update state immediately and consistently
            this.blockedUsers.delete(data.unblocked_id);
            
            // Update UI immediately without delays
            this.updateAllFriendsUI();
            
            // FIXED: Force immediate chat interface refresh
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.unblocked_id) {
                console.log('🔄 Force refreshing chat interface after unblock');
                
                // Clear any existing blocked interface
                const chatMessages = document.getElementById('chat-messages') as HTMLElement;
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                }
                
                // Immediately open normal chat
                chatManager.openChatWithFriend(data.unblocked_id, data.unblocked_username);
            }
        });

        // FIXED: Listen for being blocked by someone
        websocketService.on('user-blocked-by', (data: any) => {
            console.log('🚫 Blocked by user via WebSocket:', data);
            
            // Update state immediately
            this.blockedByUsers.add(data.blocker_id);
            
            // Update UI immediately
            this.updateAllFriendsUI();
            
            // If currently chatting with this user, show blocked interface
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.blocker_id) {
                chatManager.showBlockedInterface(data.blocker_id, data.blocker_username, false);
            }
        });

        // FIXED: Listen for being unblocked by someone
        websocketService.on('user-unblocked-by', (data: any) => {
            console.log('✅ Unblocked by user via WebSocket:', data);
            
            // Update state immediately
            this.blockedByUsers.delete(data.unblocker_id);
            
            // Update UI immediately
            this.updateAllFriendsUI();
            
            // If currently viewing this user's chat, refresh it immediately
            const chatManager = (window as any).chatManager;
            if (chatManager && chatManager.getCurrentChatUserId() === data.unblocker_id) {
                console.log('🔄 Refreshing chat interface after being unblocked');
                chatManager.openChatWithFriend(data.unblocker_id, data.unblocker_username);
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
            
            // FIXED: Immediate optimistic update to prevent visual lag
            this.blockedUsers.add(userId);
            this.updateAllFriendsUI();
            
            // Try WebSocket first
            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                console.log(`🚫 Blocking user ${userId} via WebSocket`);
                websocketService.send('user-block', { blockedUserId: userId });
                return true; // WebSocket will handle the response
            } else {
                // Fallback to REST API
                console.log(`🚫 Blocking user ${userId} via REST API (WebSocket unavailable)`);
                const response = await api.chat.blockUser(userId);
                if (response.success) {
                    console.log(`✅ User ${userId} blocked via REST API`);
                    return true;
                } else {
                    // Revert optimistic update on failure
                    this.blockedUsers.delete(userId);
                    this.updateAllFriendsUI();
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ Error blocking user:', error);
            // Revert optimistic update on error
            this.blockedUsers.delete(userId);
            this.updateAllFriendsUI();
            return false;
        }
    }
    
    // FIXED: Simplified unblock method without optimistic updates
    async unblockUser(userId: number): Promise<boolean> {
        // Check if user is actually blocked
        if (!this.isBlocked(userId)) {
            console.log(`ℹ️ User ${userId} is not blocked, skipping unblock`);
            return true;
        }
        
        try {
            const websocketService = (window as any).websocketService;
            
            // Try WebSocket first
            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                console.log(`✅ Unblocking user ${userId} via WebSocket`);
                websocketService.send('user-unblock', { unblockedUserId: userId });
                return true; // WebSocket will handle the response and state updates
            } else {
                // Fallback to REST API
                console.log(`✅ Unblocking user ${userId} via REST API (WebSocket unavailable)`);
                const response = await api.chat.unblockUser(userId);
                if (response.success) {
                    // Only update state after successful API response
                    this.blockedUsers.delete(userId);
                    this.updateAllFriendsUI();
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
    
    // FIXED: Simplified UI update with consistent visual feedback
    updateFriendUI(friendElement: HTMLElement, friendId: number) {
        // Remove existing badges and reset styles
        const existingBadge = friendElement.querySelector('.block-badge');
        if (existingBadge) existingBadge.remove();
        
        // Reset all blocking-related styles
        friendElement.classList.remove('opacity-50', 'opacity-60', 'grayscale', 'pointer-events-none');
        friendElement.style.filter = '';
        
        if (this.isBlocked(friendId)) {
            // User is blocked by me - Red badge + grayed out
            const badge = document.createElement('div');
            badge.className = 'block-badge absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-10';
            badge.innerHTML = '<i class="fas fa-ban text-white text-xs"></i>';
            badge.title = 'Utilisateur bloqué';
            friendElement.style.position = 'relative';
            friendElement.appendChild(badge);
            
            // Apply visual effects for blocked user
            friendElement.classList.add('opacity-60');
            friendElement.style.filter = 'grayscale(70%)';
            
        } else if (this.isBlockedBy(friendId)) {
            // I am blocked by this user - Gray badge + grayed out
            const badge = document.createElement('div');
            badge.className = 'block-badge absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center z-10';
            badge.innerHTML = '<i class="fas fa-eye-slash text-white text-xs"></i>';
            badge.title = 'Vous êtes bloqué par cet utilisateur';
            friendElement.style.position = 'relative';
            friendElement.appendChild(badge);
            
            // Apply visual effects for being blocked
            friendElement.classList.add('opacity-50');
            friendElement.style.filter = 'grayscale(80%)';
        }
    }
    
    // FIXED: Update all friends UI consistently
    updateAllFriendsUI() {
        const friendItems = document.querySelectorAll('.friend-item');
        friendItems.forEach((item) => {
            const friendId = parseInt(item.getAttribute('data-id') || '0');
            if (friendId) {
                this.updateFriendUI(item as HTMLElement, friendId);
            }
        });
    }
    
    private getCurrentUserId(): number | null {
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
        
        // FIXED: Ensure blocking system is loaded before checking permissions
        try {
            await this.blockingManager.loadBlockedUsers();
            console.log('✅ Blocking system refreshed before opening chat');
        } catch (error) {
            console.warn('⚠️ Could not refresh blocking system:', error);
        }
        
        // FIXED: Check if chat is allowed AFTER ensuring data is loaded
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
    
    sendChatMessage() {
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
        
        // Send message via WebSocket
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('chat-message', {
                receiver_id: this.currentChatUserId,
                content: message,
                type: 'text'
            });
            
            // Clear input immediately
            messageInput.value = '';
        } else {
            console.warn('⚠️ WebSocket not available');
        }
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
        // FIXED: Refresh blocking system before checking permissions
        try {
            await this.blockingManager.loadBlockedUsers();
            console.log('✅ Blocking system refreshed before loading chat history');
        } catch (error) {
            console.warn('⚠️ Could not refresh blocking system:', error);
        }
        
        // FIXED: Verify chat is still allowed and we're in the right conversation
        if (!this.blockingManager.canChat(friendId)) {
            console.log('🚫 Chat history loading blocked - user restrictions');
            // Don't show error - just maintain the blocked interface
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
            
            // FIXED: Check we're still in the right conversation and it's allowed
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
                
                // FIXED: Check if it's a blocking-related error
                if (response.error && (
                    response.error.includes('blocked') || 
                    response.error.includes('access') ||
                    response.error.includes('forbidden') ||
                    response.status === 403
                )) {
                    console.log('🚫 Chat access denied - user has blocked you');
                    this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
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
            
            // FIXED: Check if it's a blocking-related error
            if (error.message && (
                error.message.includes('blocked') || 
                error.message.includes('403') || 
                error.message.includes('access') ||
                error.message.includes('forbidden') ||
                error.status === 403
            )) {
                console.log('🚫 Chat access denied - user has blocked you');
                this.showBlockedInterface(friendId, this.currentChatUsername || 'Cet utilisateur', false);
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
    
    private setupChatWebSocket() {
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
    
    private getCurrentUserId(): number | null {
        const authService = (window as any).authService;
        if (authService?.getUserId) {
            const userIdStr = authService.getUserId();
            if (userIdStr) {
                const userId = parseInt(userIdStr);
                if (!isNaN(userId)) {
                    console.log(`🔍 Current user ID from authService: ${userId}`);
                    return userId;
                }
            }
        }
        
        // 2. Try localStorage as fallback (both keys)
        let userIdStr = localStorage.getItem('user_id') || localStorage.getItem('USER_ID_KEY');
        if (userIdStr) {
            const userId = parseInt(userIdStr);
            if (!isNaN(userId)) {
                console.log(`🔍 Current user ID from localStorage: ${userId}`);
                return userId;
            }
        }
        
        // 3. Try sessionStorage as fallback
        userIdStr = sessionStorage.getItem('user_id') || sessionStorage.getItem('USER_ID_KEY');
        if (userIdStr) {
            const userId = parseInt(userIdStr);
            if (!isNaN(userId)) {
                console.log(`🔍 Current user ID from sessionStorage: ${userId}`);
                return userId;
            }
        }
        
        // 4. Try to get from JWT token
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.id) {
                    const userId = typeof payload.id === 'number' ? payload.id : parseInt(payload.id);
                    if (!isNaN(userId)) {
                        console.log(`🔍 Current user ID from JWT: ${userId}`);
                        return userId;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to parse JWT token:', error);
            }
        }
        
        console.error('❌ Could not determine current user ID');
        console.log('Debug info:', {
            authService: !!authService,
            authServiceUserId: authService?.getUserId?.(),
            localStorage_user_id: localStorage.getItem('user_id'),
            localStorage_auth_token: !!localStorage.getItem('auth_token'),
            sessionStorage_user_id: sessionStorage.getItem('user_id')
        });
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
                
                // Update UI immediately
                this.updateAllFriendsUI();
                
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
    
    // Update all friends UI (delegated to BlockingManager)
    private updateAllFriendsUI() {
        // This is now handled by BlockingManager
        this.blockingManager.updateAllFriendsUI();
    }
    
    // FIXED: Simple and reliable blocked interface
    showBlockedInterface(userId: number, username: string, isBlocking: boolean = false) {
        console.log(`🚫 Showing blocked interface for ${username} (blocking: ${isBlocking})`);
        
        // Ensure we're in the chat tab
        this.switchToChatTab();
        
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const chatInput = document.getElementById('chat-input') as HTMLElement;
        const noChatSelected = document.getElementById('no-chat-selected') as HTMLElement;
        
        if (!chatMessages || !chatInput) {
            console.error('❌ Chat elements not found');
            return;
        }
        
        // Hide elements
        if (noChatSelected) noChatSelected.classList.add('hidden');
        chatInput.classList.add('hidden');
        
        // Set current chat state
        this.currentChatUserId = userId;
        this.currentChatUsername = username;
        
        // Clear and create blocked interface
        chatMessages.innerHTML = '';
        
        const blockedDiv = document.createElement('div');
        blockedDiv.className = 'flex flex-col items-center justify-center h-full py-16 px-6 text-center';
        blockedDiv.id = 'blocked-interface';
        
        if (isBlocking || this.blockingManager.isBlocked(userId)) {
            // I blocked this user - Show simple unblock button
            blockedDiv.innerHTML = `
                <div class="w-20 h-20 bg-red-500/20 rounded-full mb-6 flex items-center justify-center border border-red-500/30">
                    <i class="fas fa-ban text-3xl text-red-400"></i>
                </div>
                <h2 class="text-xl font-semibold text-white mb-3">Chat indisponible</h2>
                <p class="text-gray-400 text-sm mb-6 max-w-md leading-relaxed">
                    Vous avez bloqué ${username}. Le chat est désactivé.
                </p>
                <button id="simple-unblock-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium">
                    <i class="fas fa-unlock mr-2"></i>
                    Débloquer
                </button>
            `;
        } else {
            // I am blocked by this user - No actions available
            blockedDiv.innerHTML = `
                <div class="w-20 h-20 bg-gray-500/20 rounded-full mb-6 flex items-center justify-center border border-gray-500/30">
                    <i class="fas fa-ban text-3xl text-gray-400"></i>
                </div>
                <h2 class="text-xl font-semibold text-white mb-3">Chat indisponible</h2>
                <p class="text-gray-400 text-sm mb-6 max-w-md leading-relaxed">
                    ${username} vous a bloqué. Le chat est désactivé.
                </p>
                <div class="text-xs text-gray-500 mt-4">
                    <i class="fas fa-info-circle mr-1"></i>
                    Vous ne pouvez pas envoyer de messages à cet utilisateur
                </div>
            `;
        }
        
        chatMessages.appendChild(blockedDiv);
        
        // FIXED: Simple unblock button with immediate state refresh
        const unblockBtn = blockedDiv.querySelector('#simple-unblock-btn');
        if (unblockBtn) {
            unblockBtn.addEventListener('click', async () => {
                console.log(`🔄 Unblocking user ${userId}...`);
                
                // Simple loading state
                unblockBtn.textContent = 'Déblocage...';
                unblockBtn.setAttribute('disabled', 'true');
                
                try {
                    // Call unblock method
                    const success = await this.blockingManager.unblockUser(userId);
                    
                    if (success) {
                        console.log('✅ Unblock successful - refreshing chat immediately');
                        
                        // FIXED: Force immediate refresh of chat interface
                        setTimeout(() => {
                            // Check if user is still blocked
                            if (!this.blockingManager.isBlocked(userId)) {
                                console.log('🔄 User successfully unblocked, opening normal chat');
                                this.openChatWithFriend(userId, username);
                            } else {
                                console.log('⚠️ User still appears blocked, refreshing blocking data');
                                this.blockingManager.loadBlockedUsers().then(() => {
                                    if (!this.blockingManager.isBlocked(userId)) {
                                        this.openChatWithFriend(userId, username);
                                    }
                                });
                            }
                        }, 200);
                        
                    } else {
                        console.error('❌ Unblock failed');
                        // Reset button
                        unblockBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Débloquer';
                        unblockBtn.removeAttribute('disabled');
                    }
                } catch (error) {
                    console.error('❌ Unblock error:', error);
                    // Reset button
                    unblockBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Débloquer';
                    unblockBtn.removeAttribute('disabled');
                }
            });
        }
        
        console.log(`✅ Blocked interface displayed for ${username}`);
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
    
    updateFriendBlockingUI(friendItem: HTMLElement, friendId: number) {
        this.blockingManager.updateFriendUI(friendItem, friendId);
    }
    
    async refreshBlockedUsers() {
        await this.blockingManager.loadBlockedUsers();
    }
}

// Export a singleton instance
export const chatManager = new ChatManager();

// Expose globally for HTML access
if (typeof window !== 'undefined') {
    (window as any).chatManager = chatManager;
    (window as any).ChatManager = ChatManager;
} 