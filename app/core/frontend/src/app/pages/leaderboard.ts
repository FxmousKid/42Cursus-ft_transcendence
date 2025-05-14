import { router } from '../utils/router';
import { toastUtils } from '../utils/toast';

/**
 * Rendu de la page de classement
 */
export function renderLeaderboard(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Créer le conteneur principal
  const leaderboardContainer = document.createElement('div');
  leaderboardContainer.className = 'flex flex-col items-center py-16 px-4';
  
  // Titre de la page
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mb-8 text-center';
  title.textContent = 'Classement mondial';
  
  // Sous-titre
  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-400 mb-12 text-center max-w-2xl';
  subtitle.textContent = 'Découvrez les meilleurs joueurs de Transcendence et affrontez-les pour grimper dans le classement.';
  
  // Créer la table de classement
  const leaderboardCard = document.createElement('div');
  leaderboardCard.className = 'bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl overflow-hidden';
  
  // En-tête de la table
  const tableHeader = document.createElement('div');
  tableHeader.className = 'bg-gray-700 p-4 flex text-gray-300 font-semibold';
  
  tableHeader.innerHTML = `
    <div class="w-16 text-center">Rang</div>
    <div class="flex-1 ml-4">Joueur</div>
    <div class="w-20 text-center">Parties</div>
    <div class="w-24 text-center">Victoires</div>
    <div class="w-24 text-center">% Victoire</div>
    <div class="w-20 text-center">Score</div>
  `;
  
  leaderboardCard.appendChild(tableHeader);
  
  // Corps de la table avec données factices
  const tableBody = document.createElement('div');
  tableBody.className = 'divide-y divide-gray-700';
  
  // Créer des entrées factices pour le classement
  const players = [
    { rank: 1, username: 'Champion42', avatar_url: '', matches: 120, wins: 98, winRate: 0.82, score: 1850 },
    { rank: 2, username: 'PongMaster', avatar_url: '', matches: 85, wins: 65, winRate: 0.76, score: 1720 },
    { rank: 3, username: 'LeDemineur', avatar_url: '', matches: 90, wins: 67, winRate: 0.74, score: 1690 },
    { rank: 4, username: 'Borntowin', avatar_url: '', matches: 150, wins: 105, winRate: 0.70, score: 1640 },
    { rank: 5, username: 'Paddlejedi', avatar_url: '', matches: 75, wins: 51, winRate: 0.68, score: 1590 },
    { rank: 6, username: 'BigPong', avatar_url: '', matches: 110, wins: 71, winRate: 0.65, score: 1510 },
    { rank: 7, username: 'NoobMaster69', avatar_url: '', matches: 200, wins: 120, winRate: 0.60, score: 1480 },
    { rank: 8, username: 'PingPongPro', avatar_url: '', matches: 95, wins: 55, winRate: 0.58, score: 1450 },
    { rank: 9, username: 'Victoireassuree', avatar_url: '', matches: 65, wins: 37, winRate: 0.57, score: 1420 },
    { rank: 10, username: 'LastChance', avatar_url: '', matches: 55, wins: 29, winRate: 0.53, score: 1390 },
  ];
  
  players.forEach(player => {
    const row = document.createElement('div');
    row.className = 'p-4 flex items-center hover:bg-gray-750 transition cursor-pointer';
    
    // Mettre en évidence les trois premiers
    const isTopThree = player.rank <= 3;
    
    row.innerHTML = `
      <div class="w-16 text-center font-bold ${getRankColor(player.rank)}">#${player.rank}</div>
      <div class="flex-1 ml-4 flex items-center">
        <div class="w-10 h-10 rounded-full bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
          ${player.avatar_url ? `<img src="${player.avatar_url}" alt="${player.username}" class="w-full h-full object-cover">` : 
          `<span class="text-lg font-bold text-gray-400">${player.username.charAt(0).toUpperCase()}</span>`}
        </div>
        <span class="font-medium ${isTopThree ? 'text-yellow-400' : ''}">${player.username}</span>
      </div>
      <div class="w-20 text-center">${player.matches}</div>
      <div class="w-24 text-center">${player.wins}</div>
      <div class="w-24 text-center">${Math.round(player.winRate * 100)}%</div>
      <div class="w-20 text-center font-bold">${player.score}</div>
    `;
    
    row.addEventListener('click', () => {
      toastUtils.info('Fonctionnalité de visualisation de profil en cours de développement');
    });
    
    tableBody.appendChild(row);
  });
  
  leaderboardCard.appendChild(tableBody);
  
  // Ajouter une pagination factice
  const pagination = document.createElement('div');
  pagination.className = 'bg-gray-700 p-4 flex justify-between items-center';
  
  pagination.innerHTML = `
    <button class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Précédent</button>
    <div class="text-gray-300">Page 1 sur 5</div>
    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Suivant</button>
  `;
  
  leaderboardCard.appendChild(pagination);
  
  // Ajouter un bouton pour jouer
  const playButton = document.createElement('button');
  playButton.className = 'mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-lg transition shadow-lg';
  playButton.textContent = 'Jouer et améliorer votre classement';
  playButton.addEventListener('click', () => {
    router.navigateTo('/game');
  });
  
  // Assembler la page
  leaderboardContainer.appendChild(title);
  leaderboardContainer.appendChild(subtitle);
  leaderboardContainer.appendChild(leaderboardCard);
  leaderboardContainer.appendChild(playButton);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(leaderboardContainer);
}

/**
 * Obtient la couleur en fonction du rang
 */
function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-400'; // Or
    case 2:
      return 'text-gray-300'; // Argent
    case 3:
      return 'text-amber-600'; // Bronze
    default:
      return 'text-gray-400';
  }
} 