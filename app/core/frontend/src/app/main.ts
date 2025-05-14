import { router } from './utils/router';
import { renderHome } from './pages/home';
import { renderLogin } from './pages/login';
import { renderGame } from './pages/game';
import { renderProfile } from './pages/profile';
import { renderLeaderboard } from './pages/leaderboard';
import { renderNotFound } from './pages/not-found';
import { authService } from './services/auth';
import { toastUtils } from './utils/toast';
import { socketService } from './services/socket';

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser les services
  toastUtils.init();
  
  // Configurer les routes
  setupRoutes();
  
  // Initialiser l'authentification
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('current_user');
  
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      authService.setCurrentUser(user);
      
      // Connecter au service WebSocket si l'utilisateur est authentifié
      socketService.connect(token);
    } catch (e) {
      console.error('Erreur lors de la restauration de la session:', e);
      authService.logout();
    }
  }
  
  // Configurer les liens de navigation
  setupNavLinks();
  
  // Démarrer le routeur
  router.init();
});

/**
 * Configure les routes de l'application
 */
function setupRoutes(): void {
  // Routes publiques
  router.addPublicRoute('/', renderHome);
  router.addPublicRoute('/login', renderLogin);
  router.addPublicRoute('/leaderboard', renderLeaderboard);
  
  // Routes protégées (nécessitent une authentification)
  router.addProtectedRoute('/profile', renderProfile);
  router.addProtectedRoute('/game', renderGame);
  
  // Route 404 (page non trouvée)
  router.setNotFoundHandler(renderNotFound);
}

/**
 * Configure les liens de navigation
 */
function setupNavLinks(): void {
  const updateNavLinks = () => {
    const navLinksContainer = document.getElementById('nav-links');
    const authButtonsContainer = document.getElementById('auth-buttons');
    
    if (!navLinksContainer || !authButtonsContainer) return;
    
    // Vider les conteneurs
    navLinksContainer.innerHTML = '';
    authButtonsContainer.innerHTML = '';
    
    // Créer les liens de navigation communs
    const links = [
      { path: '/', text: 'Accueil' },
      { path: '/leaderboard', text: 'Classement' }
    ];
    
    // Ajouter les liens réservés aux utilisateurs connectés
    if (authService.isAuthenticated()) {
      links.push(
        { path: '/game', text: 'Jouer' },
        { path: '/profile', text: 'Profil' }
      );
    }
    
    // Ajouter les liens au conteneur
    links.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.path;
      linkElement.className = 'text-gray-300 hover:text-white px-3 py-2 text-sm font-medium';
      linkElement.textContent = link.text;
      
      // Mettre en évidence le lien actif
      if (window.location.pathname === link.path) {
        linkElement.className += ' bg-gray-900 text-white';
      }
      
      navLinksContainer.appendChild(linkElement);
    });
    
    // Ajouter les boutons d'authentification
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      
      // Afficher le nom d'utilisateur
      if (user) {
        const usernameElement = document.createElement('span');
        usernameElement.className = 'text-gray-300 px-3 py-2 text-sm font-medium';
        usernameElement.textContent = user.username;
        authButtonsContainer.appendChild(usernameElement);
      }
      
      // Bouton de déconnexion
      const logoutButton = document.createElement('button');
      logoutButton.className = 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium';
      logoutButton.textContent = 'Déconnexion';
      logoutButton.addEventListener('click', () => {
        authService.logout();
        router.navigateTo('/');
      });
      
      authButtonsContainer.appendChild(logoutButton);
    } else {
      // Bouton de connexion
      const loginButton = document.createElement('a');
      loginButton.href = '/login';
      loginButton.className = 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium';
      loginButton.textContent = 'Connexion';
      
      authButtonsContainer.appendChild(loginButton);
    }
  };
  
  // Mettre à jour les liens lors des changements d'authentification
  authService.onAuthChange(updateNavLinks);
  
  // Mettre à jour les liens immédiatement
  updateNavLinks();
} 