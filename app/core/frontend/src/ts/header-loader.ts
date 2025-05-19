/**
 * Script pour charger le header approprié selon l'état d'authentification
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Header loader initialized');
  
  // Obtenir authService depuis le contexte global
  const authService = (window as any).authService;
  console.log('AuthService available in header-loader:', !!authService);
  
  const headerContainer = document.getElementById('header-container');
  
  if (!headerContainer) {
    console.error('Header container not found');
    return;
  }
  
  // Initialiser authService si disponible
  if (authService && authService.init) {
    console.log('Initializing auth service');
    authService.init();
  } else {
    console.warn('Auth service not available or missing init method');
  }
  
  // Vérifier si l'utilisateur est authentifié de façon sécurisée
  const isAuthenticated = authService && 
                        authService.isAuthenticated && 
                        typeof authService.isAuthenticated === 'function' && 
                        authService.isAuthenticated();
  
  console.log('User is authenticated:', isAuthenticated);
  
  // Charger le header approprié
  const headerFile = isAuthenticated ? 'components/header.html' : 'components/header-guest.html';
  console.log('Loading header file:', headerFile);
  
  fetch(headerFile)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      headerContainer.innerHTML = data;
      
      // Initialiser les comportements après le chargement du header
      initHeaderBehaviors(isAuthenticated);
    })
    .catch(error => {
      console.error('Erreur lors du chargement du header:', error);
      // En cas d'erreur, charger le header invité par défaut
      fetch('components/header-guest.html')
        .then(response => response.text())
        .then(data => {
          headerContainer.innerHTML = data;
          initHeaderBehaviors(false);
        });
    });
});

/**
 * Initialiser les comportements interactifs du header
 */
function initHeaderBehaviors(isAuthenticated: boolean) {
  console.log('Initializing header behaviors, authenticated:', isAuthenticated);
  
  // Menu mobile toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
  
  // Ne configurer les comportements de déconnexion que si l'utilisateur est authentifié
  if (isAuthenticated) {
    setupLogoutHandlers();
  }
}

/**
 * Configurer les gestionnaires d'événements pour la déconnexion
 */
function setupLogoutHandlers() {
  // Bouton de déconnexion
  const logoutButton = document.getElementById('logout-button');
  const mobileLogoutButton = document.getElementById('mobile-logout-button');
  const navLogoutButton = document.getElementById('nav-logout-button');
  const authService = (window as any).authService;
  
  const handleLogout = async (e: Event) => {
    e.preventDefault();
    try {
      // Afficher l'état de chargement sur le bouton utilisé
      const target = e.target as HTMLElement;
      if (target) {
        target.innerHTML = `<svg class="animate-spin h-4 w-4 mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Déconnexion...`;
      }
      
      // Déconnecter l'utilisateur via le service d'authentification
      await authService.logout();
      
      // Rediriger vers la page de connexion
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Rediriger quand même en cas d'erreur
      window.location.href = '/login.html';
    }
  };
  
  if (authService && authService.logout) {
    // Bouton de déconnexion du dropdown
    if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout);
    }
    
    // Bouton de déconnexion de la navigation desktop
    if (navLogoutButton) {
      navLogoutButton.addEventListener('click', handleLogout);
    }
    
    // Événement pour le bouton de déconnexion mobile
    if (mobileLogoutButton) {
      mobileLogoutButton.addEventListener('click', handleLogout);
    }
  }
} 