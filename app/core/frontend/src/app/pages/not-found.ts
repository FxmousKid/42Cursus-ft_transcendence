import { router } from '../utils/router';

/**
 * Rendu de la page 404 (non trouvée)
 */
export function renderNotFound(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Créer le conteneur principal
  const notFoundContainer = document.createElement('div');
  notFoundContainer.className = 'flex flex-col items-center justify-center py-20 px-4 text-center';
  
  // Icône d'erreur
  const errorIcon = document.createElement('div');
  errorIcon.className = 'text-red-500 mb-6';
  errorIcon.innerHTML = `
    <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  `;
  
  // Titre d'erreur
  const errorTitle = document.createElement('h1');
  errorTitle.className = 'text-5xl font-bold mb-4';
  errorTitle.textContent = '404';
  
  // Sous-titre 
  const errorSubtitle = document.createElement('h2');
  errorSubtitle.className = 'text-2xl font-semibold mb-2';
  errorSubtitle.textContent = 'Page non trouvée';
  
  // Message d'erreur
  const errorMessage = document.createElement('p');
  errorMessage.className = 'text-gray-400 max-w-md mx-auto mb-8';
  errorMessage.textContent = 'La page que vous recherchez n\'existe pas ou a été déplacée.';
  
  // Bouton pour retourner à l'accueil
  const homeButton = document.createElement('button');
  homeButton.className = 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition';
  homeButton.textContent = 'Retourner à l\'accueil';
  homeButton.addEventListener('click', () => {
    router.navigateTo('/');
  });
  
  // Assembler la page
  notFoundContainer.appendChild(errorIcon);
  notFoundContainer.appendChild(errorTitle);
  notFoundContainer.appendChild(errorSubtitle);
  notFoundContainer.appendChild(errorMessage);
  notFoundContainer.appendChild(homeButton);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(notFoundContainer);
} 