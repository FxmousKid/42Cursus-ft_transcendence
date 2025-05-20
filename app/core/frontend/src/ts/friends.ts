// This file will be compiled to JS and included in the HTML directly
// Global services and types will be available

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Friends page loaded');
    
    // Get services from global scope
    const api = (window as any).api;
    const websocketService = (window as any).websocketService;
    const authService = (window as any).authService;
    
    console.log('API available:', !!api);
    console.log('WebSocket service available:', !!websocketService);
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
    
    // Connect to WebSocket if available
    if (websocketService && websocketService.connect) {
        console.log('Connecting to WebSocket');
        websocketService.connect();
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
        console.log('Setting up WebSocket event handlers');
        
        // Écouteur pour recevoir une demande d'ami
        websocketService.on('friend-request-received', (data: any) => {
            console.log('Received friend request via WebSocket:', data);
            // Recharger les demandes d'amitié en attente
            loadFriendRequests();
            // Afficher une notification
            showNotification(`Nouvelle demande d'ami de ${data.username || 'Quelqu\'un'}`);
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
                    sendButton.classList.add('bg-green-600', 'cursor-not-allowed');
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
        websocketService.on('friendship-removed', (data: any) => {
            console.log('Friendship removed via WebSocket:', data);
            
            if (data.user_id) {
                // Si on est notifié qu'un ami nous a retiré
                showNotification(`${data.username || 'Un utilisateur'} vous a retiré de sa liste d'amis`, 'info');
                loadFriends(); // Rafraîchir la liste d'amis
            } else if (data.friend_id) {
                // Confirmation de notre suppression
                showNotification(`Ami supprimé avec succès`, 'success');
            }
        });
        
        // Écouteur pour les changements de statut d'amis
        websocketService.on('friend-status-changed', (data: any) => {
            console.log('Friend status changed via WebSocket:', data);
            updateFriendStatus(data.id, data.status);
        });
        
        // Écoute des erreurs generales
        websocketService.on('error', (data: any) => {
            console.error('Error from WebSocket:', data);
            if (data.message) {
                showNotification(`Erreur: ${data.message}`, 'error');
            }
        });
    } else {
        console.warn('WebSocket service not available for event handling');
    }
    
    // Function to show notification
    function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
        // Créer un élément de notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-xs z-50 ${
            type === 'error' ? 'bg-red-600 text-white' :
            type === 'success' ? 'bg-green-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        // Ajouter au body
        document.body.appendChild(notification);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
    
    // Function to update friend status in UI
    function updateFriendStatus(userId: number, newStatus: string) {
        console.log(`Updating friend status for user ${userId} to ${newStatus}`);
        const friendItem = document.querySelector(`.friend-item[data-id="${userId}"]`);
        if (!friendItem) {
            console.warn(`Friend item with id ${userId} not found in the DOM`);
            return;
        }
        
        const statusIndicator = friendItem.querySelector('.friend-status-indicator') as HTMLElement;
        const status = friendItem.querySelector('.friend-status') as HTMLElement;
        
        // Remove existing status classes
        statusIndicator.classList.remove('bg-green-500', 'bg-blue-500', 'bg-gray-500');
        
        // Set new status
        if (newStatus === 'online') {
            statusIndicator.classList.add('bg-green-500');
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
    
    // Function to add a friend to the UI
    function addFriendToUI(friend: any) {
        const friendElement = document.importNode(friendTemplate.content, true);
        
        // Set friend details
        const username = friendElement.querySelector('.friend-username') as HTMLElement;
        const avatar = friendElement.querySelector('.friend-avatar') as HTMLElement;
        const statusIndicator = friendElement.querySelector('.friend-status-indicator') as HTMLElement;
        const status = friendElement.querySelector('.friend-status') as HTMLElement;
        const inviteButton = friendElement.querySelector('.invite-game-button') as HTMLElement;
        const removeButton = friendElement.querySelector('.remove-friend-button') as HTMLElement;
        
        // Set username
        username.textContent = friend.username;
        
        // Set avatar if available
        if (friend.avatar_url) {
            avatar.innerHTML = `<img src="${friend.avatar_url}" alt="${friend.username}" class="w-full h-full object-cover">`;
        }
        
        // Set status indicator color and text
        if (friend.status === 'online') {
            statusIndicator.classList.add('bg-green-500');
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
        
        // Add event listener to remove button
        removeButton.addEventListener('click', async () => {
            try {
                if (confirm(`Êtes-vous sûr de vouloir supprimer ${friend.username} de votre liste d'amis ?`)) {
                    // Utiliser WebSocket si disponible
                    const websocketService = (window as any).websocketService;
                    if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                        console.log('Removing friend via WebSocket');
                        websocketService.send('remove-friendship', { friendId: friend.id });
                        
                        // Remove friend from UI
                        const friendElement = document.querySelector(`.friend-item[data-id="${friend.id}"]`);
                        if (friendElement) {
                            friendElement.remove();
                        }
                        
                        // Check if friends list is empty
                        if (friendsContainer.children.length === 0) {
                            noFriends.classList.remove('hidden');
                        }
                    } else {
                        // Fallback à l'API REST
                        console.log('WebSocket not available, using REST API');
                        const response = await api.friendship.removeFriend(friend.id);
                        
                        if (response.success) {
                            // Remove friend from UI
                            const friendElement = document.querySelector(`.friend-item[data-id="${friend.id}"]`);
                            if (friendElement) {
                                friendElement.remove();
                            }
                            
                            // Check if friends list is empty
                            if (friendsContainer.children.length === 0) {
                                noFriends.classList.remove('hidden');
                            }
                        } else {
                            console.error('Failed to remove friend:', response.message);
                            alert(`Erreur: ${response.message}`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error removing friend:', error);
                alert('Une erreur est survenue');
            }
        });
        
        // Add event listener to invite button
        inviteButton.addEventListener('click', () => {
            // Send game invitation via API
            sendGameInvitation(friend.id, friend.username);
        });
        
        // Add to container
        friendsContainer.appendChild(friendElement);
    }
    
    // Function to send game invitation
    function sendGameInvitation(friendId: number, friendUsername: string) {
        // Check if websocket available
        const websocketService = (window as any).websocketService;
        
        if (websocketService && websocketService.send) {
            // Send game invitation via WebSocket
            websocketService.send('game-invite', { 
                friendId: friendId, 
                friendUsername: friendUsername 
            });
            
            alert(`Invitation à jouer envoyée à ${friendUsername}`);
        } else {
            // Fallback to API
            api.game.sendInvitation(friendId)
                .then((response: any) => {
                    if (response.success) {
                        alert(`Invitation à jouer envoyée à ${friendUsername}`);
                    } else {
                        alert(`Erreur lors de l'envoi de l'invitation: ${response.message}`);
                    }
                })
                .catch((error: any) => {
                    console.error('Error sending game invitation:', error);
                    alert("Erreur lors de l'envoi de l'invitation");
                });
        }
    }
    
    // Function to load friend requests
    async function loadFriendRequests() {
        try {
            const response = await api.friendship.getPendingRequests();
            
            if (response.success && response.data) {
                const requests = response.data;
                
                if (requests.length > 0) {
                    // Hide no requests message
                    noFriendRequests.classList.add('hidden');
                    friendRequestsContainer.innerHTML = '';
                    
                    // Add each request to the container
                    requests.forEach((request: any) => {
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
        if (!request.user) return;
        
        const requestElement = document.importNode(friendRequestTemplate.content, true);
        
        // Set request details
        const username = requestElement.querySelector('.request-username') as HTMLElement;
        const avatar = requestElement.querySelector('.request-avatar') as HTMLElement;
        const date = requestElement.querySelector('.request-date') as HTMLElement;
        const acceptButton = requestElement.querySelector('.accept-request-button') as HTMLButtonElement;
        const rejectButton = requestElement.querySelector('.reject-request-button') as HTMLButtonElement;
        
        // Set username and date
        username.textContent = request.user.username;
        
        // Format date
        const requestDate = new Date(request.created_at || new Date());
        date.textContent = `Demande reçue le ${requestDate.toLocaleDateString()}`;
        
        // Set avatar if available
        if (request.user.avatar_url) {
            avatar.innerHTML = `<img src="${request.user.avatar_url}" alt="${request.user.username}" class="w-full h-full object-cover">`;
        }
        
        // Add request ID as data attribute
        const requestItem = requestElement.querySelector('.friend-request-item') as HTMLElement;
        requestItem.dataset.id = request.id.toString();
        
        // Add event listener to accept button
        acceptButton.addEventListener('click', async () => {
            try {
                // Désactiver le bouton pour éviter les clics multiples
                acceptButton.disabled = true;
                acceptButton.classList.add('opacity-50');
                
                // Utiliser WebSocket si disponible
                const websocketService = (window as any).websocketService;
                if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                    console.log('Accepting friend request via WebSocket');
                    websocketService.send('friend-request-response', { 
                        friendId: request.user_id, 
                        accept: true 
                    });
                    
                    // Remove request from UI
                    requestItem.remove();
                    
                    // Check if requests list is empty
                    if (friendRequestsContainer.children.length === 0) {
                        noFriendRequests.classList.remove('hidden');
                    }
                    
                    // Reload friends list
                    loadFriends();
                } else {
                    // Fallback à l'API REST
                    console.log('WebSocket not available, using REST API');
                    const response = await api.friendship.acceptFriendRequest(request.id);
                    
                    if (response.success) {
                        // Remove request from UI
                        requestItem.remove();
                        
                        // Check if requests list is empty
                        if (friendRequestsContainer.children.length === 0) {
                            noFriendRequests.classList.remove('hidden');
                        }
                        
                        // Reload friends list
                        loadFriends();
                    } else {
                        console.error('Failed to accept friend request:', response.message);
                        alert(`Erreur: ${response.message}`);
                        // Réactiver le bouton en cas d'erreur
                        acceptButton.disabled = false;
                        acceptButton.classList.remove('opacity-50');
                    }
                }
            } catch (error) {
                console.error('Error accepting friend request:', error);
                alert('Une erreur est survenue');
                // Réactiver le bouton en cas d'erreur
                acceptButton.disabled = false;
                acceptButton.classList.remove('opacity-50');
            }
        });
        
        // Add event listener to reject button
        rejectButton.addEventListener('click', async () => {
            try {
                // Désactiver le bouton pour éviter les clics multiples
                rejectButton.disabled = true;
                rejectButton.classList.add('opacity-50');
                
                // Utiliser WebSocket si disponible
                const websocketService = (window as any).websocketService;
                if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                    console.log('Rejecting friend request via WebSocket');
                    websocketService.send('friend-request-response', { 
                        friendId: request.user_id, 
                        accept: false 
                    });
                    
                    // Remove request from UI
                    requestItem.remove();
                    
                    // Check if requests list is empty
                    if (friendRequestsContainer.children.length === 0) {
                        noFriendRequests.classList.remove('hidden');
                    }
                } else {
                    // Fallback à l'API REST
                    console.log('WebSocket not available, using REST API');
                    const response = await api.friendship.rejectFriendRequest(request.id);
                    
                    if (response.success) {
                        // Remove request from UI
                        requestItem.remove();
                        
                        // Check if requests list is empty
                        if (friendRequestsContainer.children.length === 0) {
                            noFriendRequests.classList.remove('hidden');
                        }
                    } else {
                        console.error('Failed to reject friend request:', response.message);
                        alert(`Erreur: ${response.message}`);
                        // Réactiver le bouton en cas d'erreur
                        rejectButton.disabled = false;
                        rejectButton.classList.remove('opacity-50');
                    }
                }
            } catch (error) {
                console.error('Error rejecting friend request:', error);
                alert('Une erreur est survenue');
                // Réactiver le bouton en cas d'erreur
                rejectButton.disabled = false;
                rejectButton.classList.remove('opacity-50');
            }
        });
        
        // Add to container
        friendRequestsContainer.appendChild(requestElement);
    }
    
    // Function to search for users
    async function searchUsers(username: string) {
        try {
            searchResults.innerHTML = '';
            
            if (!username.trim()) {
                searchResultsContainer.classList.add('hidden');
                return;
            }
            
            // Show loading state
            searchResults.innerHTML = `
                <div class="text-center py-4">
                    <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            `;
            searchResultsContainer.classList.remove('hidden');
            
            // Search users via API
            const response = await api.user.searchUsers(username);
            
            if (response.success) {
                const data = response.data;
                searchResults.innerHTML = '';
                
                if (data.length > 0) {
                    data.forEach((user: any) => {
                        addSearchResultToUI(user);
                    });
                } else {
                    searchResults.innerHTML = `
                        <div class="text-center py-4 text-gray-500">
                            Aucun utilisateur trouvé pour "${username}"
                        </div>
                    `;
                }
            } else {
                throw new Error(response.message || 'Failed to search users');
            }
        } catch (error) {
            console.error('Error searching users:', error);
            searchError.classList.remove('hidden');
            searchErrorText.textContent = 'Erreur lors de la recherche. Veuillez réessayer.';
            
            // Hide error after 3 seconds
            setTimeout(() => {
                searchError.classList.add('hidden');
            }, 3000);
        }
    }
    
    // Function to add a search result to the UI
    function addSearchResultToUI(user: any) {
        const resultElement = document.importNode(searchResultTemplate.content, true);
        
        // Set user details
        const username = resultElement.querySelector('.result-username') as HTMLElement;
        const avatar = resultElement.querySelector('.result-avatar') as HTMLElement;
        const sendButton = resultElement.querySelector('.add-friend-button') as HTMLButtonElement;
        
        // Set username
        username.textContent = user.username;
        
        // Set avatar if available
        if (user.avatar_url) {
            avatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" class="w-full h-full object-cover">`;
        }
        
        // Add user ID as data attribute
        const resultItem = resultElement.querySelector('.search-result-item') as HTMLElement;
        resultItem.dataset.id = user.id.toString();
        
        // Add event listener to send button
        sendButton.addEventListener('click', async () => {
            try {
                // Check if user ID is available
                if (!user.id) {
                    console.error('User ID not found');
                    return;
                }
                
                // Désactiver le bouton pour éviter les clics multiples
                sendButton.disabled = true;
                sendButton.classList.add('opacity-50');
                
                // Utiliser WebSocket si disponible
                const websocketService = (window as any).websocketService;
                if (websocketService && websocketService.isConnected && websocketService.isConnected()) {
                    console.log('Sending friend request via WebSocket');
                    websocketService.send('friend-request', { friendId: user.id });
                    
                    // Marquer le bouton comme "Demande envoyée"
                    sendButton.innerHTML = '<i class="fas fa-check mr-2"></i> Demande envoyée';
                    sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    sendButton.classList.add('bg-green-600', 'cursor-not-allowed');
                } else {
                    // Fallback à l'API REST
                    console.log('WebSocket not available, using REST API');
                    const response = await api.friendship.sendFriendRequest(user.id);
                    
                    if (response.success) {
                        // Marquer le bouton comme "Demande envoyée"
                        sendButton.innerHTML = '<i class="fas fa-check mr-2"></i> Demande envoyée';
                        sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                        sendButton.classList.add('bg-green-600', 'cursor-not-allowed');
                    } else {
                        console.error('Failed to send friend request:', response.message);
                        alert(`Erreur: ${response.message}`);
                        // Réactiver le bouton en cas d'erreur
                        sendButton.disabled = false;
                        sendButton.classList.remove('opacity-50');
                    }
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                alert('Une erreur est survenue');
                // Réactiver le bouton en cas d'erreur
                sendButton.disabled = false;
                sendButton.classList.remove('opacity-50');
            }
        });
        
        // Add to container
        searchResults.appendChild(resultElement);
    }
    
    // Event listener for search form submission
    if (searchUserForm) {
        searchUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            searchUsers(searchUsername.value);
        });
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
            // Vérifier l'état de la connexion WebSocket
            const websocketService = (window as any).websocketService;
            if (websocketService) {
                console.log('WebSocket service status on page load:', 
                    websocketService.isConnected ? 
                    (websocketService.isConnected() ? 'Connected' : 'Disconnected') : 
                    'Function not available');
                
                // Si pas connecté, essayer de se connecter
                if (websocketService.isConnected && !websocketService.isConnected()) {
                    console.log('Attempting to reconnect WebSocket on page load');
                    websocketService.connect();
                }
            }
            
            // Load friends and friend requests in parallel
            await Promise.all([
                loadFriends(),
                loadFriendRequests()
            ]);
            
            console.log('Friends page initialized successfully');
        } catch (error) {
            console.error('Error initializing friends page:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        }
    }
    
    // Initialize page
    initialize();
}); 