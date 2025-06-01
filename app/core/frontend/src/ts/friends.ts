// This file will be compiled to JS and included in the HTML directly
// Global services and types will be available

import { api, getAvatarUrl } from './api';
import { websocketService } from './websocket';
import { friendshipService, Friend, PendingRequest } from './friendship';
import { chatManager } from './chat';

// Utility function to create avatar HTML with consistent styling
export function createAvatarHTML(user: { id?: number; avatar_url?: string | null; username: string; has_avatar_data?: boolean }, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizeClasses = {
        small: 'w-8 h-8 sm:w-10 sm:h-10',
        medium: 'w-10 h-10 sm:w-12 sm:h-12', 
        large: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'
    };
    
    const iconSizes = {
        small: 'text-sm sm:text-lg',
        medium: 'text-lg sm:text-xl',
        large: 'text-2xl sm:text-3xl md:text-4xl'
    };
    
    const sizeClass = sizeClasses[size];
    const iconSize = iconSizes[size];
    
    // Debug: Log user data for avatar creation
    console.log('createAvatarHTML called with:', {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        has_avatar_data: user.has_avatar_data,
        size: size
    });
    
    // Use getAvatarUrl to prioritize uploaded avatars over URLs
    let avatarUrl = '';
    if (user.id) {
        avatarUrl = getAvatarUrl({
            id: user.id,
            has_avatar_data: user.has_avatar_data,
            avatar_url: user.avatar_url || undefined
        });
        console.log('Generated avatar URL:', avatarUrl);
    } else {
        console.log('No user ID provided, using default icon');
    }
    
    if (avatarUrl && avatarUrl.trim()) {
        return `<img src="${avatarUrl}" alt="${user.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <i class="fas fa-user text-white ${iconSize}" style="display: none;"></i>`;
    } else {
        return `<i class="fas fa-user text-white ${iconSize}"></i>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Friends page loaded');
    
    // Get services from global scope
    const authService = (window as any).authService;
    
    console.log('Auth service available:', !!authService);
    
    // Check if services are available
    if (!api || !api.friendship) {
        console.error('API or friendship module not available');
        window.location.href = '/login.html';
        return;
    }
    
    // Force auth service to refresh token state from storage
    if (authService && authService.restoreSession) {
        console.log('Friends: Restoring auth session');
        authService.restoreSession();
    }
    
    // Check if user is authenticated properly using authService
    const isAuthenticated = authService && 
                          authService.isAuthenticated && 
                          typeof authService.isAuthenticated === 'function' && 
                          authService.isAuthenticated();
    
    console.log('Friends: User is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
        console.log('Friends: User not authenticated, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Vérifier explicitement que le token est disponible
    const token = authService.getToken();
    console.log('Friends: Auth token available:', !!token);
    
    if (!token) {
        console.log('Friends: No auth token available, redirecting to login');
        authService.clearSession();
        window.location.href = '/login.html';
        return;
    }
    
    // Connect to WebSocket if available
    if (websocketService && websocketService.connect) {
        console.log('Connecting to WebSocket with auth token');
        websocketService.connect();
        
        // Vérifier la connexion après un court délai
        setTimeout(() => {
            if (websocketService.isConnected && websocketService.isConnected()) {
                console.log('WebSocket successfully connected!');
            } else {
                console.log('WebSocket connection failed, retrying once more...');
                websocketService.connect();
            }
        }, 1000);
    }
    
    // DOM elements
    const friendsContainer = document.getElementById('friends-container') as HTMLElement;
    const noFriends = document.getElementById('no-friends') as HTMLElement;
    const friendTemplate = document.getElementById('friend-template') as HTMLTemplateElement;
    
    const friendRequestsContainer = document.getElementById('friend-requests-container') as HTMLElement;
    const noFriendRequests = document.getElementById('no-friend-requests') as HTMLElement;
    const friendRequestTemplate = document.getElementById('friend-request-template') as HTMLTemplateElement;
    
    const searchUserForm = document.getElementById('search-user-form') as HTMLFormElement;
    const searchUsername = document.getElementById('search-username') as HTMLInputElement;
    const searchResultsContainer = document.getElementById('search-results-container') as HTMLElement;
    const searchResults = document.getElementById('search-results') as HTMLElement;
    const searchResultTemplate = document.getElementById('search-result-template') as HTMLTemplateElement;
    const searchError = document.getElementById('search-error') as HTMLElement;
    const searchErrorText = document.getElementById('search-error-text') as HTMLElement;
    const friendsSearch = document.getElementById('friends-search') as HTMLInputElement;
    
    // Register WebSocket event handlers if available
    if (websocketService && websocketService.on) {
        console.log('Setting up WebSocket event handlers for friends system');
        
        // Check if friends WebSocket handlers are already setup to avoid conflicts
        if ((window as any).friendsWebSocketSetup) {
            console.log('🔌 Friends WebSocket handlers already setup, skipping');
        } else {
            console.log('🔌 Setting up friends WebSocket handlers');
            
            // Écouteur pour recevoir une demande d'ami
            websocketService.on('friend-request-received', (data: any) => {
                console.log('Received friend request via WebSocket:', data);
                
                // Correction du format des données - chercher le nom d'utilisateur au bon endroit
                const username = data.from?.username || 'Quelqu\'un';
                
                // Recharger les demandes d'amitié en attente
                loadFriendRequests();
                
                // Afficher une notification
                showNotification(`Nouvelle demande d'ami de ${username}`);
                
                // Forcer le rechargement après un court délai pour s'assurer que les données sont à jour
                setTimeout(() => {
                    loadFriendRequests();
                }, 500);
            });
            
            // Écouteur pour les demandes envoyées
            websocketService.on('friend-request-sent', (data: any) => {
                console.log('Friend request sent via WebSocket:', data);
                
                // Trouver et mettre à jour le bouton d'ajout dans l'interface si présent
                const searchResultItem = document.querySelector(`.search-result-item[data-id="${data.friend_id}"]`);
                if (searchResultItem) {
                    const sendButton = searchResultItem.querySelector('.add-friend-button') as HTMLButtonElement;
                    if (sendButton) {
                        sendButton.innerHTML = '<i class="fas fa-check mr-2"></i> Demande envoyée';
                        sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                        sendButton.classList.add('bg-blue-600', 'cursor-not-allowed');
                        sendButton.disabled = true;
                    }
                }
                
                showNotification(`Demande d'ami envoyée à ${data.friend_username || 'un utilisateur'}`);
            });
            
            // Écouteur quand une demande d'ami est acceptée
            websocketService.on('friend-request-accepted', (data: any) => {
                console.log('Friend request accepted via WebSocket:', data);
                // Recharger la liste d'amis
                loadFriends();
                // Afficher une notification
                showNotification(`${data.friend_username || 'Quelqu\'un'} a accepté votre demande d'ami`);
            });
            
            // Écouteur pour la réponse (acceptation ou rejet) envoyée
            websocketService.on('friend-request-response-sent', (data: any) => {
                console.log('Friend request response sent via WebSocket:', data);
                const action = data.accepted ? 'acceptée' : 'rejetée';
                showNotification(`Demande d'ami ${action}`);
                // Si c'est une acceptation, recharger la liste d'amis
                if (data.accepted) {
                    loadFriends();
                }
            });
            
            // Écouteur pour la suppression d'amitié
            websocketService.on('friend-removed', (data: any) => {
                console.log('Friend removed via WebSocket:', data);
                
                if (data.friend_id) {
                    // Si on est notifié qu'un ami nous a retiré
                    showNotification(`Un utilisateur vous a retiré de sa liste d'amis`, 'info');
                    loadFriends(); // Rafraîchir la liste d'amis
                } else {
                    // Confirmation de notre suppression
                    showNotification(`Ami supprimé avec succès`, 'success');
                }
            });
            
            // Écouteur pour les changements de statut d'amis
            websocketService.on('friend-status-change', (data: any) => {
                console.log('Friend status changed via WebSocket:', data);
                updateFriendStatus(data.friend_id, data.status);
            });
            
            // Mark as setup to avoid conflicts
            (window as any).friendsWebSocketSetup = true;
        }
    } else {
        console.warn('WebSocket service not available for event handling');
    }
    
    // Function to show notification - supprimé
    // Cette fonction a été supprimée pour simplifier l'interface
    function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
        // Fonction désactivée - ne fait plus rien
        console.log(`[Notification désactivée] ${type}: ${message}`);
    }
    
    // Function to update friend status in UI
    function updateFriendStatus(userId: number, newStatus: string) {
        console.log(`Updating friend status for user ${userId} to ${newStatus}`);
        if (!userId) {
            console.warn('No user ID provided for status update');
            return;
        }
        
        const friendItem = document.querySelector(`.friend-item[data-id="${userId}"]`);
        if (!friendItem) {
            console.warn(`Friend item with id ${userId} not found in the DOM`);
            return;
        }
        
        const statusIndicator = friendItem.querySelector('.friend-status-indicator') as HTMLElement;
        const status = friendItem.querySelector('.friend-status') as HTMLElement;
        
        if (!statusIndicator || !status) {
            console.warn('Status elements not found in friend item');
            return;
        }
        
        // Remove existing status classes
        statusIndicator.classList.remove('bg-blue-500', 'bg-gray-500');
        
        // Set new status
        if (newStatus === 'online') {
            statusIndicator.classList.add('bg-blue-500');
            status.textContent = 'En ligne';
        } else if (newStatus === 'in_game') {
            statusIndicator.classList.add('bg-blue-500');
            status.textContent = 'En jeu';
        } else {
            statusIndicator.classList.add('bg-gray-500');
            status.textContent = 'Hors ligne';
        }
    }
    
    // Function to load friends list
    async function loadFriends() {
        try {
            const response = await api.friendship.getFriends();
            
            if (response.success && response.data) {
                const friends = response.data;
                
                // Store friends list globally for checking - SIMPLE!
                (window as any).currentFriends = friends;
                
                if (friends.length > 0) {
                    // Hide no friends message
                    noFriends.classList.add('hidden');
                    friendsContainer.innerHTML = '';
                    
                    // Add each friend to the container
                    friends.forEach((friend: any) => {
                        addFriendToUI(friend);
                    });
                } else {
                    // Show no friends message
                    noFriends.classList.remove('hidden');
                    friendsContainer.innerHTML = '';
                }
            } else {
                console.error('Failed to load friends:', response.message);
            }
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }
    
    // Helper function to check if a user is already a friend - SIMPLE!
    function isUserAlreadyFriend(userId: number): boolean {
        const currentFriends = (window as any).currentFriends || [];
        return currentFriends.some((friend: any) => friend.id === userId);
    }
    
    // Function to add a friend to the UI
    function addFriendToUI(friend: any) {
        const friendElement = document.importNode(friendTemplate.content, true);
        
        // Set friend details
        const username = friendElement.querySelector('.friend-username') as HTMLElement;
        const avatar = friendElement.querySelector('.friend-avatar') as HTMLElement;
        const statusIndicator = friendElement.querySelector('.friend-status-indicator') as HTMLElement;
        const status = friendElement.querySelector('.friend-status') as HTMLElement;
        const chatButton = friendElement.querySelector('.chat-friend-button') as HTMLButtonElement;
        const removeButton = friendElement.querySelector('.remove-friend-button') as HTMLButtonElement;
        
        // Set username
        username.textContent = friend.username;
        
        // Make username and avatar clickable for profile viewing
        username.classList.add('cursor-pointer', 'hover:text-blue-400', 'transition-colors', 'duration-200');
        avatar.classList.add('cursor-pointer', 'hover:ring-2', 'hover:ring-blue-400', 'transition-all', 'duration-200');
        
        // Add click event listeners for profile viewing
        username.addEventListener('click', () => {
            showUserProfile(friend.id, friend.username);
        });
        
        avatar.addEventListener('click', () => {
            showUserProfile(friend.id, friend.username);
        });
        
        // Set avatar using consistent styling
        avatar.innerHTML = createAvatarHTML(friend, 'medium');
        
        // Set status indicator color and text
        if (friend.status === 'online') {
            statusIndicator.classList.add('bg-blue-500');
            status.textContent = 'En ligne';
        } else if (friend.status === 'in_game') {
            statusIndicator.classList.add('bg-blue-500');
            status.textContent = 'En jeu';
        } else {
            statusIndicator.classList.add('bg-gray-500');
            status.textContent = 'Hors ligne';
        }
        
        // Add friend ID as data attribute
        const friendItem = friendElement.querySelector('.friend-item') as HTMLElement;
        friendItem.dataset.id = friend.id.toString();
        
        // Ajouter un effet hover au bouton de suppression
        removeButton.addEventListener('mouseenter', () => {
            removeButton.innerHTML = '<i class="fas fa-user-times"></i>';
        });
        
        removeButton.addEventListener('mouseleave', () => {
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
        });
        
        // Add event listener to remove button
        removeButton.addEventListener('click', async () => {
            try {
                // Afficher une confirmation avec un style moderne
                const confirmDialog = document.createElement('div');
                confirmDialog.className = 'fixed inset-0 flex items-center justify-center z-50';
                confirmDialog.innerHTML = `
                    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
                    <div class="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 p-6 max-w-sm w-full mx-4 z-10 transform transition-all scale-95 opacity-0">
                        <div class="flex items-center justify-center mb-4 text-yellow-400">
                            <i class="fas fa-exclamation-triangle text-3xl"></i>
                        </div>
                        <h3 class="text-xl font-medium text-center text-white mb-4">Confirmer la suppression</h3>
                        <p class="text-gray-300 mb-5 text-center">Êtes-vous sûr de vouloir supprimer <span class="font-medium text-white">${friend.username}</span> de votre liste d'amis ?</p>
                        <div class="flex space-x-3 justify-center">
                            <button class="confirm-cancel-btn px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                                Annuler
                            </button>
                            <button class="confirm-delete-btn px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-colors">
                                Supprimer
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(confirmDialog);
                
                // Animer l'apparition
                setTimeout(() => {
                    const dialogContent = confirmDialog.querySelector('div:nth-child(2)');
                    if (dialogContent) {
                        dialogContent.classList.remove('scale-95', 'opacity-0');
                        dialogContent.classList.add('scale-100', 'opacity-100');
                    }
                }, 10);
                
                // Configurer les événements
                const cancelBtn = confirmDialog.querySelector('.confirm-cancel-btn');
                const deleteBtn = confirmDialog.querySelector('.confirm-delete-btn');
                
                return new Promise<boolean>((resolve) => {
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            // Animer la disparition
                            const dialogContent = confirmDialog.querySelector('div:nth-child(2)');
                            if (dialogContent) {
                                dialogContent.classList.remove('scale-100', 'opacity-100');
                                dialogContent.classList.add('scale-95', 'opacity-0');
                            }
                            
                            setTimeout(() => {
                                document.body.removeChild(confirmDialog);
                                resolve(false);
                            }, 200);
                        });
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', async () => {
                            // Animer la disparition
                            const dialogContent = confirmDialog.querySelector('div:nth-child(2)');
                            if (dialogContent) {
                                dialogContent.classList.remove('scale-100', 'opacity-100');
                                dialogContent.classList.add('scale-95', 'opacity-0');
                            }
                            
                            setTimeout(() => {
                                document.body.removeChild(confirmDialog);
                                resolve(true);
                            }, 200);
                            
                            // Désactiver le bouton pour éviter les clics multiples
                            removeButton.disabled = true;
                            removeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            removeButton.classList.add('opacity-75');
                            
                            // Utiliser WebSocket si disponible
                            const websocketService = (window as any).websocketService;
                            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                                console.log('Removing friend via WebSocket');
                                websocketService.send('friend-remove', { friendId: friend.id });
                                
                                // NOUVEAU: Fermer le chat si c'est l'ami actuellement en discussion
                                const chatManager = (window as any).chatManager;
                                if (chatManager && chatManager.getCurrentChatUserId() === friend.id) {
                                    console.log('🔄 Closing current chat conversation after friend removal');
                                    chatManager.closeChatConversation();
                                }
                                
                                // Animer la disparition de l'ami
                                friendItem.style.transition = 'all 0.3s ease-out';
                                friendItem.style.transform = 'translateX(10px)';
                                friendItem.style.opacity = '0';
                                
                                setTimeout(() => {
                                    // Remove friend from UI
                                    friendItem.remove();
                                    
                                    // Check if friends list is empty
                                    if (friendsContainer.children.length === 0) {
                                        noFriends.classList.remove('hidden');
                                    }
                                }, 300);
                                
                                // Afficher une notification
                                showNotification(`${friend.username} a été retiré de vos amis`, 'info');
                            } else {
                                // Fallback à l'API REST
                                console.log('WebSocket not available, using REST API');
                                const response = await api.friendship.removeFriend(friend.id);
                                
                                if (response.success) {
                                    // NOUVEAU: Fermer le chat si c'est l'ami actuellement en discussion
                                    const chatManager = (window as any).chatManager;
                                    if (chatManager && chatManager.getCurrentChatUserId() === friend.id) {
                                        console.log('🔄 Closing current chat conversation after friend removal');
                                        chatManager.closeChatConversation();
                                    }
                                    
                                    // Animer la disparition de l'ami
                                    friendItem.style.transition = 'all 0.3s ease-out';
                                    friendItem.style.transform = 'translateX(10px)';
                                    friendItem.style.opacity = '0';
                                    
                                    setTimeout(() => {
                                        // Remove friend from UI
                                        friendItem.remove();
                                        
                                        // Check if friends list is empty
                                        if (friendsContainer.children.length === 0) {
                                            noFriends.classList.remove('hidden');
                                        }
                                    }, 300);
                                    
                                    // Afficher une notification
                                    showNotification(`${friend.username} a été retiré de vos amis`, 'info');
                                } else {
                                    console.error('Failed to remove friend:', response.message);
                                    showNotification(`Erreur: ${response.message}`, 'error');
                                    
                                    // Réactiver le bouton en cas d'erreur
                                    removeButton.disabled = false;
                                    removeButton.innerHTML = '<i class="fas fa-times"></i>';
                                    removeButton.classList.remove('opacity-75');
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Error removing friend:', error);
                showNotification('Une erreur est survenue', 'error');
            }
        });
        
        // Add event listeners
        chatButton.addEventListener('click', () => {
            // NOUVEAU: Toujours permettre l'ouverture du chat (même bloqué) pour voir l'interface
            console.log(`💬 Opening chat with ${friend.username} (ID: ${friend.id}) - allowing blocked users`);
            chatManager.openChatWithFriend(friend.id, friend.username);
        });
        
        // Add to container
        friendsContainer.appendChild(friendElement);
    }
    
    // Function to show user profile in a modal
    async function showUserProfile(friendId: number, friendUsername: string) {
        console.log(`👤 Showing user profile for ${friendUsername} (ID: ${friendId})`);
        
        // Remove existing profile modal if any
        const existingModal = document.getElementById('user-profile-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Get friend data from the current friends list
        const friendItem = document.querySelector(`.friend-item[data-id="${friendId}"]`);
        let friendStatus = 'Hors ligne';
        if (friendItem) {
            const statusElement = friendItem.querySelector('.friend-status');
            if (statusElement) {
                friendStatus = statusElement.textContent || 'Hors ligne';
            }
        }
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'user-profile-modal';
        modalOverlay.className = 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-dark-800 border border-dark-600 rounded-xl p-0 max-w-sm w-full shadow-2xl transform transition-all duration-300 scale-95 opacity-0';
        
        // Show loading state initially
        modalContent.innerHTML = `
            <div class="relative">
                <!-- Header with close button -->
                <div class="flex items-center justify-end p-4">
                    <button id="close-profile-modal" class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <!-- Loading content -->
                <div class="p-8 text-center">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-500/30">
                        <i class="fas fa-spinner fa-spin text-2xl text-blue-400"></i>
                    </div>
                    <p class="text-gray-400">Chargement du profil...</p>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Animate modal appearance
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        // Add close event listener for loading state
        const closeButton = modalContent.querySelector('#close-profile-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modalOverlay.remove(), 200);
            });
        }
        
        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modalOverlay.remove(), 200);
            }
        });
        
        // Load real user profile data from API
        try {
            const authService = (window as any).authService;
            const token = authService?.getToken();
            
            if (!token) {
                throw new Error('No authentication token available');
            }
            
            // Fetch user profile with real statistics
            const response = await fetch(`${api.baseUrl}/users/${friendId}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load profile');
            }
            
            const profileData = data.data;
            
            // Format join date
            const joinDate = profileData.created_at 
                ? new Date(profileData.created_at).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long' 
                })
                : 'Non disponible';
            
            // Update modal content with real profile data
            modalContent.innerHTML = `
                <div class="relative">
                    <!-- Header with close button -->
                    <div class="flex items-center justify-end p-4">
                        <button id="close-profile-modal" class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    
                    <!-- User Info Section -->
                    <div class="px-6 pb-6">
                        <!-- Avatar and basic info -->
                        <div class="text-center mb-6">
                            <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-dark-700 overflow-hidden">
                                ${createAvatarHTML(profileData, 'large')}
                            </div>
                            <h3 class="text-2xl font-bold text-white mb-2">${profileData.username}</h3>
                            <div class="flex items-center justify-center">
                                <span class="status-indicator ${friendStatus === 'En ligne' ? 'bg-green-400' : friendStatus === 'En jeu' ? 'bg-blue-400' : 'bg-gray-500'} w-3 h-3 rounded-full mr-2"></span>
                                <span class="text-sm ${friendStatus === 'En ligne' ? 'text-green-400' : friendStatus === 'En jeu' ? 'text-blue-400' : 'text-gray-400'}">${friendStatus}</span>
                            </div>
                        </div>
                        
                        <!-- User Details -->
                        <div class="space-y-4 mb-6">
                            <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
                                <div class="flex items-center mb-3">
                                    <h4 class="text-white font-medium flex items-center">
                                        <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                                        Informations
                                    </h4>
                                </div>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400 text-sm flex items-center">
                                            <i class="fas fa-envelope text-gray-500 mr-2 w-4"></i>
                                            Email
                                        </span>
                                        <span class="text-white text-sm font-medium">${profileData.email}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-400 text-sm flex items-center">
                                            <i class="fas fa-calendar text-gray-500 mr-2 w-4"></i>
                                            Membre depuis
                                        </span>
                                        <span class="text-white text-sm font-medium">${joinDate}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Stats Section -->
                            <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
                                <div class="flex items-center mb-3">
                                    <h4 class="text-white font-medium flex items-center">
                                        <i class="fas fa-chart-bar text-purple-400 mr-2"></i>
                                        Statistiques de jeu
                                    </h4>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="text-center p-3 bg-dark-800/50 rounded-lg border border-dark-600/30">
                                        <p class="text-2xl font-bold text-blue-400 mb-1">${profileData.statistics.games_played}</p>
                                        <p class="text-gray-400 text-xs">Parties jouées</p>
                                    </div>
                                    <div class="text-center p-3 bg-dark-800/50 rounded-lg border border-dark-600/30">
                                        <p class="text-2xl font-bold text-green-400 mb-1">${profileData.statistics.wins}</p>
                                        <p class="text-gray-400 text-xs">Victoires</p>
                                    </div>
                                    <div class="text-center p-3 bg-dark-800/50 rounded-lg border border-dark-600/30">
                                        <p class="text-2xl font-bold text-red-400 mb-1">${profileData.statistics.losses}</p>
                                        <p class="text-gray-400 text-xs">Défaites</p>
                                    </div>
                                    <div class="text-center p-3 bg-dark-800/50 rounded-lg border border-dark-600/30">
                                        <p class="text-2xl font-bold text-yellow-400 mb-1">${profileData.statistics.win_rate}%</p>
                                        <p class="text-gray-400 text-xs">Taux de victoire</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-add close event listener
            const newCloseButton = modalContent.querySelector('#close-profile-modal');
            if (newCloseButton) {
                newCloseButton.addEventListener('click', () => {
                    modalContent.classList.remove('scale-100', 'opacity-100');
                    modalContent.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => modalOverlay.remove(), 200);
                });
            }
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            
            // Show error state
            modalContent.innerHTML = `
                <div class="relative">
                    <!-- Header with close button -->
                    <div class="flex items-center justify-end p-4">
                        <button id="close-profile-modal" class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    
                    <!-- Error content -->
                    <div class="p-8 text-center">
                        <div class="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-red-500/30">
                            <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-white mb-2">Erreur de chargement</h3>
                        <p class="text-gray-400 text-sm">Impossible de récupérer les informations de ${friendUsername}</p>
                        <p class="text-gray-500 text-xs mt-2">${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
                    </div>
                </div>
            `;
            
            // Re-add close event listener
            const errorCloseButton = modalContent.querySelector('#close-profile-modal');
            if (errorCloseButton) {
                errorCloseButton.addEventListener('click', () => {
                    modalContent.classList.remove('scale-100', 'opacity-100');
                    modalContent.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => modalOverlay.remove(), 200);
                });
            }
        }
    }
    
    // Function to load friend requests
    async function loadFriendRequests() {
        try {
            console.log('Loading friend requests...');
            const response = await api.friendship.getPendingRequests();
            console.log('Friend requests API response:', response);
            
            if (response.success && response.data) {
                const requests = response.data;
                
                if (requests.length > 0) {
                    // Hide no requests message
                    noFriendRequests.classList.add('hidden');
                    friendRequestsContainer.innerHTML = '';
                    
                    // Add each request to the container
                    requests.forEach((request: any) => {
                        console.log('Processing friend request:', request);
                        addFriendRequestToUI(request);
                    });
                } else {
                    // Show no requests message
                    noFriendRequests.classList.remove('hidden');
                    friendRequestsContainer.innerHTML = '';
                }
            } else {
                console.error('Failed to load friend requests:', response.message);
            }
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    }
    
    // Function to add a friend request to the UI
    function addFriendRequestToUI(request: any) {
        console.log('Adding request to UI:', request);
        // Vérifier que l'objet user ou sender existe
        if (!request.user && !request.sender) {
            console.error('Friend request missing user data:', request);
            return;
        }
        
        // Utiliser sender si user n'existe pas
        const userData = request.user || request.sender;
        
        // Debug: Log user data to see what avatar information is available
        console.log('Friend request user data:', {
            id: userData.id,
            username: userData.username,
            avatar_url: userData.avatar_url,
            has_avatar_data: userData.has_avatar_data
        });
        
        const requestElement = document.importNode(friendRequestTemplate.content, true);
        
        // Set request details
        const username = requestElement.querySelector('.request-username') as HTMLElement;
        const avatar = requestElement.querySelector('.request-avatar') as HTMLElement;
        const acceptButton = requestElement.querySelector('.accept-request-button') as HTMLButtonElement;
        const rejectButton = requestElement.querySelector('.reject-request-button') as HTMLButtonElement;
        
        // Set username
        username.textContent = userData.username;
        
        // Set avatar using consistent styling - ensure all required properties are available
        const avatarData = {
            id: userData.id,
            username: userData.username,
            avatar_url: userData.avatar_url || null,
            has_avatar_data: userData.has_avatar_data || false
        };
        
        console.log('Creating avatar with data:', avatarData);
        avatar.innerHTML = createAvatarHTML(avatarData, 'medium');
        
        // Add request ID as data attribute
        const requestItem = requestElement.querySelector('.friend-request-item') as HTMLElement;
        requestItem.dataset.id = request.id.toString();
        
        // Store the user ID for accept/reject actions
        const userId = userData.id;
        requestItem.dataset.userId = userId.toString();
        
        // Add event listener to accept button
        acceptButton.addEventListener('click', async () => {
            try {
                // Désactiver les boutons pour éviter les clics multiples
                acceptButton.disabled = true;
                rejectButton.disabled = true;
                
                // Changer l'apparence du bouton pour indiquer le traitement
                acceptButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Acceptation...';
                acceptButton.classList.add('opacity-75');
                rejectButton.classList.add('opacity-50');
                
                // Utiliser WebSocket si disponible
                const websocketService = (window as any).websocketService;
                if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                    console.log('Accepting friend request via WebSocket');
                    websocketService.send('friend-request-response', { 
                        friendId: userId, 
                        accept: true 
                    });
                    
                    // Animer la disparition de la demande
                    requestItem.style.transition = 'all 0.3s ease-out';
                    requestItem.style.transform = 'translateX(10px)';
                    requestItem.style.opacity = '0';
                    
                    setTimeout(() => {
                        // Remove request from UI
                        requestItem.remove();
                        
                        // Check if requests list is empty
                        if (friendRequestsContainer.children.length === 0) {
                            noFriendRequests.classList.remove('hidden');
                        }
                    }, 300);
                    
                    // Reload friends list
                    loadFriends();
                    
                    // Afficher une notification
                    showNotification(`Vous êtes maintenant ami avec ${userData.username}`, 'success');
                } else {
                    // Fallback à l'API REST
                    console.log('WebSocket not available, using REST API');
                    const response = await api.friendship.acceptFriendRequest(request.id);
                    
                    if (response.success) {
                        // Animer la disparition de la demande
                        requestItem.style.transition = 'all 0.3s ease-out';
                        requestItem.style.transform = 'translateX(10px)';
                        requestItem.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Remove request from UI
                            requestItem.remove();
                            
                            // Check if requests list is empty
                            if (friendRequestsContainer.children.length === 0) {
                                noFriendRequests.classList.remove('hidden');
                            }
                        }, 300);
                        
                        // Reload friends list
                        loadFriends();
                        
                        // Afficher une notification
                        showNotification(`Vous êtes maintenant ami avec ${userData.username}`, 'success');
                    } else {
                        console.error('Failed to accept friend request:', response.message);
                        showNotification(`Erreur: ${response.message}`, 'error');
                        
                        // Réactiver les boutons en cas d'erreur
                        acceptButton.disabled = false;
                        rejectButton.disabled = false;
                        acceptButton.innerHTML = '<i class="fas fa-check mr-1.5"></i> Accepter';
                        acceptButton.classList.remove('opacity-75');
                        rejectButton.classList.remove('opacity-50');
                    }
                }
            } catch (error) {
                console.error('Error accepting friend request:', error);
                showNotification('Une erreur est survenue', 'error');
                
                // Réactiver les boutons en cas d'erreur
                acceptButton.disabled = false;
                rejectButton.disabled = false;
                acceptButton.innerHTML = '<i class="fas fa-check mr-1.5"></i> Accepter';
                acceptButton.classList.remove('opacity-75');
                rejectButton.classList.remove('opacity-50');
            }
        });
        
        // Add event listener to reject button with the same pattern
        rejectButton.addEventListener('click', async () => {
            try {
                // Désactiver les boutons pour éviter les clics multiples
                rejectButton.disabled = true;
                acceptButton.disabled = true;
                
                // Changer l'apparence du bouton pour indiquer le traitement
                rejectButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Refus...';
                rejectButton.classList.add('opacity-75');
                acceptButton.classList.add('opacity-50');
                
                // Utiliser WebSocket si disponible
                const websocketService = (window as any).websocketService;
                if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                    console.log('Rejecting friend request via WebSocket');
                    websocketService.send('friend-request-response', { 
                        friendId: userId, 
                        accept: false 
                    });
                    
                    // Animer la disparition de la demande
                    requestItem.style.transition = 'all 0.3s ease-out';
                    requestItem.style.transform = 'translateX(10px)';
                    requestItem.style.opacity = '0';
                    
                    setTimeout(() => {
                        // Remove request from UI
                        requestItem.remove();
                        
                        // Check if requests list is empty
                        if (friendRequestsContainer.children.length === 0) {
                            noFriendRequests.classList.remove('hidden');
                        }
                    }, 300);
                } else {
                    // Fallback à l'API REST
                    console.log('WebSocket not available, using REST API');
                    const response = await api.friendship.rejectFriendRequest(request.id);
                    
                    if (response.success) {
                        // Animer la disparition de la demande
                        requestItem.style.transition = 'all 0.3s ease-out';
                        requestItem.style.transform = 'translateX(10px)';
                        requestItem.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Remove request from UI
                            requestItem.remove();
                            
                            // Check if requests list is empty
                            if (friendRequestsContainer.children.length === 0) {
                                noFriendRequests.classList.remove('hidden');
                            }
                        }, 300);
                    } else {
                        console.error('Failed to reject friend request:', response.message);
                        showNotification(`Erreur: ${response.message}`, 'error');
                        
                        // Réactiver les boutons en cas d'erreur
                        rejectButton.disabled = false;
                        acceptButton.disabled = false;
                        rejectButton.innerHTML = '<i class="fas fa-times mr-1.5"></i> Refuser';
                        rejectButton.classList.remove('opacity-75');
                        acceptButton.classList.remove('opacity-50');
                    }
                }
            } catch (error) {
                console.error('Error rejecting friend request:', error);
                showNotification('Une erreur est survenue', 'error');
                
                // Réactiver les boutons en cas d'erreur
                rejectButton.disabled = false;
                acceptButton.disabled = false;
                rejectButton.innerHTML = '<i class="fas fa-times mr-1.5"></i> Refuser';
                rejectButton.classList.remove('opacity-75');
                acceptButton.classList.remove('opacity-50');
            }
        });
        
        // Add to container
        friendRequestsContainer.appendChild(requestElement);
    }
    
    // Function to search for users and display results - SIMPLIFIED!
    function searchUsers(query: string) {
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Show loading state
        searchResults.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-3 text-gray-400">Recherche en cours...</span>
            </div>
        `;
        
        searchResultsContainer.classList.remove('hidden');
        
        // Perform search
        api.user.searchUsers(query).then(response => {
            // Clear loading state
            searchResults.innerHTML = '';
            
            if (response.success && response.data && response.data.length > 0) {
                // Add each user to search results
                response.data.forEach((user: any) => {
                    addSearchResultToUI(user);
                });
            } else {
                // Show no results message
                searchResults.innerHTML = `
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-search text-4xl mb-4 opacity-50"></i>
                        <p class="font-medium">Aucun utilisateur trouvé</p>
                        <p class="text-sm mt-2">Essayez avec un autre nom d'utilisateur</p>
                    </div>
                `;
            }
        }).catch(error => {
            console.error('Error searching users:', error);
            searchResults.innerHTML = `
                <div class="text-center py-8 text-red-400">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="font-medium">Erreur de recherche</p>
                    <p class="text-sm mt-2">Veuillez réessayer plus tard</p>
                </div>
            `;
        });
    }
    
    // Function to add a search result to the UI - SIMPLIFIED!
    function addSearchResultToUI(user: any) {
        const resultElement = document.importNode(searchResultTemplate.content, true);
        
        // Set user details
        const username = resultElement.querySelector('.result-username') as HTMLElement;
        const avatar = resultElement.querySelector('.result-avatar') as HTMLElement;
        const statusDiv = resultElement.querySelector('.result-status') as HTMLElement;
        const sendButton = resultElement.querySelector('.add-friend-button') as HTMLButtonElement;
        
        // Set username
        username.textContent = user.username;
        
        // Set status
        if (user.status) {
            const isOnline = user.status === 'online';
            statusDiv.innerHTML = `
                <span class="status-indicator ${isOnline ? 'bg-blue-400' : 'bg-gray-500'} w-2 h-2 rounded-full mr-2"></span>
                <span>${isOnline ? 'En ligne' : 'Hors ligne'}</span>
            `;
        }
        
        // Set avatar using consistent styling
        avatar.innerHTML = createAvatarHTML(user, 'medium');
        
        // Add user ID as data attribute
        const resultItem = resultElement.querySelector('.search-result-item') as HTMLElement;
        resultItem.dataset.id = user.id.toString();
        
        // SIMPLE CHECK: Is user already a friend?
        if (isUserAlreadyFriend(user.id)) {
            sendButton.innerHTML = '<i class="fas fa-check mr-1.5"></i> Déjà ami';
            sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            sendButton.classList.add('bg-green-600', 'cursor-not-allowed');
            sendButton.disabled = true;
        } else {
            // Can send friend request
            sendButton.addEventListener('click', async () => {
                try {
                    // Disable button to prevent multiple clicks
                    sendButton.disabled = true;
                    sendButton.classList.add('opacity-50');
                    sendButton.innerHTML = '<span class="spinner inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span> Envoi...';
                    
                    // Send friend request via WebSocket or API
                    if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                        console.log('Sending friend request via WebSocket');
                        websocketService.send('friend-request', { friendId: user.id });
                        
                        // Update button to show request sent
                        sendButton.innerHTML = '<i class="fas fa-clock mr-1.5"></i> Demande envoyée';
                        sendButton.classList.remove('bg-blue-600');
                        sendButton.classList.add('bg-yellow-600', 'cursor-not-allowed');
                        
                        showNotification(`Demande d'ami envoyée à ${user.username}`, 'success');
                    } else {
                        // Fallback à l'API REST
                        const response = await api.friendship.sendFriendRequest(user.id);
                        
                        if (response.success) {
                            sendButton.innerHTML = '<i class="fas fa-clock mr-1.5"></i> Demande envoyée';
                            sendButton.classList.remove('bg-blue-600');
                            sendButton.classList.add('bg-yellow-600', 'cursor-not-allowed');
                            
                            showNotification(`Demande d'ami envoyée à ${user.username}`, 'success');
                        } else {
                            console.error('Failed to send friend request:', response.message);
                            showNotification(`Erreur: ${response.message}`, 'error');
                            // Réactiver le bouton en cas d'erreur
                            sendButton.disabled = false;
                            sendButton.classList.remove('opacity-50');
                            sendButton.innerHTML = '<i class="fas fa-user-plus mr-1.5"></i> Ajouter';
                        }
                    }
                } catch (error) {
                    console.error('Error sending friend request:', error);
                    showNotification('Une erreur est survenue', 'error');
                    // Réactiver le bouton en cas d'erreur
                    sendButton.disabled = false;
                    sendButton.classList.remove('opacity-50');
                    sendButton.innerHTML = '<i class="fas fa-user-plus mr-1.5"></i> Ajouter';
                }
            });
        }
        
        searchResults.appendChild(resultElement);
    }
    
    // Event listener for search form submission
    if (searchUserForm) {
        searchUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameValue = searchUsername.value.trim();
            
            if (usernameValue) {
                // First check if exact username exists
                api.user.checkUsername(usernameValue)
                    .then(response => {
                        if (response.success && response.exists && response.user) {
                            // If exact username exists, send friend request directly
                            if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                                websocketService.send('friend-request', { friendId: response.user.id });
                                showNotification(`Demande d'ami envoyée à ${response.user.username}`, 'success');
                                searchUserForm.reset();
                                searchResultsContainer.classList.add('hidden');
                            } else {
                                api.friendship.sendFriendRequest(response.user.id)
                                    .then(res => {
                                        if (res.success) {
                                            showNotification(`Demande d'ami envoyée à ${response.user.username}`, 'success');
                                            searchUserForm.reset();
                                            searchResultsContainer.classList.add('hidden');
                                        } else {
                                            showNotification(res.message || 'Erreur lors de l\'envoi de la demande', 'error');
                                        }
                                    })
                                    .catch(err => {
                                        console.error('Error sending friend request:', err);
                                        showNotification('Erreur lors de l\'envoi de la demande', 'error');
                                    });
                            }
                        } else {
                            // If no exact match, show search results
                            searchUsers(usernameValue);
                        }
                    })
                    .catch(err => {
                        console.error('Error checking username:', err);
                        // Fall back to regular search
                        searchUsers(usernameValue);
                    });
            }
        });
        
        // Add keyup listener for real-time search
        if (searchUsername) {
            let debounceTimeout: NodeJS.Timeout;
            searchUsername.addEventListener('input', (e) => {
                // Clear previous timeout
                clearTimeout(debounceTimeout);
                
                const inputValue = (e.target as HTMLInputElement).value;
                
                // If input is empty, hide results
                if (!inputValue.trim()) {
                    searchResultsContainer.classList.add('hidden');
                    return;
                }
                
                // Set a debounce to avoid too many API calls
                debounceTimeout = setTimeout(() => {
                    searchUsers(inputValue);
                }, 300); // Debounce for 300ms
            });
        }
        
        // Ajouter un gestionnaire de clic pour le bouton de fermeture des résultats
        const closeButton = document.getElementById('close-search-results');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                searchResultsContainer.classList.add('hidden');
                searchUserForm.reset();
            });
        }
    }
    
    // Event listener for friends search input
    if (friendsSearch) {
        friendsSearch.addEventListener('input', () => {
            const query = friendsSearch.value.toLowerCase();
            const friendItems = friendsContainer.querySelectorAll('.friend-item');
            
            friendItems.forEach((item) => {
                const username = item.querySelector('.friend-username')?.textContent?.toLowerCase() || '';
                
                if (username.includes(query)) {
                    (item as HTMLElement).style.display = '';
                } else {
                    (item as HTMLElement).style.display = 'none';
                }
            });
            
            // Show "no results" message if all friends are hidden
            let allHidden = true;
            friendItems.forEach((item) => {
                if ((item as HTMLElement).style.display !== 'none') {
                    allHidden = false;
                }
            });
            
            if (allHidden && friendItems.length > 0) {
                // Create or update no results message
                let noResults = document.getElementById('no-search-results');
                
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.id = 'no-search-results';
                    noResults.className = 'text-center py-4 text-gray-500';
                    noResults.textContent = `Aucun ami trouvé pour "${query}"`;
                    friendsContainer.appendChild(noResults);
                } else {
                    noResults.textContent = `Aucun ami trouvé pour "${query}"`;
                    noResults.classList.remove('hidden');
                }
            } else {
                // Hide no results message if it exists
                const noResults = document.getElementById('no-search-results');
                if (noResults) {
                    noResults.classList.add('hidden');
                }
            }
        });
    }
    
    // Initial data loading
    async function initialize() {
        console.log('Initializing friends page');
        
        try {
            // Vérifier si auth service est disponible et authentifié
            if (authService && authService.isAuthenticated && authService.isAuthenticated()) {
                console.log('User is authenticated, ensuring token is available for WebSocket');
                
                // S'assurer que le token est disponible
                const token = authService.getToken();
                console.log('Token availability for WebSocket:', !!token);
                
                if (!token) {
                    console.error('No token available, auth service getToken returned null');
                    showNotification('Problème d\'authentification, veuillez vous reconnecter', 'error');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                    return;
                }
                
                // Vérifier l'état de la connexion WebSocket une seule fois
                const websocketService = (window as any).websocketService;
                if (websocketService && !websocketService.isConnected()) {
                    console.log('WebSocket service not connected, initiating connection');
                    websocketService.connect();
                } else if (websocketService && websocketService.isConnected()) {
                    console.log('WebSocket already connected');
                } else {
                    console.warn('WebSocket service not available');
                }
            }
            
            // Load friends and friend requests in parallel
            await Promise.all([
                loadFriends(),
                loadFriendRequests()
            ]);
            
            // Configurer un intervalle pour rafraîchir régulièrement les demandes d'amitié
            // Cela servira de fallback si WebSocket ne fonctionne pas
            setInterval(() => {
                console.log('Refreshing friend requests...');
                loadFriendRequests();
            }, 30000); // Rafraîchir toutes les 30 secondes au lieu de 5 pour réduire le spam
            
            console.log('Friends page initialized successfully');
        } catch (error) {
            console.error('Error initializing friends page:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        }
    }
    
    // Initialize page
    initialize();
}); 