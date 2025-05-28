// Chat functionality - Système de chat modulaire
import { api } from './api';

export class ChatManager {
    private currentChatUserId: number | null = null;
    private currentChatUsername: string | null = null;
    private chatHistory: Map<number, any[]> = new Map(); // Cache des historiques de chat par utilisateur
    private chatWebSocketSetup = false; // Flag pour éviter de configurer les WebSockets plusieurs fois
    
    constructor() {
        this.initializeChatEventListeners();
    }
    
    openChatWithFriend(friendId: number, friendUsername: string) {
        console.log(`💬 Opening chat with ${friendUsername} (ID: ${friendId})`);
        
        // Si on ouvre la même conversation, ne rien faire
        if (this.currentChatUserId === friendId) {
            console.log('ℹ️ Same chat already open');
            this.switchToChatTab();
            return;
        }
        
        // CORRECTION: Configurer les WebSockets AVANT tout le reste
        if (!this.chatWebSocketSetup) {
            this.setupChatWebSocket();
            this.chatWebSocketSetup = true;
        }
        
        // CORRECTION: Vider immédiatement l'interface pour éviter le mélange visuel
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Mettre à jour les variables de chat actuelles
        this.currentChatUserId = friendId;
        this.currentChatUsername = friendUsername;
        
        // Basculer vers l'onglet chat
        this.switchToChatTab();
        
        // Préparer l'interface de chat
        this.setupChatInterface(friendId, friendUsername);
        
        // Charger l'historique de chat avec un délai pour éviter les race conditions
        setTimeout(() => {
            this.loadChatHistory(friendId);
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
                    <button id="close-chat" class="text-gray-400 hover:text-white transition-all duration-200 
                        p-1.5 rounded-lg hover:bg-dark-600">
                        <i class="fas fa-times"></i>
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
            this.showNotification('Connexion WebSocket indisponible', 'error');
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
    
    private loadChatHistory(friendId: number) {
        // Simple check: make sure we're still in the right conversation
        if (this.currentChatUserId !== friendId) {
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
        
        // Show simple loading
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chat-loading';
        loadingDiv.className = 'text-center text-gray-400 py-4';
        loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Chargement...`;
        chatMessages.appendChild(loadingDiv);
        
        console.log('📡 Loading chat history from API');
        
        // Load from API
        api.chat.getMessages(friendId)
            .then(response => {
                // Check we're still in the right conversation
                if (this.currentChatUserId !== friendId) {
                    return;
                }
                
                // Remove loading
                const loading = document.getElementById('chat-loading');
                if (loading) {
                    loading.remove();
                }
                
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
                    console.error('❌ Failed to load chat history');
                    this.showChatError('Erreur lors du chargement');
                }
                
                chatMessages.scrollTop = chatMessages.scrollHeight;
            })
            .catch(error => {
                console.error('❌ Error loading chat history:', error);
                
                if (this.currentChatUserId !== friendId) {
                    return;
                }
                
                const loading = document.getElementById('chat-loading');
                if (loading) {
                    loading.remove();
                }
                
                this.showChatError('Erreur lors du chargement');
            });
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
        errorDiv.className = 'text-center text-red-400 text-sm py-8';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle text-2xl mb-3"></i>
            <p>${message}</p>
            <button onclick="location.reload()" class="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs">
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
            
            // Always cache the message for the sender
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
            
            // Only show if it's for current conversation
            if (this.currentChatUserId && data.receiver_id === this.currentChatUserId) {
                this.addMessageToChat({
                    content: data.content,
                    type: data.type || 'text',
                    sender_id: this.getCurrentUserId(),
                    receiver_id: data.receiver_id,
                    id: data.id
                }, true);
            }
        });

        // Listen for WebSocket errors
        websocketService.on('error', (data: any) => {
            console.error('❌ WebSocket error:', data);
        });

        // Listen for game invitation confirmations
        websocketService.on('game-invite-sent', (data: any) => {
            console.log('✅ Game invitation sent');
        });

        // Listen for incoming game invitations
        websocketService.on('game-invite-received', (data: any) => {
            console.log('🎮 Game invitation received from:', data.sender_id);
            
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
            
            // Always cache for later
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
        // Try multiple sources to get the current user ID
        
        // 1. Try authService first (getUserId returns string)
        const authService = (window as any).authService;
        if (authService && authService.getUserId) {
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
    
    private showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
        // Fonction désactivée - ne fait plus rien
        console.log(`[Notification désactivée] ${type}: ${message}`);
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
        console.log(`Sending game invitation to ${friendUsername} (ID: ${friendId})`);
        
        // Send game invitation via WebSocket
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite', {
                friendId: friendId
            });
            
            console.log('Game invitation sent successfully via WebSocket');
            this.showNotification(`Invitation de jeu envoyée à ${friendUsername}`, 'success');
            
            // Add the sent invitation immediately to the chat
            this.addGameInviteToChat({
                id: Date.now(), // Temporary ID
                sender_id: this.getCurrentUserId(),
                receiver_id: friendId,
                created_at: new Date().toISOString(),
                type: 'game_invite'
            }, true);
            
        } else {
            console.warn('⚠️ WebSocket not available');
            this.showNotification('Connexion WebSocket indisponible', 'error');
        }
    }
    
    // Method to accept game invitation
    acceptGameInvitation(inviteId: number) {
        console.log(`Accepting game invitation ${inviteId}`);
        
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite-accept', {
                inviteId: inviteId
            });
            
            console.log('Game invitation accepted');
            this.showNotification('Invitation acceptée ! Redirection vers le jeu...', 'success');
        } else {
            console.warn('⚠️ WebSocket not available');
            this.showNotification('Connexion WebSocket indisponible', 'error');
        }
    }
    
    // Method to reject game invitation
    rejectGameInvitation(inviteId: number) {
        console.log(`Rejecting game invitation ${inviteId}`);
        
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
            websocketService.send('game-invite-reject', {
                inviteId: inviteId
            });
            
            console.log('Game invitation rejected');
            this.showNotification('Invitation refusée', 'info');
        } else {
            console.warn('⚠️ WebSocket not available');
            this.showNotification('Connexion WebSocket indisponible', 'error');
        }
    }
    
    // Method to block a user
    blockUser(userId: number, username: string) {
        if (confirm(`Êtes-vous sûr de vouloir bloquer ${username} ?`)) {
            console.log(`Blocking user ${username} (ID: ${userId})`);
            
            // Call API to block user using chat endpoint
            api.chat.blockUser(userId)
                .then((response: any) => {
                    if (response.success) {
                        console.log(`✅ User ${username} blocked successfully`);
                        this.showNotification(`${username} a été bloqué`, 'success');
                        
                        // Close the chat conversation
                        this.closeChatConversation();
                        
                        // Refresh friends list to update UI
                        if ((window as any).friendsManager) {
                            (window as any).friendsManager.loadFriends();
                        }
                    } else {
                        console.error('❌ Failed to block user:', response.message);
                        this.showNotification('Erreur lors du blocage', 'error');
                    }
                })
                .catch((error: any) => {
                    console.error('❌ Error blocking user:', error);
                    this.showNotification('Erreur lors du blocage', 'error');
                });
        }
    }
}

// Export a singleton instance
export const chatManager = new ChatManager();

// Expose globally for HTML access
if (typeof window !== 'undefined') {
    (window as any).chatManager = chatManager;
    (window as any).ChatManager = ChatManager;
} 