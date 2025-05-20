import { router } from '../utils/router';
import { authService } from '../services/auth';
import { toastUtils } from '../utils/toast';

/**
 * Rendu de la page de profil
 */
export function renderProfile(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Créer le conteneur principal
  const profileContainer = document.createElement('div');
  profileContainer.className = 'flex flex-col items-center py-16 px-4';
  
  // Vérifier si l'utilisateur est connecté
  if (!authService.isAuthenticated()) {
    router.navigateTo('/login');
    return;
  }
  
  const user = authService.getCurrentUser();
  if (!user) {
    router.navigateTo('/login');
    return;
  }
  
  // Titre de la page
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mb-8 text-center';
  title.textContent = 'Mon Profil';
  
  // Conteneur principal du profil
  const profileCard = document.createElement('div');
  profileCard.className = 'bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl';
  
  // Section avatar et infos de base
  const userInfoSection = document.createElement('div');
  userInfoSection.className = 'flex flex-col sm:flex-row items-center mb-8 pb-8 border-b border-gray-700';
  
  // Avatar et statut
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'relative mb-4 sm:mb-0 sm:mr-8';
  
  const avatar = document.createElement('img');
  avatar.src = user.avatar_url || 'https://via.placeholder.com/128';
  avatar.alt = 'Avatar';
  avatar.className = 'w-32 h-32 rounded-full object-cover border-4 border-gray-700';
  
  const statusIndicator = document.createElement('div');
  statusIndicator.className = `absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-gray-800 ${getStatusColor(user.status)}`;
  
  avatarContainer.appendChild(avatar);
  avatarContainer.appendChild(statusIndicator);
  
  // Informations de base
  const userInfo = document.createElement('div');
  userInfo.className = 'text-center sm:text-left';
  
  const username = document.createElement('h2');
  username.className = 'text-2xl font-bold mb-1';
  username.textContent = user.username;
  
  const memberSince = document.createElement('p');
  memberSince.className = 'text-gray-400 mb-3';
  memberSince.textContent = `Membre depuis ${formatDate(user.created_at)}`;
  
  const email = document.createElement('p');
  email.className = 'text-gray-300 mb-1';
  email.textContent = user.email;
  
  const editButton = document.createElement('button');
  editButton.className = 'mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white';
  editButton.textContent = 'Modifier le profil';
  editButton.addEventListener('click', () => {
    toastUtils.info('Fonctionnalité en cours de développement');
  });
  
  userInfo.appendChild(username);
  userInfo.appendChild(memberSince);
  userInfo.appendChild(email);
  userInfo.appendChild(editButton);
  
  userInfoSection.appendChild(avatarContainer);
  userInfoSection.appendChild(userInfo);
  
  // Section statistiques fictives
  const statsSection = document.createElement('div');
  statsSection.className = 'mb-8 pb-8 border-b border-gray-700';
  
  const statsTitle = document.createElement('h3');
  statsTitle.className = 'text-xl font-bold mb-4';
  statsTitle.textContent = 'Statistiques de jeu';
  
  const statsGrid = document.createElement('div');
  statsGrid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
  
  statsGrid.innerHTML = `
    <div class="bg-gray-700 p-4 rounded text-center">
      <p class="text-3xl font-bold text-blue-400">0</p>
      <p class="text-sm text-gray-300">Victoires</p>
    </div>
    <div class="bg-gray-700 p-4 rounded text-center">
      <p class="text-3xl font-bold text-red-400">0</p>
      <p class="text-sm text-gray-300">Défaites</p>
    </div>
    <div class="bg-gray-700 p-4 rounded text-center">
      <p class="text-3xl font-bold text-green-400">0%</p>
      <p class="text-sm text-gray-300">Taux de victoire</p>
    </div>
    <div class="bg-gray-700 p-4 rounded text-center">
      <p class="text-3xl font-bold text-purple-400">1000</p>
      <p class="text-sm text-gray-300">Score ELO</p>
    </div>
  `;
  
  statsSection.appendChild(statsTitle);
  statsSection.appendChild(statsGrid);
  
  // Section paramètres du compte
  const settingsSection = document.createElement('div');
  settingsSection.className = 'mb-6';
  
  const settingsTitle = document.createElement('h3');
  settingsTitle.className = 'text-xl font-bold mb-4';
  settingsTitle.textContent = 'Paramètres du compte';
  
  const twoFactorSetting = document.createElement('div');
  twoFactorSetting.className = 'flex justify-between items-center mb-4 p-4 bg-gray-700 rounded';
  
  const twoFactorLabel = document.createElement('div');
  twoFactorLabel.className = 'flex-1';
  
  const twoFactorTitle = document.createElement('h4');
  twoFactorTitle.className = 'font-medium';
  twoFactorTitle.textContent = 'Authentification à deux facteurs';
  
  const twoFactorDescription = document.createElement('p');
  twoFactorDescription.className = 'text-sm text-gray-400';
  twoFactorDescription.textContent = 'Sécurisez votre compte avec une vérification supplémentaire';
  
  twoFactorLabel.appendChild(twoFactorTitle);
  twoFactorLabel.appendChild(twoFactorDescription);
  
  const twoFactorStatus = document.createElement('span');
  twoFactorStatus.className = `px-3 py-1 rounded-full text-sm font-medium ${user.two_factor_enabled ? 'bg-green-900 text-green-200' : 'bg-gray-600 text-gray-200'}`;
  twoFactorStatus.textContent = user.two_factor_enabled ? 'Activé' : 'Désactivé';
  
  twoFactorSetting.appendChild(twoFactorLabel);
  twoFactorSetting.appendChild(twoFactorStatus);
  
  const logoutButton = document.createElement('button');
  logoutButton.className = 'w-full mt-6 px-4 py-3 bg-red-600 hover:bg-red-700 rounded text-white font-medium';
  logoutButton.textContent = 'Se déconnecter';
  logoutButton.addEventListener('click', () => {
    authService.logout();
    router.navigateTo('/');
  });
  
  settingsSection.appendChild(settingsTitle);
  settingsSection.appendChild(twoFactorSetting);
  settingsSection.appendChild(logoutButton);
  
  // Assembler le profil
  profileCard.appendChild(userInfoSection);
  profileCard.appendChild(statsSection);
  profileCard.appendChild(settingsSection);
  
  // Assembler la page
  profileContainer.appendChild(title);
  profileContainer.appendChild(profileCard);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(profileContainer);
}

/**
 * Obtient la couleur de fond en fonction du statut
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'in_game':
      return 'bg-blue-500';
    case 'away':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Formate une date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('fr-FR', options);
} 