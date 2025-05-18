// This file will be compiled to JS and included in the HTML directly
// Global services and types will be available

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Friends page loaded');
    
    // Get services from global scope
    const api = (window as any).api;
    const websocketService = (window as any).websocketService;
    console.log('API available:', !!api);
    console.log('WebSocket service available:', !!websocketService);
    
    // Check if API is available
    if (!api || !api.friendship) {
        console.error('API or friendship module not available');
        window.location.href = '/login.html';
        return;
    }
    
    // Connect to WebSocket if available
    if (websocketService && websocketService.connect) {
        console.log('Connecting to WebSocket');
        websocketService.connect();
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        console.log('No auth token, redirecting to login');
        window.location.href = '/login.html';
        return;
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
    if (websocketService && websocketService.onMessage) {
        websocketService.onMessage('friend-request', (data: any) => {
            console.log('Received friend request:', data);
            loadFriendRequests(); // Refresh requests
        });
        
        websocketService.onMessage('friend-accepted', (data: any) => {
            console.log('Friend request accepted:', data);
            loadFriends(); // Refresh friends list
        });
        
        websocketService.onMessage('friend-status-changed', (data: any) => {
            console.log('Friend status changed:', data);
            updateFriendStatus(data.userId, data.status);
        });
    }
    
    // Function to update friend status in UI
    function updateFriendStatus(userId: number, newStatus: string) {
        const friendItem = document.querySelector(`.friend-item[data-id="${userId}"]`);
        if (!friendItem) return;
        
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
        const addButton = resultElement.querySelector('.add-friend-button') as HTMLElement;
        
        // Set username
        username.textContent = user.username;
        
        // Set avatar if available
        if (user.avatar_url) {
            avatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" class="w-full h-full object-cover">`;
        }
        
        // Add user ID as data attribute
        const resultItem = resultElement.querySelector('.search-result-item') as HTMLElement;
        resultItem.dataset.id = user.id.toString();
        
        // Add event listener to add button
        addButton.addEventListener('click', async () => {
            try {
                // Disable button to prevent multiple clicks
                (addButton as HTMLButtonElement).disabled = true;
                addButton.innerHTML = `
                    <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                `;
                
                // Send friend request via API
                const response = await api.friendship.sendFriendRequest(user.id);
                
                if (response.success) {
                    // Update button to show success
                    addButton.innerHTML = `
                        <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    `;
                    addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    addButton.classList.add('bg-gray-300', 'cursor-not-allowed');
                } else {
                    // Reset button and show error
                    (addButton as HTMLButtonElement).disabled = false;
                    addButton.innerHTML = `<span>Ajouter</span>`;
                    
                    throw new Error(response.message || 'Failed to send friend request');
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                
                // Show error message
                searchError.classList.remove('hidden');
                searchErrorText.textContent = 'Erreur lors de l\'envoi de la demande d\'ami.';
                
                // Hide error after 3 seconds
                setTimeout(() => {
                    searchError.classList.add('hidden');
                }, 3000);
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
    
    // Initial loading
    loadFriends();
    loadFriendRequests();
}); 