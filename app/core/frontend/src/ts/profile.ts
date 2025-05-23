import { api, getAvatarUrl } from './api';

// Interface pour les données de match
interface MatchData {
    id: number;
    player1_id: number;
    player2_id: number;
    player1_username: string;
    player2_username: string;
    player1_score: number;
    player2_score: number;
    winner_id?: number;
    status?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Script pour gérer la page de profil
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');
    
    // Obtenir l'instance du service d'authentification
    const authService = (window as any).authService;
    console.log('Auth service available:', !!authService);
    
    // Vérifier l'état d'authentification
    const isAuthenticated = authService && authService.isAuthenticated && authService.isAuthenticated();
    console.log('User is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
        console.log('User is not authenticated, should be redirected by route-guard.js');
        return;
    }
    
    // Si l'utilisateur est authentifié, charger les données du profil
    console.log('Loading profile data for authenticated user');
    
    // Remplir les informations de base du profil
    const profileUsername = authService.getUsername();
    const userId = authService.getUserId();
    
    console.log('Profile data:', { username: profileUsername, userId });
    
    const usernameElement = document.getElementById('profile-username');
    if (usernameElement) {
        usernameElement.textContent = profileUsername || 'Utilisateur';
    }
    
    // Obtenir l'instance de l'API
    const api = (window as any).api;
    const getAvatarUrl = (window as any).getAvatarUrl;
    if (!api || !api.user) {
        console.error('API not available');
        return;
    }
    
    // Profile elements
    const profileUsernameElement = document.getElementById('profile-username') as HTMLElement;
    const profileEmail = document.getElementById('profile-email') as HTMLElement;
    const profileStatus = document.getElementById('profile-status') as HTMLElement;
    const profileAvatar = document.getElementById('profile-avatar') as HTMLElement;
    const avatarUploadInput = document.getElementById('avatar-upload-input') as HTMLInputElement;
    const removeAvatarButton = document.getElementById('remove-avatar-button') as HTMLButtonElement;
    
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
    
    // Delete account elements
    const deleteAccountButton = document.getElementById('delete-account-button') as HTMLElement;
    const deleteAccountModal = document.getElementById('delete-account-modal') as HTMLElement;
    const confirmDeleteButton = document.getElementById('confirm-delete') as HTMLButtonElement;
    const cancelDeleteButton = document.getElementById('cancel-delete') as HTMLElement;
    const deleteErrorMessage = document.getElementById('delete-error-message') as HTMLElement;
    const deleteErrorText = document.getElementById('delete-error-text') as HTMLElement;
    
    // Upload status elements
    const uploadStatus = document.getElementById('upload-status') as HTMLElement;
    const uploadStatusText = document.getElementById('upload-status-text') as HTMLElement;
    
    // Current user data
    let currentUserData: any = null;
    
    // Utiliser les données du localStorage pour afficher des informations de base
    // même si le backend n'est pas disponible
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email') || '';
    const avatarUrl = localStorage.getItem('avatar_url');
    
    // Afficher les informations de base depuis localStorage
    if (username) {
        profileUsernameElement.textContent = username;
        profileStatus.textContent = 'offline';
        profileStatus.classList.add('text-gray-600');
        
        // Pré-remplir les champs du formulaire
        editUsername.value = username;
        editEmail.value = email;
        editAvatar.value = avatarUrl || '';
        
        // Afficher l'avatar si disponible
        if (avatarUrl) {
            updateAvatarDisplay({ id: parseInt(userId), avatar_url: avatarUrl, has_avatar_data: false });
        }
    }
    
    // Charger les données complètes du profil
    loadProfileData();
    
    // Charger les matchs
    loadMatches();
    
    // Gérer le clic sur l'avatar pour upload
    if (profileAvatar && avatarUploadInput) {
        profileAvatar.addEventListener('click', () => {
            avatarUploadInput.click();
        });
        
        // Gérer la sélection de fichier
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Gérer le bouton de suppression d'avatar
    if (removeAvatarButton) {
        removeAvatarButton.addEventListener('click', handleRemoveAvatar);
    }
    
    // Gérer le bouton d'édition de profil
    if (editProfileButton && editProfileModal) {
        editProfileButton.addEventListener('click', () => {
            editProfileModal.classList.remove('hidden');
        });
    }
    
    if (cancelEditButton && editProfileModal) {
        cancelEditButton.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
            if (editErrorMessage) {
                editErrorMessage.classList.add('hidden');
            }
        });
    }
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitProfileEdit();
        });
    }
    
    // Gérer le bouton de suppression de compte
    if (deleteAccountButton && deleteAccountModal) {
        deleteAccountButton.addEventListener('click', () => {
            deleteAccountModal.classList.remove('hidden');
        });
    }
    
    if (cancelDeleteButton && deleteAccountModal) {
        cancelDeleteButton.addEventListener('click', () => {
            deleteAccountModal.classList.add('hidden');
            if (deleteErrorMessage) {
                deleteErrorMessage.classList.add('hidden');
            }
        });
    }
    
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', () => {
            deleteAccount();
        });
    }
    
    // Fonction pour mettre à jour l'affichage de l'avatar
    function updateAvatarDisplay(userData: { id: number; avatar_url?: string; has_avatar_data?: boolean }) {
        if (!profileAvatar) return;
        
        const avatarUrl = getAvatarUrl ? getAvatarUrl(userData) : '';
        
        if (avatarUrl) {
            profileAvatar.innerHTML = `
                <img src="${avatarUrl}" alt="${username}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            `;
        } else {
            // Default avatar with upload icon
            profileAvatar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            `;
        }
        
        // Show/hide remove button based on whether user has uploaded avatar
        if (removeAvatarButton) {
            if (userData.has_avatar_data) {
                removeAvatarButton.classList.remove('hidden');
            } else {
                removeAvatarButton.classList.add('hidden');
            }
        }
    }
    
    // Fonction pour gérer l'upload d'avatar
    async function handleAvatarUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showUploadStatus('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.', false);
            return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showUploadStatus('Le fichier est trop volumineux. Taille maximale: 2MB.', false);
            return;
        }
        
        // Show loading state
        showUploadStatus('Téléchargement en cours...', true, true);
        
        try {
            const response = await api.user.uploadAvatar(file);
            
            if (response.success) {
                showUploadStatus('Avatar mis à jour avec succès!', true);
                // Reload profile data to get updated avatar info
                await loadProfileData();
            } else {
                showUploadStatus(response.message || 'Erreur lors du téléchargement', false);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showUploadStatus('Erreur de connexion au serveur', false);
        }
        
        // Clear the input
        input.value = '';
    }
    
    // Fonction pour supprimer l'avatar
    async function handleRemoveAvatar() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer votre avatar?')) {
            return;
        }
        
        showUploadStatus('Suppression en cours...', true, true);
        
        try {
            const response = await api.user.deleteAvatar();
            
            if (response.success) {
                showUploadStatus('Avatar supprimé avec succès!', true);
                // Reload profile data
                await loadProfileData();
            } else {
                showUploadStatus(response.message || 'Erreur lors de la suppression', false);
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            showUploadStatus('Erreur de connexion au serveur', false);
        }
    }
    
    // Fonction pour afficher le statut d'upload
    function showUploadStatus(message: string, isSuccess: boolean, isLoading: boolean = false) {
        if (!uploadStatus || !uploadStatusText) return;
        
        uploadStatusText.textContent = message;
        uploadStatus.classList.remove('hidden', 'bg-green-900/30', 'bg-red-900/30', 'border-green-500', 'border-red-500', 'text-green-300', 'text-red-300');
        
        if (isLoading) {
            uploadStatus.classList.add('bg-blue-900/30', 'border-blue-500', 'text-blue-300');
        } else if (isSuccess) {
            uploadStatus.classList.add('bg-green-900/30', 'border-green-500', 'text-green-300');
        } else {
            uploadStatus.classList.add('bg-red-900/30', 'border-red-500', 'text-red-300');
        }
        
        // Auto-hide after 3 seconds if not loading
        if (!isLoading) {
            setTimeout(() => {
                uploadStatus.classList.add('hidden');
            }, 3000);
        }
    }
    
    // Fonction asynchrone pour charger les données du profil
    async function loadProfileData() {
        try {
            console.log('Loading full profile data from API');
            const response = await api.user.getProfile();
            console.log('Profile API response:', response);
            
            if (response.success && response.data) {
                console.log('Successfully loaded profile data');
                const profile = response.data;
                currentUserData = profile;
                
                // Afficher les informations du profil
                profileUsernameElement.textContent = profile.username;
                if (profileEmail) {
                    profileEmail.textContent = profile.email || '';
                }
                
                if (profileStatus) {
                    profileStatus.textContent = profile.status || 'offline';
                    
                    // Définir la couleur du statut
                    profileStatus.classList.remove('text-green-600', 'text-blue-600', 'text-gray-600');
                    if (profile.status === 'online') {
                        profileStatus.classList.add('text-green-600');
                    } else if (profile.status === 'in_game') {
                        profileStatus.classList.add('text-blue-600');
                    } else {
                        profileStatus.classList.add('text-gray-600');
                    }
                }
                
                // Update avatar display
                updateAvatarDisplay(profile);
                
                // Définir les valeurs du formulaire pour l'édition
                if (editUsername) editUsername.value = profile.username;
                if (editEmail) editEmail.value = profile.email || '';
                if (editAvatar) editAvatar.value = profile.avatar_url || '';
                
                // Stocker l'email dans localStorage pour une utilisation future
                if (profile.email) {
                    localStorage.setItem('email', profile.email);
                }
            } else {
                console.error('Failed to load profile data:', response.message);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    async function loadMatches() {
        try {
          const matchesResponse = await api.user.getMatches();
          
          if (matchesResponse.success && matchesResponse.data && matchesResponse.data.length > 0) {
            const matches = matchesResponse.data as MatchData[];
            
            // Hide "no matches" message
            if (noMatches) {
              noMatches.classList.add('hidden');
            }
            
            // Calculate stats
            let wins = 0;
            let losses = 0;
            const userId = authService.getUserId();
            
            // Clear existing matches
            if (matchesContainer) {
              matchesContainer.innerHTML = '';
            }
            
            // Display matches
            if (matchesContainer && matchTemplate) {
              matches.forEach((match: MatchData) => {
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
                const resultIndicator = matchElement.querySelector('.match-result-indicator');
                const opponent = matchElement.querySelector('.match-opponent');
                const date = matchElement.querySelector('.match-date');
                const score = matchElement.querySelector('.match-score');
                
                if (resultIndicator) {
                  resultIndicator.classList.add(isWin ? 'bg-green-500' : 'bg-red-500');
                }
                
                if (opponent) opponent.textContent = opponentUsername || 'Unknown';
                if (score) score.textContent = `${currentPlayerScore} - ${opponentScore}`;
                
                // Format date
                if (date && match.created_at) {
                  const matchDate = new Date(match.created_at);
                  date.textContent = matchDate.toLocaleDateString();
                }
                
                // Add match to container
                matchesContainer.appendChild(matchElement);
              });
            }
            
            // Update stats
            const total = wins + losses;
            if (statsGamesPlayed) statsGamesPlayed.textContent = total.toString();
            if (statsWins) statsWins.textContent = wins.toString();
            if (statsLosses) statsLosses.textContent = losses.toString();
            if (statsRatio) statsRatio.textContent = total > 0 ? (wins / total).toFixed(2) : '0.00';
          } else {
            // Show "no matches" message if no matches found
            if (noMatches) {
              noMatches.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error('Error loading matches:', error);
          
          // Show "no matches" message in case of error
          if (noMatches) {
            noMatches.classList.remove('hidden');
          }
        }
    }
    
    // Fonction pour soumettre les modifications du profil
    async function submitProfileEdit() {
        if (!editUsername || !editEmail) return;
        
        const updateData = {
            username: editUsername.value,
            email: editEmail.value,
            avatar_url: editAvatar ? editAvatar.value : undefined
        };
        
        try {
            const response = await api.user.updateProfile(updateData);
            
            if (response.success) {
                // Mettre à jour le nom d'utilisateur dans localStorage
                if (updateData.username) {
                    localStorage.setItem('username', updateData.username);
                    // Mettre à jour l'état dans authService
                    if (authService && typeof authService.updateUsername === 'function') {
                        authService.updateUsername(updateData.username);
                    }
                }
                
                // Mettre à jour l'avatar dans localStorage si nécessaire
                if (updateData.avatar_url) {
                    localStorage.setItem('avatar_url', updateData.avatar_url);
                }
                
                // Fermer le modal
                if (editProfileModal) {
                    editProfileModal.classList.add('hidden');
                }
                
                // Recharger les données du profil
                loadProfileData();
                
                // Recharger le header pour refléter les changements
                window.location.reload();
            } else {
                // Afficher l'erreur
                if (editErrorMessage && editErrorText) {
                    editErrorText.textContent = response.message || 'Une erreur est survenue';
                    editErrorMessage.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            
            if (editErrorMessage && editErrorText) {
                editErrorText.textContent = 'Erreur de connexion au serveur';
                editErrorMessage.classList.remove('hidden');
            }
        }
    }
    
    // Fonction pour supprimer le compte utilisateur
    async function deleteAccount() {
        try {
            // Montrer l'état de chargement sur le bouton
            if (confirmDeleteButton) {
                confirmDeleteButton.textContent = 'Suppression en cours...';
                confirmDeleteButton.disabled = true;
            }
            
            const response = await api.user.deleteProfile();
            
            if (response.success) {
                // Déconnexion et redirection vers la page de login
                await authService.logout();
                window.location.href = '/login.html';
            } else {
                // Afficher l'erreur
                if (deleteErrorMessage && deleteErrorText) {
                    deleteErrorText.textContent = response.message || 'Une erreur est survenue lors de la suppression du compte';
                    deleteErrorMessage.classList.remove('hidden');
                }
                
                // Réinitialiser le bouton
                if (confirmDeleteButton) {
                    confirmDeleteButton.textContent = 'Confirmer la suppression';
                    confirmDeleteButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            if (deleteErrorMessage && deleteErrorText) {
                deleteErrorText.textContent = 'Erreur de connexion au serveur';
                deleteErrorMessage.classList.remove('hidden');
            }
            
            // Réinitialiser le bouton
            if (confirmDeleteButton) {
                confirmDeleteButton.textContent = 'Confirmer la suppression';
                confirmDeleteButton.disabled = false;
            }
        }
    }
});