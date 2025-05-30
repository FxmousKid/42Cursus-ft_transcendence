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
    status: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Script pour gérer la page de profil
 */

// Utility function to create avatar HTML with consistent styling
function createAvatarHTML(user: { id?: number; avatar_url?: string | null; username: string; has_avatar_data?: boolean }, size: 'small' | 'medium' | 'large' = 'large'): string {
    const sizeClasses = {
        small: 'w-8 h-8',
        medium: 'w-12 h-12', 
        large: 'w-32 h-32'
    };
    
    const iconSizes = {
        small: 'text-lg',
        medium: 'text-xl',
        large: 'text-5xl'
    };
    
    const sizeClass = sizeClasses[size];
    const iconSize = iconSizes[size];
    
    // Use getAvatarUrl to prioritize uploaded avatars over URLs
    let avatarUrl = '';
    if (user.id) {
        avatarUrl = getAvatarUrl({
            id: user.id,
            has_avatar_data: user.has_avatar_data,
            avatar_url: user.avatar_url || undefined
        });
    }
    
    if (avatarUrl && avatarUrl.trim()) {
        // Add cache-busting parameter to force reload of uploaded avatars
        const finalAvatarUrl = user.has_avatar_data ? 
            `${avatarUrl}?t=${Date.now()}` : avatarUrl;
        
        return `<img src="${finalAvatarUrl}" alt="${user.username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <i class="fas fa-user text-white ${iconSize}" style="display: none;"></i>`;
    } else {
        return `<i class="fas fa-user text-white ${iconSize}"></i>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
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
    const removeAvatarBtn = document.getElementById('remove-avatar-btn') as HTMLButtonElement;
    
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
    
    // 2FA elements
    const toggle2FA = document.getElementById('toggle-2fa') as HTMLButtonElement;
    const toggle2FAHandle = document.getElementById('2fa-toggle-handle') as HTMLSpanElement;
    const setup2FAModal = document.getElementById('2fa-setup-modal') as HTMLDivElement;
    const close2FASetup = document.getElementById('close-2fa-setup') as HTMLButtonElement;
    const cancel2FASetup = document.getElementById('cancel-2fa-setup') as HTMLButtonElement;
    const verify2FASetup = document.getElementById('verify-2fa-setup') as HTMLButtonElement;
    const qrContainer = document.getElementById('2fa-qr-container') as HTMLDivElement;
    const secretDisplay = document.getElementById('2fa-secret') as HTMLElement;
    const verificationCode = document.getElementById('2fa-verification-code') as HTMLInputElement;
    const setupError = document.getElementById('2fa-setup-error') as HTMLDivElement;
    const setupErrorText = document.getElementById('2fa-setup-error-text') as HTMLSpanElement;
    
    // Current user data
    let currentUserData: any = null;
    
    // Initially hide the remove button until we confirm there's an avatar
    if (removeAvatarBtn) {
        removeAvatarBtn.classList.add('hidden');
    }
    
    // Utiliser les données du localStorage pour afficher des informations de base
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email') || '';
    const avatarUrl = localStorage.getItem('avatar_url');
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    
    // Afficher les informations de base depuis localStorage
    if (username) {
        profileUsernameElement.textContent = username;
        if (profileStatus) {
            profileStatus.textContent = 'offline';
            profileStatus.classList.add('text-gray-600');
        }
        
        // Pré-remplir les champs du formulaire
        if (editUsername) editUsername.value = username;
        if (editEmail) editEmail.value = email;
        if (editAvatar) editAvatar.value = avatarUrl || '';
        
        // Afficher l'avatar si disponible et userId est défini
        if (avatarUrl && avatarUrl.trim() !== '' && userId) {
            updateAvatarDisplay({ id: parseInt(userId), avatar_url: avatarUrl, has_avatar_data: false });
        }
    }
    
    // Charger les données complètes du profil
    loadProfileData();
    
    // Charger les matchs
    loadMatches();
    
    // EVENT LISTENERS SIMPLIFIÉS
    
    // Clic sur l'avatar pour choisir une nouvelle photo
    if (profileAvatar && avatarUploadInput) {
        profileAvatar.addEventListener('click', (e) => {
            console.log('Avatar clicked!');
            e.preventDefault();
            e.stopPropagation();
            try {
                avatarUploadInput.click();
            } catch (error) {
                console.error('Error triggering file input:', error);
            }
        });
    } else {
        console.warn('Profile avatar or upload input not found');
    }
    
    // Bouton supprimer avatar
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', (e) => {
            console.log('Remove button clicked!');
            e.preventDefault();
            e.stopPropagation();
            handleRemoveAvatar();
        });
    }
    
    // Handle avatar upload
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
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
    
    // Handle 2FA toggle
    if (toggle2FA) {
        toggle2FA.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('2FA toggle clicked');
            try {
                console.log('Getting user profile...');
                const response = await api.user.getProfile();
                console.log('Profile response:', response);
                if (response.success && response.data) {
                    const is2FAEnabled = response.data.two_factor_enabled;
                    console.log('2FA enabled:', is2FAEnabled);
                    
                    if (!is2FAEnabled) {
                        console.log('Starting 2FA setup...');
                        // Show setup modal
                        const setupResponse = await api.auth.setup2FA();
                        console.log('Setup response:', setupResponse);
                        console.log('QR Code data:', setupResponse.data?.qrCode);
                        if (setupResponse.success && setupResponse.data) {
                            // Display QR code
                            qrContainer.innerHTML = `<img src="${setupResponse.data.qrCode}" alt="2FA QR Code">`;
                            secretDisplay.textContent = setupResponse.data.secret;
                            setup2FAModal.classList.remove('hidden');
                            // Update UI to show pending state
                            update2FAStatus(true);
                        }
                    } else {
						// Disable 2FA
                        console.log('Disabling 2FA...');

						// Sending userID in the request body
			            const userId = authService.getUserId();
						if (!userId) {
							console.error('No user ID available');
							return;
						}

                        const disableResponse = await api.auth.disable2FA(userId);
                        console.log('Disable response:', disableResponse);
                        if (disableResponse.success) {
                            update2FAStatus(false);
                        }
                    }
                }
            } catch (error) {
                console.error('Error toggling 2FA:', error);
            }
        });
    }

    // Handle 2FA setup modal
    if (close2FASetup) {
        close2FASetup.addEventListener('click', () => {
            setup2FAModal.classList.add('hidden');
            reset2FASetup();
            // Reset toggle state if setup was cancelled
            update2FAStatus(false);
        });
    }

    if (cancel2FASetup) {
        cancel2FASetup.addEventListener('click', () => {
            setup2FAModal.classList.add('hidden');
            reset2FASetup();
            // Reset toggle state if setup was cancelled
            update2FAStatus(false);
        });
    }

    if (verify2FASetup) {
        verify2FASetup.addEventListener('click', async () => {
            const code = verificationCode.value;
            if (code.length !== 6) {
                show2FAError('Le code doit contenir 6 chiffres');
                return;
            }

            try {
                const response = await api.auth.enable2FA(code);
                if (response.success) {
                    update2FAStatus(true);
                    setup2FAModal.classList.add('hidden');
                    reset2FASetup();
                } else {
                    show2FAError(response.message || 'Code invalide');
                    // Reset toggle state if verification failed
                    update2FAStatus(false);
                }
            } catch (error) {
                console.error('Error enabling 2FA:', error);
                show2FAError('Erreur lors de l\'activation de la 2FA');
                // Reset toggle state if verification failed
                update2FAStatus(false);
            }
        });
    }

    // Handle verification code input
    if (verificationCode) {
        verificationCode.addEventListener('input', () => {
            verificationCode.value = verificationCode.value.replace(/[^0-9]/g, '');
            if (verificationCode.value.length === 6) {
                verify2FASetup.disabled = false;
            } else {
                verify2FASetup.disabled = true;
            }
        });
    }

    // Helper functions for 2FA
    function update2FAStatus(enabled: boolean) {
        if (toggle2FAHandle) {
            if (enabled) {
                toggle2FAHandle.classList.add('translate-x-5');
                toggle2FAHandle.classList.remove('translate-x-0');
                toggle2FA.classList.add('bg-primary-600');
                toggle2FA.classList.remove('bg-dark-600');
            } else {
                toggle2FAHandle.classList.remove('translate-x-5');
                toggle2FAHandle.classList.add('translate-x-0');
                toggle2FA.classList.remove('bg-primary-600');
                toggle2FA.classList.add('bg-dark-600');
            }
        }
    }

    function show2FAError(message: string) {
        if (setupError && setupErrorText) {
            setupErrorText.textContent = message;
            setupError.classList.remove('hidden');
        }
    }

    function reset2FASetup() {
        if (qrContainer) qrContainer.innerHTML = '';
        if (secretDisplay) secretDisplay.textContent = '';
        if (verificationCode) verificationCode.value = '';
        if (setupError) setupError.classList.add('hidden');
    }

    // Update 2FA status on page load
    async function load2FAStatus() {
        try {
            console.log('Loading 2FA status...');
            const response = await api.user.getProfile();
            console.log('load2FAStatus - Profile response:', response);
            if (response.success && response.data) {
                console.log('load2FAStatus - two_factor_enabled:', response.data.two_factor_enabled);
                update2FAStatus(response.data.two_factor_enabled);
            }
        } catch (error) {
            console.error('Error loading 2FA status:', error);
        }
    }
    // Load 2FA status
    load2FAStatus();
    
    // Fonction pour mettre à jour l'affichage de l'avatar
    function updateAvatarDisplay(userData: { id: number; username?: string; avatar_url?: string; has_avatar_data?: boolean }) {
        if (!profileAvatar) {
            console.warn('Profile avatar element not found');
            return;
        }
        
        try {
            const avatarUrl = getAvatarUrl ? getAvatarUrl(userData) : '';
            
            if (avatarUrl) {
                // Add cache-busting parameter to force reload of uploaded avatars
                const finalAvatarUrl = userData.has_avatar_data ? 
                    `${avatarUrl}?t=${Date.now()}` : avatarUrl;
                
                // When there's an avatar, show the image and hide the default icon
                profileAvatar.innerHTML = `
                    <img src="${finalAvatarUrl}" alt="${userData.username || username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <i class="fas fa-user text-white text-5xl" style="display: none;"></i>
                `;
            } else {
                // When there's no avatar, show only the default icon - the container keeps its gradient background
                profileAvatar.innerHTML = `<i class="fas fa-user text-white text-5xl"></i>`;
            }
            
            // Show/hide remove button based on whether user has uploaded avatar or avatar_url
            if (removeAvatarBtn) {
                // Only show remove button if there's actually an avatar to remove
                // This means either uploaded avatar data OR a valid avatar_url that produces an image
                const hasUploadedAvatar = userData.has_avatar_data;
                const hasValidAvatarUrl = userData.avatar_url && userData.avatar_url.trim() !== '';
                
                if (hasUploadedAvatar || hasValidAvatarUrl) {
                    removeAvatarBtn.classList.remove('hidden');
                } else {
                    removeAvatarBtn.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error updating avatar display:', error);
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
            console.error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.');
            return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            console.error('Le fichier est trop volumineux. Taille maximale: 2MB.');
            return;
        }
        
        console.log('Téléchargement en cours...');
        
        try {
            const response = await api.user.uploadAvatar(file);
            
            if (response.success) {
                console.log('Avatar uploadé avec succès');
                // Reload profile data to get updated avatar info
                await loadProfileData();
            } else {
                console.error('Erreur lors du téléchargement:', response.message);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
        
        // Clear the input
        input.value = '';
    }
    
    // Fonction pour supprimer l'avatar
    async function handleRemoveAvatar() {
        console.log('Suppression en cours...');
        
        try {
            const response = await api.user.deleteAvatar();
            
            if (response.success) {
                console.log('Avatar supprimé avec succès');
                // Reload profile data
                await loadProfileData();
            } else {
                console.error('Erreur lors de la suppression:', response.message);
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
        }
    }
    
    // Fonction asynchrone pour charger les données du profil
    async function loadProfileData() {
        try {
            console.log('Loading full profile data from API');
            
            // Get current user's ID
            const userId = authService.getUserId();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            
            // Use the profile endpoint with statistics (same as in friends modal)
            const response = await fetch(`${api.baseUrl}/users/${userId}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Profile API response with stats:', data);
            
            if (data.success && data.data) {
                console.log('Successfully loaded profile data');
                const profile = data.data;
                currentUserData = profile;
                
                // Display profile information
                profileUsernameElement.textContent = profile.username;
                if (profileEmail) {
                    profileEmail.textContent = profile.email || '';
                }
                
                // Update avatar display using the unified function
                updateAvatarDisplay(profile);
                
                // Update statistics if available
                if (profile.statistics) {
                    if (statsGamesPlayed) statsGamesPlayed.textContent = profile.statistics.games_played.toString();
                    if (statsWins) statsWins.textContent = profile.statistics.wins.toString();
                    if (statsLosses) statsLosses.textContent = profile.statistics.losses.toString();
                    if (statsRatio) {
                        const winRate = profile.statistics.win_rate / 100; // Convert percentage to ratio
                        statsRatio.textContent = winRate.toFixed(2);
                    }
                }
                
                // Set form values for editing
                if (editUsername) editUsername.value = profile.username;
                if (editEmail) editEmail.value = profile.email || '';
                if (editAvatar) editAvatar.value = profile.avatar_url || '';
                
                // Store email in localStorage for future use
                if (profile.email) {
                    localStorage.setItem('email', profile.email);
                }
                
                // Store avatar URL in localStorage if available
                if (profile.avatar_url) {
                    localStorage.setItem('avatar_url', profile.avatar_url);
                }
            } else {
                console.error('Failed to load profile data:', data.message);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    async function loadMatches() {
        try {
            const userId = authService.getUserId();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            console.log('Loading matches for user:', userId);
    
            // Get matches from the API
            const matchesResponse = await api.user.getMatches();
            console.log('Matches response:', matchesResponse);
    
            if (matchesContainer) {
                matchesContainer.innerHTML = '';
            }
    
            if (matchesResponse.success && matchesResponse.data && matchesResponse.data.length > 0) {
                const matches = matchesResponse.data;
                console.log('First match data:', matches[0]);
                
                // Hide "no matches" message
                if (noMatches) {
                    noMatches.classList.add('hidden');
                }
    
                // Get current user's profile to get the username
                const profileResponse = await api.user.getProfile();
                const currentUsername = profileResponse.success ? profileResponse.data.username : 'Unknown';
                
                // Display matches
                if (matchesContainer && matchTemplate) {
                    matches.forEach((match: MatchData) => {
                        // Create match element from template
                        const matchElement = document.importNode(matchTemplate.content, true);
    
                        // Determine if current user is player1 or player2
                        const isPlayer1 = match.player1_id.toString() === userId.toString();
                        const currentPlayerScore = isPlayer1 ? match.player1_score : match.player2_score;
                        const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
                        
                        // Set match details
                        const resultIndicator = matchElement.querySelector('.match-result-indicator');
                        const opponent = matchElement.querySelector('.match-opponent');
                        const date = matchElement.querySelector('.match-date');
                        const score = matchElement.querySelector('.match-score');
                        
                        // Set win/loss indicator
                        if (resultIndicator) {
                            resultIndicator.classList.add(currentPlayerScore > opponentScore ? 'bg-green-500' : 'bg-red-500');
                        }
                        
                        // Set opponent name (show as "vs Yourself" if playing against self)
                        if (opponent) {
                            if (match.player1_id === match.player2_id) {
                                opponent.textContent = 'vs Yourself (Practice)';
                            } else {
                                opponent.textContent = `vs ${isPlayer1 ? match.player2_username || 'Unknown' : match.player1_username || 'Unknown'}`;
                            }
                        }
                        
                        // Set score
                        if (score) {
                            score.textContent = `${currentPlayerScore} - ${opponentScore}`;
                        }
                        
                        // Format and set date
                        if (date && match.created_at) {
                            const dateObj = new Date(match.created_at);
                            date.textContent = dateObj.toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                        }
                        
                        // Add match to container
                        matchesContainer.appendChild(matchElement);
                    });
    
                    // Update statistics
                    let wins = 0;
                    let losses = 0;
                    matches.forEach((match: MatchData) => {
                        const isPlayer1 = match.player1_id.toString() === userId.toString();
                        const currentPlayerScore = isPlayer1 ? match.player1_score : match.player2_score;
                        const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
                        if (currentPlayerScore > opponentScore) wins++;
                        else losses++;
                    });
    
                    if (statsGamesPlayed) statsGamesPlayed.textContent = matches.length.toString();
                    if (statsWins) statsWins.textContent = wins.toString();
                    if (statsLosses) statsLosses.textContent = losses.toString();
                    if (statsRatio) {
                        const ratio = matches.length > 0 ? (wins / matches.length).toFixed(2) : '0.00';
                        statsRatio.textContent = ratio;
                    }
                }
            } else {
                // Show "no matches" message if no matches found
                if (noMatches) {
                    noMatches.classList.remove('hidden');
                }
                console.log('No matches found or empty response');
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

    // After DOMContentLoaded and element selection
    const websocketService = (window as any).websocketService;
    const currentUserId = authService.getUserId && authService.getUserId();
    function setStatusUI(status: string) {
        if (profileStatus) {
            if (status === 'online') {
                profileStatus.textContent = 'En ligne';
                profileStatus.classList.remove('text-gray-600');
                profileStatus.classList.add('text-green-500');
            } else if (status === 'in_game') {
                profileStatus.textContent = 'En jeu';
                profileStatus.classList.remove('text-gray-600');
                profileStatus.classList.add('text-blue-500');
            } else {
                profileStatus.textContent = 'Hors ligne';
                profileStatus.classList.remove('text-green-500', 'text-blue-500');
                profileStatus.classList.add('text-gray-600');
            }
        }
    }
    // Listen for status changes for the current user
    if (websocketService && websocketService.on && currentUserId) {
        websocketService.on('friend-status-change', (data: any) => {
            if (data.friend_id === Number(currentUserId)) {
                setStatusUI(data.status);
            }
        });
    }
    // Optionally, fetch and set initial status from API or localStorage
    // ... existing code ...
});
