import { router } from '../utils/router';
import { authService } from '../services/auth';

/**
 * Rendu de la page d'accueil
 */
export function renderHome(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Créer le conteneur principal
  const homeContainer = document.createElement('div');
  homeContainer.className = 'flex flex-col items-center py-16 px-4';
  
  // Créer le titre principal
  const mainTitle = document.createElement('h1');
  mainTitle.className = 'text-5xl font-bold text-center mb-6';
  mainTitle.textContent = 'Transcendence';
  
  // Créer le sous-titre
  const subtitle = document.createElement('p');
  subtitle.className = 'text-2xl text-gray-300 text-center mb-12 max-w-2xl';
  subtitle.textContent = 'Découvrez le légendaire jeu de Pong revisité, affrontez des joueurs du monde entier et grimpez dans le classement !';
  
  // Créer le conteneur pour les cartes
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full mb-16';
  
  // Ajouter les cartes
  cardsContainer.appendChild(createFeatureCard(
    'Jouez en ligne',
    'Affrontez d\'autres joueurs en temps réel dans des matchs compétitifs pour améliorer votre classement.',
    '<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    () => router.navigateTo('/game')
  ));
  
  cardsContainer.appendChild(createFeatureCard(
    'Classement mondial',
    'Consultez le classement des meilleurs joueurs et visez le sommet en remportant des matchs.',
    '<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
    () => router.navigateTo('/leaderboard')
  ));
  
  cardsContainer.appendChild(createFeatureCard(
    'Profil personnalisé',
    'Personnalisez votre profil, suivez vos statistiques et affichez vos succès.',
    '<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
    () => router.navigateTo('/profile')
  ));
  
  // Créer le bouton d'action principal
  const ctaButton = document.createElement('button');
  ctaButton.className = 'px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition shadow-lg';
  
  // Le texte et l'action du bouton dépendent de l'état d'authentification
  if (authService.isAuthenticated()) {
    ctaButton.textContent = 'Jouer maintenant';
    ctaButton.addEventListener('click', () => router.navigateTo('/game'));
  } else {
    ctaButton.textContent = 'Commencer';
    ctaButton.addEventListener('click', () => router.navigateTo('/login'));
  }
  
  // Assembler la page
  homeContainer.appendChild(mainTitle);
  homeContainer.appendChild(subtitle);
  homeContainer.appendChild(cardsContainer);
  homeContainer.appendChild(ctaButton);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(homeContainer);
}

/**
 * Crée une carte pour présenter une fonctionnalité
 */
function createFeatureCard(title: string, description: string, iconSvg: string, onClick: () => void): HTMLElement {
  const card = document.createElement('div');
  card.className = 'bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center shadow-lg hover:bg-gray-700 transition cursor-pointer';
  card.addEventListener('click', onClick);
  
  const iconContainer = document.createElement('div');
  iconContainer.className = 'bg-blue-800 p-3 rounded-full mb-4 text-blue-200';
  iconContainer.innerHTML = iconSvg;
  
  const cardTitle = document.createElement('h3');
  cardTitle.className = 'text-xl font-bold mb-2';
  cardTitle.textContent = title;
  
  const cardDescription = document.createElement('p');
  cardDescription.className = 'text-gray-400';
  cardDescription.textContent = description;
  
  card.appendChild(iconContainer);
  card.appendChild(cardTitle);
  card.appendChild(cardDescription);
  
  return card;
} 