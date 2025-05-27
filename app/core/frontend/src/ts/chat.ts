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
        console.log(`Opening chat with friend: ${friendUsername} (ID: ${friendId})`);
        
        // Si on ouvre la même conversation, ne rien faire
        if (this.currentChatUserId === friendId) {
            console.log('Same chat already open, switching to chat tab');
            this.switchToChatTab();
            return;
        }
        
        // Mettre à jour les variables de chat actuelles
        this.currentChatUserId = friendId;
        this.currentChatUsername = friendUsername;
        
        // Basculer vers l'onglet chat
        this.switchToChatTab();
        
        // Préparer l'interface de chat
        this.setupChatInterface(friendId, friendUsername);
        
        // Charger l'historique de chat
        this.loadChatHistory(friendId);
        
        // Configurer les WebSockets si ce n'est pas déjà fait
        if (!this.chatWebSocketSetup) {
            this.setupChatWebSocket();
            this.chatWebSocketSetup = true;
        }
        
        console.log(`Chat opened successfully with ${friendUsername}`);
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
        
        if (!chatMessages || !noChatSelected || !chatInput) {
            console.error('Chat elements not found');
            return;
        }
        
        // Hide "no chat selected" message
        noChatSelected.classList.add('hidden');
        
        // Show chat input
        chatInput.classList.remove('hidden');
        
        // Clear previous messages from UI
        chatMessages.innerHTML = '';
        
        // Add header with friend info
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
                <button id="close-chat" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times"></i>
                </button>
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
    
    private sendChatMessage() {
        const messageInput = document.getElementById('message-input') as HTMLInputElement;
        
        if (!messageInput) {
            console.error('Message input not found');
            return;
        }
        
        const message = messageInput.value.trim();
        
        if (!message || !this.currentChatUserId) {
            console.log('No message or no chat user selected');
            return;
        }
        
        console.log(`Sending message: "${message}" to user ${this.currentChatUserId}`);
        
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
            console.warn('WebSocket not available, cannot send message');
            this.showNotification('Connexion WebSocket indisponible', 'error');
        }
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
            console.error('Chat messages container not found');
            return;
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        
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
        
        // Add to cache
        if (this.currentChatUserId) {
            if (!this.chatHistory.has(this.currentChatUserId)) {
                this.chatHistory.set(this.currentChatUserId, []);
            }
            this.chatHistory.get(this.currentChatUserId)!.push(messageData);
        }
        
        console.log('Message added to chat UI');
    }
    
    private loadChatHistory(friendId: number) {
        console.log(`Loading chat history for friend ${friendId}`);
        
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Check if we have cached history
        if (this.chatHistory.has(friendId)) {
            console.log('Loading chat history from cache');
            const messages = this.chatHistory.get(friendId)!;
            const currentUserId = this.getCurrentUserId();
            
            messages.forEach((message: any) => {
                const isSentByMe = message.sender_id === currentUserId;
                this.addMessageToChat(message, isSentByMe);
            });
            
            if (messages.length === 0) {
                this.showNoMessagesIndicator();
            }
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
        
        // Load chat history from API
        api.chat.getMessages(friendId)
            .then(response => {
                // Remove loading indicator
                const loading = document.getElementById('chat-loading');
                if (loading) {
                    loading.remove();
                }
                
                if (response.success && response.data) {
                    const messages = response.data;
                    const currentUserId = this.getCurrentUserId();
                    
                    // Cache the messages
                    this.chatHistory.set(friendId, messages);
                    
                    if (messages.length > 0) {
                        // Add each message to the chat
                        messages.forEach((message: any) => {
                            const isSentByMe = message.sender_id === currentUserId;
                            this.addMessageToChat(message, isSentByMe);
                        });
                    } else {
                        this.showNoMessagesIndicator();
                    }
                } else {
                    console.error('Failed to load chat history:', response.message);
                    this.showChatError('Erreur lors du chargement des messages');
                }
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            })
            .catch(error => {
                console.error('Error loading chat history:', error);
                
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
            console.error('WebSocket service not available for chat');
            return;
        }

        // Éviter la configuration multiple
        if (this.chatWebSocketSetup) {
            console.log('Chat WebSocket already setup, skipping');
            return;
        }

        console.log('Setting up chat WebSocket listeners');

        // Listen for incoming chat messages
        websocketService.on('chat-message-received', (data: any) => {
            console.log('Received chat message via WebSocket:', data);
            // Add to cache for the sender
            if (!this.chatHistory.has(data.sender_id)) {
                this.chatHistory.set(data.sender_id, []);
            }
            const senderHistory = this.chatHistory.get(data.sender_id);
            if (senderHistory) {
                senderHistory.push(data);
            }

            // Only show message if it's from the current chat user
            if (this.currentChatUserId && data.sender_id === this.currentChatUserId) {
                this.addMessageToChat({
                    content: data.content,
                    type: data.type || 'text',
                    sender_id: data.sender_id,
                    receiver_id: this.getCurrentUserId(),
                    created_at: data.created_at || new Date().toISOString()
                }, false);
            } else {
                // Show notification for messages from other users
                const senderName = this.getFriendNameById(data.sender_id) || 'Un ami';
                this.showNotification(`Nouveau message de ${senderName}`, 'info');
            }
        });

        // Listen for message confirmations
        websocketService.on('chat-message-sent', (data: any) => {
            console.log('Message sent confirmation via WebSocket:', data);
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add the confirmed message to chat only if it's for the current conversation
            if (this.currentChatUserId && data.receiver_id === this.currentChatUserId) {
                this.addMessageToChat({
                    content: data.content,
                    type: data.type || 'text',
                    sender_id: this.getCurrentUserId(),
                    receiver_id: data.receiver_id,
                    created_at: data.created_at || new Date().toISOString()
                }, true);
            }
        });

        // Listen for WebSocket errors
        websocketService.on('error', (data: any) => {
            console.error('WebSocket error:', data);
            // Remove typing indicator on error
            this.removeTypingIndicator();
            // Show error message
            if (data.message && data.message.includes('chat')) {
                this.showNotification(`Erreur de chat: ${data.message}`, 'error');
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
        const authService = (window as any).authService;
        if (authService && authService.getCurrentUser) {
            const user = authService.getCurrentUser();
            return user ? user.id : null;
        }
        // Fallback to localStorage
        const userId = localStorage.getItem('user_id');
        return userId ? parseInt(userId) : null;
    }
    
    private showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
        // Fonction désactivée - ne fait plus rien
        console.log(`[Notification désactivée] ${type}: ${message}`);
    }
    
    private initializeChatEventListeners() {
        console.log('Initializing chat event listeners');
        
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            // Chat form submission
            const chatForm = document.getElementById('chat-form') as HTMLFormElement;
            if (chatForm) {
                chatForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendChatMessage();
                });
                console.log('Chat form listener added');
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
                console.log('Message input listener added');
            }
        });
        
        console.log('Chat event listeners initialized');
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
}

// Export a singleton instance
export const chatManager = new ChatManager(); 