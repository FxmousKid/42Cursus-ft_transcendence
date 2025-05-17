import { api } from './api';
import { UserProfile, MatchData } from './api';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
        // Redirect to login page if not logged in
        window.location.href = '/login.html';
        return;
    }
    
    // Profile elements
    const profileUsername = document.getElementById('profile-username') as HTMLElement;
    const profileEmail = document.getElementById('profile-email') as HTMLElement;
    const profileStatus = document.getElementById('profile-status') as HTMLElement;
    const profileAvatar = document.getElementById('profile-avatar') as HTMLElement;
    
    // Stats elements
    const statsGamesPlayed = document.getElementById('stats-games-played') as HTMLElement;
    const statsWins = document.getElementById('stats-wins') as HTMLElement;
    const statsLosses = document.getElementById('stats-losses') as HTMLElement;
    const statsRatio = document.getElementById('stats-ratio') as HTMLElement;
    
    // Matches elements
    const matchesContainer = document.getElementById('matches-container') as HTMLElement;
    const noMatches = document.getElementById('no-matches') as HTMLElement;
    const matchTemplate = document.getElementById('match-template') as HTMLTemplateElement;
    
    // Edit profile elements
    const editProfileButton = document.getElementById('edit-profile-button') as HTMLElement;
    const editProfileModal = document.getElementById('edit-profile-modal') as HTMLElement;
    const editProfileForm = document.getElementById('edit-profile-form') as HTMLFormElement;
    const editUsername = document.getElementById('edit-username') as HTMLInputElement;
    const editEmail = document.getElementById('edit-email') as HTMLInputElement;
    const editAvatar = document.getElementById('edit-avatar') as HTMLInputElement;
    const cancelEditButton = document.getElementById('cancel-edit') as HTMLElement;
    const editErrorMessage = document.getElementById('edit-error-message') as HTMLElement;
    const editErrorText = document.getElementById('edit-error-text') as HTMLElement;
    
    // Load user profile
    try {
        const profileResponse = await api.user.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
            const profile = profileResponse.data;
            
            // Display profile info
            profileUsername.textContent = profile.username;
            profileEmail.textContent = profile.email;
            profileStatus.textContent = profile.status || 'offline';
            
            // Display avatar if available
            if (profile.avatar_url) {
                profileAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="${profile.username}" class="w-full h-full object-cover">`;
            }
            
            // Set form values for editing
            editUsername.value = profile.username;
            editEmail.value = profile.email;
            editAvatar.value = profile.avatar_url || '';
            
            // Set status color
            if (profile.status === 'online') {
                profileStatus.classList.add('text-green-600');
            } else if (profile.status === 'in_game') {
                profileStatus.classList.add('text-blue-600');
            } else {
                profileStatus.classList.add('text-gray-600');
            }
        } else {
            console.error('Failed to load profile:', profileResponse.message);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
    
    // Load matches
    try {
        const matchesResponse = await api.user.getMatches();
        
        if (matchesResponse.success && matchesResponse.data) {
            const matches = matchesResponse.data;
            
            if (matches.length > 0) {
                // Hide no matches message
                noMatches.classList.add('hidden');
                
                // Calculate stats
                let wins = 0;
                let losses = 0;
                
                // Display matches
                matches.forEach(match => {
                    // Determine if current user is player1 or player2
                    const isPlayer1 = match.player1_id.toString() === userId;
                    const currentPlayerScore = isPlayer1 ? match.player1_score : match.player2_score;
                    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
                    const opponentUsername = isPlayer1 ? match.player2_username : match.player1_username;
                    
                    // Determine if match was won or lost
                    const isWin = currentPlayerScore > opponentScore;
                    if (isWin) wins++;
                    else losses++;
                    
                    // Create match element from template
                    const matchElement = document.importNode(matchTemplate.content, true);
                    
                    // Set match details
                    const resultIndicator = matchElement.querySelector('.match-result-indicator') as HTMLElement;
                    const opponent = matchElement.querySelector('.match-opponent') as HTMLElement;
                    const date = matchElement.querySelector('.match-date') as HTMLElement;
                    const score = matchElement.querySelector('.match-score') as HTMLElement;
                    
                    // Set result indicator color
                    resultIndicator.classList.add(isWin ? 'bg-green-500' : 'bg-red-500');
                    
                    // Set text content
                    opponent.textContent = opponentUsername || 'Adversaire inconnu';
                    score.textContent = `${currentPlayerScore} - ${opponentScore}`;
                    
                    // Format date
                    const matchDate = new Date(match.created_at);
                    date.textContent = matchDate.toLocaleDateString();
                    
                    // Add match to container
                    matchesContainer.appendChild(matchElement);
                });
                
                // Update stats
                const total = wins + losses;
                statsGamesPlayed.textContent = total.toString();
                statsWins.textContent = wins.toString();
                statsLosses.textContent = losses.toString();
                statsRatio.textContent = total > 0 ? (wins / total).toFixed(2) : '0.00';
            }
        } else {
            console.error('Failed to load matches:', matchesResponse.message);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
    }
    
    // Edit profile functionality
    editProfileButton.addEventListener('click', () => {
        editProfileModal.classList.remove('hidden');
    });
    
    cancelEditButton.addEventListener('click', () => {
        editProfileModal.classList.add('hidden');
        editErrorMessage.classList.add('hidden');
    });
    
    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
            const updateData = {
                username: editUsername.value,
                email: editEmail.value,
                avatar_url: editAvatar.value || undefined
            };
            
            const response = await api.user.updateProfile(updateData);
            
            if (response.success && response.data) {
                // Update displayed profile
                profileUsername.textContent = response.data.username;
                profileEmail.textContent = response.data.email;
                
                // Update avatar if available
                if (response.data.avatar_url) {
                    profileAvatar.innerHTML = `<img src="${response.data.avatar_url}" alt="${response.data.username}" class="w-full h-full object-cover">`;
                }
                
                // Update localStorage if username changed
                if (localStorage.getItem('username') !== response.data.username) {
                    localStorage.setItem('username', response.data.username);
                }
                
                // Close modal
                editProfileModal.classList.add('hidden');
                
                // Reload page to reflect changes
                window.location.reload();
            } else {
                // Show error message
                editErrorText.textContent = response.message || 'Erreur lors de la mise à jour du profil.';
                editErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            editErrorText.textContent = 'Erreur de connexion au serveur.';
            editErrorMessage.classList.remove('hidden');
        }
    });
    
    // Close modal when clicking outside
    editProfileModal.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            editProfileModal.classList.add('hidden');
            editErrorMessage.classList.add('hidden');
        }
    });
}); 