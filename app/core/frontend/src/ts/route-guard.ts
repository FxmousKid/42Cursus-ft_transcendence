import { authService } from './auth';

/**
 * Script pour protéger les routes qui nécessitent une authentification
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Route guard initialized');
  
  // Définir les routes publiques (accessibles sans authentification)
  // Format: nom de la route sans extension
  const publicRoutes = [
    '',         // Page d'accueil (/, /index, /index.html)
    'index',    // Page d'accueil avec nom explicite
    'login',    // Page de connexion
    'register', // Page d'inscription
    'verify-2fa' // Page de vérification 2FA
  ];
  
  // Obtenir le chemin actuel
  const currentPath = window.location.pathname;
  
  // Extraction du nom de la route à partir du chemin
  // Cette fonction extrait "game" à partir de "/game", "/game.html" ou "/game/"
  const extractRouteName = (path: string): string => {
    // Enlever le slash initial si présent
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Gestion des cas où le chemin se termine par / (comme /game/)
    if (normalizedPath.endsWith('/')) {
      return normalizedPath.slice(0, -1);
    }
    
    // Enlever l'extension .html si présente
    const htmlExtIndex = normalizedPath.lastIndexOf('.html');
    if (htmlExtIndex !== -1) {
      return normalizedPath.substring(0, htmlExtIndex);
    }
    
    // Retirer tout ce qui vient après un slash (pour les sous-routes)
    const slashIndex = normalizedPath.indexOf('/');
    if (slashIndex !== -1) {
      return normalizedPath.substring(0, slashIndex);
    }
    
    return normalizedPath;
  };
  
  const routeName = extractRouteName(currentPath);
  console.log('Route guard: Current route is', routeName);
  
  // Check local storage and session storage for token presence
  const hasTokenInStorage = !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  console.log('Route guard: Token present in storage:', hasTokenInStorage);
  
  // Force authService to re-evaluate authentication status
  authService.restoreSession();
  
  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = authService.isAuthenticated();
  console.log('Route guard: User is authenticated:', isAuthenticated);
  
  // Si l'utilisateur est déjà connecté et tente d'accéder à login ou register,
  // le rediriger vers la page d'accueil
  if (isAuthenticated && (routeName === 'login' || routeName === 'register')) {
    console.log('Route guard: Redirecting authenticated user from auth page to home');
    window.location.href = '/';
    return;
  }
  
  // Si l'utilisateur n'est pas connecté et tente d'accéder à une page non publique,
  // le rediriger vers la page de login (au lieu de la page d'accueil)
  if (!isAuthenticated && !publicRoutes.includes(routeName)) {
    console.log('Route guard: Redirecting unauthenticated user to login page');
    window.location.href = '/login.html';
    return;
  }
}); 