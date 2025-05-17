import { api } from './api';
import { websocketService } from './websocket';
import { Friend, FriendRequest, UserProfile } from './api';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '/login.html';
        return;
    }
    
    // Connect to WebSocket for real-time updates
    websocketService.connect();
    
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
                    friends.forEach(friend => {
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
    function addFriendToUI(friend: Friend) {
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
                }
            } catch (error) {
                console.error('Error removing friend:', error);
            }
        });
        
        // Add event listener to invite button
        inviteButton.addEventListener('click', () => {
            // Send game invitation via WebSocket
            websocketService.send('game-invite', { 
                friendId: friend.id, 
                friendUsername: friend.username 
            });
            
            alert(`Invitation à jouer envoyée à ${friend.username}`);
        });
        
        // Add to container
        friendsContainer.appendChild(friendElement);
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
                    requests.forEach(request => {
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
    function addFriendRequestToUI(request: FriendRequest) {
        if (!request.user) return;
        
        const requestElement = document.importNode(friendRequestTemplate.content, true);
        
        // Set request details
        const username = requestElement.querySelector('.request-username') as HTMLElement;
        const avatar = requestElement.querySelector('.request-avatar') as HTMLElement;
        const date = requestElement.querySelector('.request-date') as HTMLElement;
        const acceptButton = requestElement.querySelector('.accept-request-button') as HTMLElement;
        const rejectButton = requestElement.querySelector('.reject-request-button') as HTMLElement;
        
        // Set username and date
        username.textContent = request.user.username;
        
        // Format date
        const requestDate = new Date(request.user.created_at || new Date());
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
                }
            } catch (error) {
                console.error('Error accepting friend request:', error);
            }
        });
        
        // Add event listener to reject button
        rejectButton.addEventListener('click', async () => {
            try {
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
                }
            } catch (error) {
                console.error('Error rejecting friend request:', error);
            }
        });
        
        // Add to container
        friendRequestsContainer.appendChild(requestElement);
    }
    
    // Function to search for users
    async function searchUsers(username: string) {
        try {
            // Call users search API
            const response = await fetch(`${api['baseUrl'] || 'http://localhost:3000'}/users/search?username=${encodeURIComponent(username)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                searchResultsContainer.classList.remove('hidden');
                searchResults.innerHTML = '';
                searchError.classList.add('hidden');
                
                if (data.data.length > 0) {
                    data.data.forEach((user: UserProfile) => {
                        addSearchResultToUI(user);
                    });
                } else {
                    searchResults.innerHTML = '<p class="text-center py-4 text-gray-500">Aucun utilisateur trouvé</p>';
                }
            } else {
                searchError.classList.remove('hidden');
                searchErrorText.textContent = data.message || 'Erreur lors de la recherche d\'utilisateurs';
                searchResultsContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error searching users:', error);
            searchError.classList.remove('hidden');
            searchErrorText.textContent = 'Erreur de connexion au serveur';
            searchResultsContainer.classList.add('hidden');
        }
    }
    
    // Function to add a search result to the UI
    function addSearchResultToUI(user: UserProfile) {
        const resultElement = document.importNode(searchResultTemplate.content, true);
        
        // Set user details
        const username = resultElement.querySelector('.result-username') as HTMLElement;
        const avatar = resultElement.querySelector('.result-avatar') as HTMLElement;
        const statusIndicator = resultElement.querySelector('.result-status-indicator') as HTMLElement;
        const status = resultElement.querySelector('.result-status') as HTMLElement;
        const addButton = resultElement.querySelector('.add-friend-button') as HTMLButtonElement;
        
        // Set username
        username.textContent = user.username;
        
        // Set avatar if available
        if (user.avatar_url) {
            avatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" class="w-full h-full object-cover">`;
        }
        
        // Set status indicator color and text
        if (user.status === 'online') {
            statusIndicator.classList.add('bg-green-500');
            status.textContent = 'En ligne';
        } else if (user.status === 'in_game') {
            statusIndicator.classList.add('bg-blue-500');
            status.textContent = 'En jeu';
        } else {
            statusIndicator.classList.add('bg-gray-500');
            status.textContent = 'Hors ligne';
        }
        
        // Add user ID as data attribute
        const resultItem = resultElement.querySelector('.search-result-item') as HTMLElement;
        resultItem.dataset.id = user.id.toString();
        
        // Add event listener to add button
        addButton.addEventListener('click', async () => {
            try {
                const response = await api.friendship.sendFriendRequest(user.id);
                
                if (response.success) {
                    // Disable add button and change text
                    addButton.disabled = true;
                    addButton.textContent = 'Demande envoyée';
                    addButton.classList.add('bg-gray-500');
                    addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                } else {
                    console.error('Failed to send friend request:', response.message);
                    alert(`Erreur: ${response.message || 'Impossible d\'envoyer la demande d\'ami'}`);
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                alert('Erreur de connexion au serveur');
            }
        });
        
        // Add to container
        searchResults.appendChild(resultElement);
    }
    
    // Filter friends functionality
    friendsSearch.addEventListener('input', () => {
        const searchTerm = friendsSearch.value.toLowerCase();
        const friendItems = friendsContainer.querySelectorAll('.friend-item');
        
        friendItems.forEach(item => {
            const username = item.querySelector('.friend-username')?.textContent?.toLowerCase() || '';
            
            if (username.includes(searchTerm)) {
                (item as HTMLElement).style.display = '';
            } else {
                (item as HTMLElement).style.display = 'none';
            }
        });
    });
    
    // Search form submission
    searchUserForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = searchUsername.value.trim();
        
        if (username) {
            searchUsers(username);
        } else {
            searchError.classList.remove('hidden');
            searchErrorText.textContent = 'Veuillez entrer un nom d\'utilisateur';
            searchResultsContainer.classList.add('hidden');
        }
    });
    
    // Listen for friend request events via WebSocket
    websocketService.on('friend-request-received', (data) => {
        loadFriendRequests();
    });
    
    websocketService.on('friend-request-accepted', (data) => {
        loadFriends();
    });
    
    websocketService.on('online-users', (data) => {
        // Update status of friends in the UI
        const friendItems = friendsContainer.querySelectorAll('.friend-item');
        
        friendItems.forEach(item => {
            const friendId = parseInt((item as HTMLElement).dataset.id || '0');
            
            if (data.includes(friendId)) {
                const statusIndicator = item.querySelector('.friend-status-indicator') as HTMLElement;
                const status = item.querySelector('.friend-status') as HTMLElement;
                
                statusIndicator.className = 'friend-status-indicator w-2 h-2 rounded-full mr-1 bg-green-500';
                status.textContent = 'En ligne';
            }
        });
    });
    
    // Initial loading
    loadFriends();
    loadFriendRequests();
}); 