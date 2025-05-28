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
        
        // Configurer les WebSockets si ce n'est pas déjà fait
        if (!this.chatWebSocketSetup) {
            this.setupChatWebSocket();
            this.chatWebSocketSetup = true;
        }
        
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
        
        // Add header with friend info and game invite button
        const chatHeader = document.createElement('div');
        chatHeader.className = 'sticky top-0 bg-dark-800 border-b border-dark-600 p-4 mb-4 z-10';
        chatHeader.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-dark-600 rounded-full mr-3 flex items-center justify-center border-2 border-dark-500">
                        <i class="fas fa-user text-gray-400"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-white">${friendUsername}</h3>
                        <p class="text-sm text-gray-400">Conversation</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="invite-game-chat" class="px-3 py-1.5 text-white text-sm rounded-lg transition-all duration-200 
                        bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
                        shadow-md hover:shadow-blue-500/30 flex items-center justify-center font-medium">
                        <i class="fas fa-gamepad mr-1.5"></i> Jouer
                    </button>
                    <button id="close-chat" class="text-gray-400 hover:text-white transition-colors">
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
            
            // Show typing indicator
            this.showTypingIndicator();
        } else {
            console.warn('⚠️ WebSocket not available');
            this.showNotification('Connexion WebSocket indisponible', 'error');
        }
    }
    
    // Alias pour compatibilité
    sendMessage() {
        this.sendChatMessage();
    }
    
    private showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) return;
        
        // Remove existing typing indicator
        const existingIndicator = document.getElementById('typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex items-center text-gray-400 text-sm py-2 px-4';
        typingDiv.innerHTML = `
            <div class="flex space-x-1 mr-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span>Envoi en cours...</span>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    private removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    private addMessageToChat(messageData: any, isSentByMe: boolean = false) {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        
        if (!chatMessages) {
            console.error('❌ Chat messages container not found');
            return;
        }
        
        // CORRECTION: Vérifier que le message appartient à la conversation actuelle
        if (this.currentChatUserId && 
            messageData.sender_id !== this.currentChatUserId && 
            messageData.receiver_id !== this.currentChatUserId &&
            messageData.sender_id !== this.getCurrentUserId() &&
            messageData.receiver_id !== this.getCurrentUserId()) {
            console.log(`⚠️ Message ${messageData.id} doesn't belong to current conversation`);
            return;
        }
        
        // Debug log for message positioning
        console.log(`💬 Adding message ${messageData.id}: sender=${messageData.sender_id}, receiver=${messageData.receiver_id}, isSentByMe=${isSentByMe}`);
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        messageDiv.setAttribute('data-message-id', messageData.id?.toString() || '');
        messageDiv.setAttribute('data-sender-id', messageData.sender_id?.toString() || '');
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-[70%] rounded-lg px-4 py-2 shadow-md ${
            isSentByMe 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-700 text-gray-200'
        }`;
        
        const messageText = document.createElement('div');
        messageText.className = 'break-words';
        messageText.textContent = messageData.content;
        
        const messageTime = document.createElement('div');
        messageTime.className = `text-xs mt-1 ${isSentByMe ? 'text-blue-200' : 'text-gray-400'}`;
        
        // Format time
        const messageDate = new Date(messageData.created_at);
        messageTime.textContent = messageDate.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);
        
        // Add to chat (before typing indicator if it exists)
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            chatMessages.insertBefore(messageDiv, typingIndicator);
        } else {
            chatMessages.appendChild(messageDiv);
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to cache seulement si c'est pour la conversation actuelle
        if (this.currentChatUserId) {
            const conversationPartnerId = isSentByMe ? messageData.receiver_id : messageData.sender_id;
            if (conversationPartnerId === this.currentChatUserId) {
                if (!this.chatHistory.has(this.currentChatUserId)) {
                    this.chatHistory.set(this.currentChatUserId, []);
                }
                const history = this.chatHistory.get(this.currentChatUserId);
                if (history && !history.find(msg => msg.id === messageData.id)) {
                    history.push(messageData);
                    console.log(`📚 Message ${messageData.id} added to cache for user ${this.currentChatUserId}`);
                }
            }
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
        messageDiv.className = `flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        messageDiv.setAttribute('data-invite-id', inviteData.id?.toString() || '');
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-[70%] rounded-lg px-4 py-3 shadow-md border ${
            isSentByMe 
                ? 'bg-blue-600 text-white border-blue-500' 
                : 'bg-dark-700 text-gray-200 border-dark-600'
        }`;
        
        // Simple game invite content
        const inviteText = document.createElement('div');
        inviteText.className = 'flex items-center mb-2';
        inviteText.innerHTML = `
            <i class="fas fa-gamepad mr-2 text-sm"></i>
            <span class="text-sm">${isSentByMe ? 'Invitation de jeu envoyée' : 'Invitation à jouer'}</span>
        `;
        
        messageContent.appendChild(inviteText);
        
        // Add simple action buttons ONLY for received invitations
        if (!isSentByMe) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex space-x-2 mt-2';
            actionsDiv.innerHTML = `
                <button class="accept-game-invite px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
                    Accepter
                </button>
                <button class="reject-game-invite px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
                    Refuser
                </button>
            `;
            messageContent.appendChild(actionsDiv);
            
            // Add event listeners for buttons
            const acceptBtn = actionsDiv.querySelector('.accept-game-invite') as HTMLButtonElement;
            const rejectBtn = actionsDiv.querySelector('.reject-game-invite') as HTMLButtonElement;
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    console.log('🎮 Accepting game invitation:', inviteData.id);
                    this.acceptGameInvitation(inviteData.id);
                    
                    // Replace buttons with simple acceptance message
                    actionsDiv.innerHTML = `
                        <span class="text-green-400 text-xs">✓ Acceptée</span>
                    `;
                });
            }
            
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => {
                    console.log('❌ Rejecting game invitation:', inviteData.id);
                    this.rejectGameInvitation(inviteData.id);
                    
                    // Replace buttons with simple rejection message
                    actionsDiv.innerHTML = `
                        <span class="text-gray-400 text-xs">✗ Refusée</span>
                    `;
                });
            }
        }
        
        // Add simple timestamp
        const messageTime = document.createElement('div');
        messageTime.className = `text-xs mt-2 ${isSentByMe ? 'text-blue-200' : 'text-gray-400'}`;
        
        // Format time
        const messageDate = new Date(inviteData.created_at || new Date());
        messageTime.textContent = messageDate.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);
        
        // Add to chat (before typing indicator if it exists)
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            chatMessages.insertBefore(messageDiv, typingIndicator);
        } else {
            chatMessages.appendChild(messageDiv);
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        console.log(`🎮 Simple game invitation added to chat - Sent by me: ${isSentByMe}, ID: ${inviteData.id}`);
    }
    
    private loadChatHistory(friendId: number) {
        // CORRECTION: Vérifier que nous sommes toujours dans la bonne conversation
        if (this.currentChatUserId !== friendId) {
            return;
        }
        
        // Check if we have cached history
        if (this.chatHistory.has(friendId)) {
            console.log('📚 Loading from cache');
            const messages = this.chatHistory.get(friendId)!;
            const currentUserId = this.getCurrentUserId();
            
            // CORRECTION: Double vérification avant d'ajouter les messages
            if (this.currentChatUserId === friendId && currentUserId) {
                messages.forEach((message: any) => {
                    // Vérifier encore une fois avant chaque message
                    if (this.currentChatUserId === friendId) {
                        // CORRECTION: Logique corrigée pour déterminer qui a envoyé le message
                        const isSentByMe = message.sender_id === currentUserId;
                        
                        console.log(`📝 Message ${message.id}: sender=${message.sender_id}, currentUser=${currentUserId}, isSentByMe=${isSentByMe}`);
                        
                        // Check if it's a game invitation
                        if (message.type === 'game_invite') {
                            this.addGameInviteToChat(message, isSentByMe);
                        } else {
                            this.addMessageToChat(message, isSentByMe);
                        }
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
        loadingDiv.className = 'flex items-center justify-center py-8 text-gray-400';
        loadingDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Chargement des messages...</span>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        
        console.log('📡 Loading chat history from API');
        
        // Load chat history from API
        api.chat.getMessages(friendId)
            .then(response => {
                // CORRECTION: Vérifier que nous sommes toujours dans la bonne conversation
                if (this.currentChatUserId !== friendId) {
                    return;
                }
                
                // Remove loading indicator
                const loading = document.getElementById('chat-loading');
                if (loading) {
                    loading.remove();
                }
                
                if (response.success && response.data) {
                    const messages = response.data;
                    const currentUserId = this.getCurrentUserId();
                    
                    console.log(`📚 Loaded ${messages.length} messages for user ${currentUserId}`);
                    
                    // Cache the messages
                    this.chatHistory.set(friendId, messages);
                    
                    if (messages.length > 0 && currentUserId) {
                        // Add each message to the chat avec vérification
                        messages.forEach((message: any) => {
                            // Vérifier encore une fois avant chaque message
                            if (this.currentChatUserId === friendId) {
                                // CORRECTION: Logique corrigée pour déterminer qui a envoyé le message
                                const isSentByMe = message.sender_id === currentUserId;
                                
                                console.log(`📝 Message ${message.id}: sender=${message.sender_id}, currentUser=${currentUserId}, isSentByMe=${isSentByMe}`);
                                
                                // Check if it's a game invitation
                                if (message.type === 'game_invite') {
                                    this.addGameInviteToChat(message, isSentByMe);
                                } else {
                                    this.addMessageToChat(message, isSentByMe);
                                }
                            }
                        });
                    } else {
                        // Vérifier avant d'afficher l'indicateur
                        if (this.currentChatUserId === friendId) {
                            this.showNoMessagesIndicator();
                        }
                    }
                } else {
                    console.error('❌ Failed to load chat history');
                    if (this.currentChatUserId === friendId) {
                        this.showChatError('Erreur lors du chargement des messages');
                    }
                }
                
                // Scroll to bottom seulement si on est toujours dans la bonne conversation
                if (this.currentChatUserId === friendId) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            })
            .catch(error => {
                console.error('❌ Error loading chat history:', error);
                
                // CORRECTION: Vérifier que nous sommes toujours dans la bonne conversation
                if (this.currentChatUserId !== friendId) {
                    return;
                }
                
                // Remove loading indicator
                const loading = document.getElementById('chat-loading');
                if (loading) {
                    loading.remove();
                }
                
                this.showChatError('Erreur lors du chargement des messages');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
    }
    
    private showNoMessagesIndicator() {
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) return;
        
        const noMessagesDiv = document.createElement('div');
        noMessagesDiv.className = 'text-center text-gray-500 text-sm py-8';
        noMessagesDiv.innerHTML = `
            <i class="fas fa-comments text-3xl mb-3 text-gray-600"></i>
            <p class="mb-2">Aucun message encore</p>
            <p class="text-xs text-gray-600">Commencez la conversation !</p>
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

        // Éviter la configuration multiple
        if (this.chatWebSocketSetup) {
            return;
        }

        console.log('🔌 Setting up chat WebSocket');

        // Listen for incoming chat messages
        websocketService.on('chat-message-received', (data: any) => {
            // CORRECTION: Vérifier que le message appartient à la conversation actuelle
            if (!this.currentChatUserId || data.sender_id !== this.currentChatUserId) {
                // Add to cache for the sender même si ce n'est pas la conversation actuelle
                if (!this.chatHistory.has(data.sender_id)) {
                    this.chatHistory.set(data.sender_id, []);
                }
                const senderHistory = this.chatHistory.get(data.sender_id);
                if (senderHistory && !senderHistory.find(msg => msg.id === data.id)) {
                    senderHistory.push(data);
                }
                
                // Show notification for messages from other users
                const senderName = this.getFriendNameById(data.sender_id) || 'Un ami';
                console.log(`📨 New message from ${senderName}`);
                return;
            }
            
            console.log('📨 Received message');
            
            // Add to cache for the sender
            if (!this.chatHistory.has(data.sender_id)) {
                this.chatHistory.set(data.sender_id, []);
            }
            const senderHistory = this.chatHistory.get(data.sender_id);
            if (senderHistory && !senderHistory.find(msg => msg.id === data.id)) {
                senderHistory.push(data);
            }

            // Only show message if it's from the current chat user
            this.addMessageToChat({
                content: data.content,
                type: data.type || 'text',
                sender_id: data.sender_id,
                receiver_id: this.getCurrentUserId(),
                created_at: data.created_at || new Date().toISOString()
            }, false);
        });

        // Listen for message confirmations
        websocketService.on('chat-message-sent', (data: any) => {
            console.log('✅ Message sent');
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // CORRECTION: Vérifier que la confirmation est pour la conversation actuelle
            if (!this.currentChatUserId || data.receiver_id !== this.currentChatUserId) {
                return;
            }
            
            // Add the confirmed message to chat only if it's for the current conversation
            this.addMessageToChat({
                content: data.content,
                type: data.type || 'text',
                sender_id: this.getCurrentUserId(),
                receiver_id: data.receiver_id,
                created_at: data.created_at || new Date().toISOString()
            }, true);
        });

        // Listen for WebSocket errors
        websocketService.on('error', (data: any) => {
            console.error('❌ WebSocket error:', data);
            // Remove typing indicator on error
            this.removeTypingIndicator();
            // Show error message
            if (data.message && data.message.includes('chat')) {
                this.showNotification(`Erreur de chat: ${data.message}`, 'error');
            }
        });

        // Listen for game invitation confirmations
        websocketService.on('game-invite-sent', (data: any) => {
            console.log('✅ Game invitation sent confirmation:', data);
            this.showNotification('Invitation de jeu envoyée avec succès', 'success');
        });

        // Listen for incoming game invitations
        websocketService.on('game-invite-received', (data: any) => {
            console.log('🎮 Game invitation received:', data);
            const senderName = this.getFriendNameById(data.sender_id) || 'Un ami';
            this.showNotification(`${senderName} vous invite à jouer !`, 'info');
            
            // Ensure the invitation has proper structure
            const invitationData = {
                id: data.id,
                sender_id: data.sender_id,
                receiver_id: this.getCurrentUserId(),
                created_at: data.created_at || new Date().toISOString(),
                type: 'game_invite',
                content: 'Invitation à jouer'
            };
            
            // Add game invitation message to chat if it's from current conversation
            if (this.currentChatUserId === data.sender_id) {
                console.log('🎮 Adding invitation to current chat');
                this.addGameInviteToChat(invitationData, false);
            } else {
                console.log('🎮 Caching invitation for later');
                // Cache the invitation for when the conversation is opened
                if (!this.chatHistory.has(data.sender_id)) {
                    this.chatHistory.set(data.sender_id, []);
                }
                const senderHistory = this.chatHistory.get(data.sender_id);
                if (senderHistory) {
                    senderHistory.push(invitationData);
                }
            }
        });

        // Marquer comme configuré
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
}

// Export a singleton instance
export const chatManager = new ChatManager();

// Expose globally for HTML access
if (typeof window !== 'undefined') {
    (window as any).chatManager = chatManager;
    (window as any).ChatManager = ChatManager;
} 