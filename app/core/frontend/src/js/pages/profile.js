import { authUtils } from '../utils/auth';
import { userApi } from '../services/api';
import { toastUtils } from '../utils/toast';
export function renderProfile() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    // Create profile container
    const profileContainer = document.createElement('div');
    profileContainer.className = 'container mx-auto px-4 py-8';
    // Show loading state initially
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'flex justify-center items-center py-12';
    loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>';
    profileContainer.appendChild(loadingIndicator);
    appContainer.appendChild(profileContainer);
    // Fetch user profile data
    fetchUserProfile(profileContainer, loadingIndicator);
}
async function fetchUserProfile(container, loadingElement) {
    try {
        const response = await userApi.getProfile();
        if (response.success && response.data) {
            // Remove loading indicator
            container.removeChild(loadingElement);
            // Render profile with data
            renderProfileContent(container, response.data);
        }
        else {
            // Show error message
            container.innerHTML = `
        <div class="text-center py-12">
          <h2 class="text-2xl font-bold text-red-500 mb-4">Error Loading Profile</h2>
          <p class="text-gray-300">${response.error || 'Failed to load profile data'}</p>
          <button class="btn btn-primary mt-4" id="retry-button">Retry</button>
        </div>
      `;
            // Add retry button handler
            const retryButton = document.getElementById('retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    container.innerHTML = '';
                    container.appendChild(loadingElement);
                    fetchUserProfile(container, loadingElement);
                });
            }
        }
    }
    catch (error) {
        // Show error message
        container.innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-2xl font-bold text-red-500 mb-4">Error Loading Profile</h2>
        <p class="text-gray-300">An unexpected error occurred</p>
        <button class="btn btn-primary mt-4" id="retry-button">Retry</button>
      </div>
    `;
        // Add retry button handler
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                container.innerHTML = '';
                container.appendChild(loadingElement);
                fetchUserProfile(container, loadingElement);
            });
        }
        console.error('Error fetching profile:', error);
    }
}
function renderProfileContent(container, profile) {
    const { user, stats, achievements, recent_matches } = profile;
    // Create a grid layout
    const profileGrid = document.createElement('div');
    profileGrid.className = 'grid grid-cols-1 lg:grid-cols-3 gap-8';
    // User info section
    const userInfoSection = document.createElement('div');
    userInfoSection.className = 'card p-6 lg:col-span-1';
    // User avatar and basic info
    userInfoSection.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="relative w-32 h-32 rounded-full overflow-hidden mb-4">
        <img src="${user.avatar_url || 'https://via.placeholder.com/128'}" alt="${user.username}" class="w-full h-full object-cover">
        <div class="absolute bottom-0 right-0 w-4 h-4 rounded-full ${getStatusColor(user.status)}"></div>
      </div>
      <h1 class="text-2xl font-bold mb-1">${user.username}</h1>
      <p class="text-gray-400 mb-4">Member since ${formatDate(user.created_at)}</p>
      <div class="flex items-center mb-6">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-300">
          Rank #${stats.rank}
        </span>
      </div>
      <button id="edit-profile-btn" class="btn btn-secondary w-full mb-4">Edit Profile</button>
    </div>
    
    <div class="border-t border-gray-700 my-6"></div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4">Account Information</h2>
      <div class="space-y-3">
        <div>
          <p class="text-sm text-gray-400">Email</p>
          <p>${user.email}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">Status</p>
          <p>${user.status}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">Two-Factor Authentication</p>
          <p>${user.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  `;
    // Main content section
    const mainContentSection = document.createElement('div');
    mainContentSection.className = 'lg:col-span-2 space-y-8';
    // Stats section
    const statsSection = document.createElement('div');
    statsSection.className = 'card p-6';
    statsSection.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Game Statistics</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <p class="text-3xl font-bold text-blue-500">${stats.wins}</p>
        <p class="text-gray-400">Wins</p>
      </div>
      <div class="text-center">
        <p class="text-3xl font-bold text-red-500">${stats.losses}</p>
        <p class="text-gray-400">Losses</p>
      </div>
      <div class="text-center">
        <p class="text-3xl font-bold">${stats.total_matches}</p>
        <p class="text-gray-400">Matches</p>
      </div>
      <div class="text-center">
        <p class="text-3xl font-bold text-green-500">${Math.round(stats.win_rate * 100)}%</p>
        <p class="text-gray-400">Win Rate</p>
      </div>
    </div>
    <div class="mt-6 pt-6 border-t border-gray-700">
      <p class="mb-2">ELO Rating</p>
      <div class="bg-gray-700 rounded-full h-4">
        <div class="bg-blue-600 h-4 rounded-full" style="width: ${Math.min(100, stats.elo / 20)}%"></div>
      </div>
      <p class="mt-2 text-right font-semibold">${stats.elo} points</p>
    </div>
  `;
    // Recent matches section
    const matchesSection = document.createElement('div');
    matchesSection.className = 'card p-6';
    // Matches section header
    const matchesHeader = document.createElement('div');
    matchesHeader.className = 'flex justify-between items-center mb-4';
    const matchesTitle = document.createElement('h2');
    matchesTitle.className = 'text-xl font-semibold';
    matchesTitle.textContent = 'Recent Matches';
    const viewAllButton = document.createElement('a');
    viewAllButton.href = '#';
    viewAllButton.className = 'text-blue-500 hover:underline text-sm';
    viewAllButton.textContent = 'View All';
    matchesHeader.appendChild(matchesTitle);
    matchesHeader.appendChild(viewAllButton);
    matchesSection.appendChild(matchesHeader);
    // Matches list
    const matchesList = document.createElement('div');
    matchesList.className = 'space-y-4';
    if (recent_matches.length === 0) {
        matchesList.innerHTML = '<p class="text-gray-400 text-center py-4">No matches played yet</p>';
    }
    else {
        recent_matches.forEach(match => {
            const matchCard = renderMatchCard(match, user.id);
            matchesList.appendChild(matchCard);
        });
    }
    matchesSection.appendChild(matchesList);
    // Achievements section
    const achievementsSection = document.createElement('div');
    achievementsSection.className = 'card p-6';
    // Achievements header
    const achievementsHeader = document.createElement('h2');
    achievementsHeader.className = 'text-xl font-semibold mb-4';
    achievementsHeader.textContent = 'Achievements';
    achievementsSection.appendChild(achievementsHeader);
    // Achievements grid
    const achievementsGrid = document.createElement('div');
    achievementsGrid.className = 'grid grid-cols-2 md:grid-cols-3 gap-4';
    if (achievements.length === 0) {
        achievementsGrid.innerHTML = '<p class="text-gray-400 text-center py-4 col-span-3">No achievements unlocked yet</p>';
    }
    else {
        achievements.forEach(achievement => {
            const isUnlocked = achievement.unlocked_at !== null;
            const achievementCard = document.createElement('div');
            achievementCard.className = `rounded-lg p-4 border ${isUnlocked ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-800 opacity-50'}`;
            achievementCard.innerHTML = `
        <div class="flex items-center mb-2">
          <img src="${achievement.icon_url || 'https://via.placeholder.com/32'}" alt="${achievement.title}" class="w-8 h-8 mr-2">
          <h3 class="font-medium ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}">${achievement.title}</h3>
        </div>
        <p class="text-sm text-gray-400">${achievement.description}</p>
        ${isUnlocked ? `<p class="text-xs text-gray-500 mt-2">Unlocked on ${formatDate(achievement.unlocked_at)}</p>` : ''}
      `;
            achievementsGrid.appendChild(achievementCard);
        });
    }
    achievementsSection.appendChild(achievementsGrid);
    // Assemble sections in main content
    mainContentSection.appendChild(statsSection);
    mainContentSection.appendChild(matchesSection);
    mainContentSection.appendChild(achievementsSection);
    // Assemble the grid
    profileGrid.appendChild(userInfoSection);
    profileGrid.appendChild(mainContentSection);
    // Add sections to container
    container.appendChild(profileGrid);
    // Add event listener for edit profile button
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            showEditProfileModal(user);
        });
    }
}
function renderMatchCard(match, userId) {
    const matchCard = document.createElement('div');
    matchCard.className = 'bg-gray-800 rounded-lg p-4';
    const isWinner = match.winner_id === userId;
    const isPlayer1 = match.player1_id === userId;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const userScore = isPlayer1 ? match.player1_score : match.player2_score;
    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
    matchCard.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="rounded-full w-2 h-2 mr-2 ${isWinner ? 'bg-green-500' : 'bg-red-500'}"></div>
        <span class="font-medium">${isWinner ? 'Victory' : 'Defeat'}</span>
      </div>
      <span class="text-sm text-gray-400">${formatDate(match.started_at)}</span>
    </div>
    
    <div class="flex justify-between items-center mt-3">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-700">
          <img src="https://via.placeholder.com/32" alt="You" class="w-full h-full object-cover">
        </div>
        <span>You</span>
      </div>
      
      <div class="text-center px-6">
        <div class="text-xl font-bold">
          <span class="${isWinner ? 'text-green-500' : ''}">${userScore}</span>
          <span class="mx-1">-</span>
          <span class="${!isWinner ? 'text-green-500' : ''}">${opponentScore}</span>
        </div>
      </div>
      
      <div class="flex items-center">
        <span>${opponent ? opponent.username : 'Unknown'}</span>
        <div class="w-8 h-8 rounded-full overflow-hidden ml-2 bg-gray-700">
          <img src="${opponent && opponent.avatar_url ? opponent.avatar_url : 'https://via.placeholder.com/32'}" alt="${opponent ? opponent.username : 'Unknown'}" class="w-full h-full object-cover">
        </div>
      </div>
    </div>
  `;
    return matchCard;
}
function showEditProfileModal(user) {
    // Create modal container
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    // Create modal card
    const modalCard = document.createElement('div');
    modalCard.className = 'card w-full max-w-md p-6';
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex justify-between items-center mb-6';
    const modalTitle = document.createElement('h2');
    modalTitle.className = 'text-2xl font-bold';
    modalTitle.textContent = 'Edit Profile';
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-400 hover:text-white';
    closeButton.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    // Create form
    const form = document.createElement('form');
    form.className = 'space-y-6';
    // Username field
    const usernameGroup = document.createElement('div');
    const usernameLabel = document.createElement('label');
    usernameLabel.className = 'form-label';
    usernameLabel.htmlFor = 'username';
    usernameLabel.textContent = 'Username';
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'username';
    usernameInput.className = 'form-input';
    usernameInput.value = user.username;
    usernameGroup.appendChild(usernameLabel);
    usernameGroup.appendChild(usernameInput);
    // Email field
    const emailGroup = document.createElement('div');
    const emailLabel = document.createElement('label');
    emailLabel.className = 'form-label';
    emailLabel.htmlFor = 'email';
    emailLabel.textContent = 'Email';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.className = 'form-input';
    emailInput.value = user.email;
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    // Avatar field
    const avatarGroup = document.createElement('div');
    const avatarLabel = document.createElement('label');
    avatarLabel.className = 'form-label';
    avatarLabel.htmlFor = 'avatar';
    avatarLabel.textContent = 'Avatar URL';
    const avatarInput = document.createElement('input');
    avatarInput.type = 'text';
    avatarInput.id = 'avatar';
    avatarInput.className = 'form-input';
    avatarInput.value = user.avatar_url || '';
    avatarGroup.appendChild(avatarLabel);
    avatarGroup.appendChild(avatarInput);
    // Two-factor toggle
    const twoFactorGroup = document.createElement('div');
    twoFactorGroup.className = 'flex items-center justify-between';
    const twoFactorLabel = document.createElement('span');
    twoFactorLabel.className = 'text-sm font-medium text-gray-300';
    twoFactorLabel.textContent = 'Enable Two-Factor Authentication';
    const twoFactorToggle = document.createElement('div');
    twoFactorToggle.className = `relative inline-flex h-6 w-11 items-center rounded-full ${user.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-600'}`;
    const twoFactorInput = document.createElement('input');
    twoFactorInput.type = 'checkbox';
    twoFactorInput.className = 'sr-only';
    twoFactorInput.id = 'two-factor';
    twoFactorInput.checked = user.two_factor_enabled;
    const twoFactorSlider = document.createElement('span');
    twoFactorSlider.className = `inline-block h-4 w-4 transform rounded-full bg-white transition ${user.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'}`;
    twoFactorToggle.appendChild(twoFactorInput);
    twoFactorToggle.appendChild(twoFactorSlider);
    twoFactorToggle.addEventListener('click', () => {
        twoFactorInput.checked = !twoFactorInput.checked;
        twoFactorToggle.className = `relative inline-flex h-6 w-11 items-center rounded-full ${twoFactorInput.checked ? 'bg-blue-600' : 'bg-gray-600'}`;
        twoFactorSlider.className = `inline-block h-4 w-4 transform rounded-full bg-white transition ${twoFactorInput.checked ? 'translate-x-6' : 'translate-x-1'}`;
    });
    twoFactorGroup.appendChild(twoFactorLabel);
    twoFactorGroup.appendChild(twoFactorToggle);
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary w-full';
    submitButton.textContent = 'Save Changes';
    // Add form handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            avatar_url: avatarInput.value.trim(),
            two_factor_enabled: twoFactorInput.checked
        };
        try {
            // Show loading
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
            const response = await userApi.updateProfile(userData);
            if (response.success && response.data) {
                // Update current user data
                authUtils.updateCurrentUser(response.data);
                // Close modal
                document.body.removeChild(modalOverlay);
                // Show success message
                toastUtils.success('Profile updated successfully');
                // Refresh profile page
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.innerHTML = '';
                    renderProfile();
                }
            }
            else {
                toastUtils.error(response.error || 'Failed to update profile');
            }
        }
        catch (error) {
            toastUtils.error('An error occurred while updating profile');
            console.error('Update profile error:', error);
        }
        finally {
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = 'Save Changes';
        }
    });
    // Assemble form
    form.appendChild(usernameGroup);
    form.appendChild(emailGroup);
    form.appendChild(avatarGroup);
    form.appendChild(twoFactorGroup);
    form.appendChild(submitButton);
    // Assemble modal
    modalCard.appendChild(modalHeader);
    modalCard.appendChild(form);
    modalOverlay.appendChild(modalCard);
    // Add to document
    document.body.appendChild(modalOverlay);
}
function getStatusColor(status) {
    switch (status) {
        case 'online':
            return 'bg-green-500';
        case 'away':
            return 'bg-yellow-500';
        case 'in_game':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
//# sourceMappingURL=profile.js.map