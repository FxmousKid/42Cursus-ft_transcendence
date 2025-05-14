import { GameState } from '../types/index';
import { socketService, SocketEvent } from '../services/socket';
import { authUtils } from '../utils/auth';
import { toastUtils } from '../utils/toast';
import { router } from '../utils/router';
import { authService } from '../services/auth';

// Game canvas dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Game elements dimensions
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_OFFSET = 30;

// Game colors
const BG_COLOR = '#111827';
const PADDLE_COLOR = '#ffffff';
const BALL_COLOR = '#3b82f6';
const TEXT_COLOR = '#ffffff';
const LINE_COLOR = '#4b5563';

// Game state
let gameState: GameState = {
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  player1Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
  player2Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
  player1Score: 0,
  player2Score: 0,
  gameStatus: 'waiting'
};

// Game variables
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number | null = null;
let currentPlayerId: number | null = null;
let opponentId: number | null = null;
let isPlayer1: boolean = false;

/**
 * Rendu de la page de jeu
 */
export function renderGame(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Créer le conteneur principal
  const gameContainer = document.createElement('div');
  gameContainer.className = 'flex flex-col items-center py-8 px-4';
  
  // Titre de la page
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mb-6 text-center';
  title.textContent = 'Jouer à Pong';
  
  // Créer l'interface de jeu
  const gameInterface = document.createElement('div');
  gameInterface.className = 'w-full max-w-6xl mb-8';
  
  // Options de jeu
  const gameOptions = document.createElement('div');
  gameOptions.className = 'bg-gray-800 rounded-lg p-6 mb-8 shadow-lg';
  
  const optionsTitle = document.createElement('h2');
  optionsTitle.className = 'text-xl font-bold mb-4';
  optionsTitle.textContent = 'Options de jeu';
  
  // Grille d'options
  const optionsGrid = document.createElement('div');
  optionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
  
  // Mode de jeu
  const gameModeCard = createOptionCard(
    'Mode de jeu',
    'Choisissez votre façon de jouer',
    [
      { id: 'classic', label: 'Classique', active: true },
      { id: 'custom', label: 'Personnalisé', active: false }
    ]
  );
  
  // Type de match
  const matchTypeCard = createOptionCard(
    'Type de match',
    'Choisissez contre qui jouer',
    [
      { id: 'random', label: 'Joueur aléatoire', active: true },
      { id: 'friend', label: 'Ami', active: false },
      { id: 'ai', label: 'Intelligence artificielle', active: false }
    ]
  );
  
  // Assembler les options
  optionsGrid.appendChild(gameModeCard);
  optionsGrid.appendChild(matchTypeCard);
  
  gameOptions.appendChild(optionsTitle);
  gameOptions.appendChild(optionsGrid);
  
  // Bouton de recherche de partie
  const findGameButton = document.createElement('button');
  findGameButton.className = 'w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded transition';
  findGameButton.textContent = 'Rechercher une partie';
  findGameButton.addEventListener('click', () => {
    showSearchingGame(gameInterface);
  });
  
  gameOptions.appendChild(findGameButton);
  
  // Joueurs en ligne
  const onlinePlayers = document.createElement('div');
  onlinePlayers.className = 'bg-gray-800 rounded-lg p-6 shadow-lg';
  
  const onlineTitle = document.createElement('h2');
  onlineTitle.className = 'text-xl font-bold mb-4';
  onlineTitle.textContent = 'Joueurs en ligne';
  
  const playersList = document.createElement('div');
  playersList.className = 'space-y-2';
  
  // Créer des joueurs fictifs
  const fakePlayers = [
    { username: 'Player1', status: 'online' },
    { username: 'Player2', status: 'in_game' },
    { username: 'Player3', status: 'online' },
    { username: 'Player4', status: 'online' },
    { username: 'Player5', status: 'in_game' }
  ];
  
  fakePlayers.forEach(player => {
    const playerItem = document.createElement('div');
    playerItem.className = 'flex items-center justify-between p-3 bg-gray-700 rounded';
    
    const playerInfo = document.createElement('div');
    playerInfo.className = 'flex items-center';
    
    const statusDot = document.createElement('div');
    statusDot.className = `w-3 h-3 rounded-full mr-3 ${player.status === 'online' ? 'bg-green-500' : 'bg-blue-500'}`;
    
    const playerName = document.createElement('span');
    playerName.textContent = player.username;
    
    const inviteButton = document.createElement('button');
    inviteButton.className = 'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition';
    inviteButton.textContent = 'Inviter';
    inviteButton.disabled = player.status === 'in_game';
    
    if (player.status === 'in_game') {
      inviteButton.className = 'px-3 py-1 bg-gray-600 text-gray-400 text-sm rounded cursor-not-allowed';
    }
    
    inviteButton.addEventListener('click', () => {
      if (player.status === 'online') {
        toastUtils.info(`Invitation envoyée à ${player.username}`);
      }
    });
    
    playerInfo.appendChild(statusDot);
    playerInfo.appendChild(playerName);
    playerItem.appendChild(playerInfo);
    playerItem.appendChild(inviteButton);
    
    playersList.appendChild(playerItem);
  });
  
  onlinePlayers.appendChild(onlineTitle);
  onlinePlayers.appendChild(playersList);
  
  // Assembler l'interface de jeu
  gameInterface.appendChild(gameOptions);
  gameInterface.appendChild(onlinePlayers);
  
  // Assembler la page
  gameContainer.appendChild(title);
  gameContainer.appendChild(gameInterface);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(gameContainer);
}

/**
 * Crée une carte d'option avec des sélecteurs de bouton
 */
function createOptionCard(title: string, description: string, options: { id: string, label: string, active: boolean }[]): HTMLElement {
  const card = document.createElement('div');
  card.className = 'bg-gray-700 p-4 rounded';
  
  const cardTitle = document.createElement('h3');
  cardTitle.className = 'font-bold text-lg mb-1';
  cardTitle.textContent = title;
  
  const cardDesc = document.createElement('p');
  cardDesc.className = 'text-gray-400 text-sm mb-4';
  cardDesc.textContent = description;
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'space-y-2';
  
  options.forEach(option => {
    const optionButton = document.createElement('button');
    optionButton.className = `w-full py-2 px-4 rounded text-center text-sm font-medium transition ${
      option.active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
    }`;
    optionButton.textContent = option.label;
    optionButton.dataset.id = option.id;
    
    optionButton.addEventListener('click', () => {
      // Désactiver tous les boutons de ce groupe
      const buttons = optionsContainer.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.className = 'w-full py-2 px-4 rounded text-center text-sm font-medium transition bg-gray-600 text-gray-300 hover:bg-gray-500';
      });
      
      // Activer le bouton cliqué
      optionButton.className = 'w-full py-2 px-4 rounded text-center text-sm font-medium transition bg-blue-600 text-white';
    });
    
    optionsContainer.appendChild(optionButton);
  });
  
  card.appendChild(cardTitle);
  card.appendChild(cardDesc);
  card.appendChild(optionsContainer);
  
  return card;
}

/**
 * Affiche l'interface de recherche de partie
 */
function showSearchingGame(container: HTMLElement): void {
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer l'interface de recherche
  const searchingCard = document.createElement('div');
  searchingCard.className = 'bg-gray-800 rounded-lg p-8 w-full flex flex-col items-center text-center shadow-lg';
  
  // Animation de chargement
  const loadingAnimation = document.createElement('div');
  loadingAnimation.className = 'mb-6';
  loadingAnimation.innerHTML = `
    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
  `;
  
  // Titre
  const searchingTitle = document.createElement('h2');
  searchingTitle.className = 'text-2xl font-bold mb-2';
  searchingTitle.textContent = 'Recherche d\'un adversaire...';
  
  // Message d'attente
  const searchingMessage = document.createElement('p');
  searchingMessage.className = 'text-gray-400 mb-8';
  searchingMessage.textContent = 'Veuillez patienter pendant que nous recherchons un adversaire pour vous.';
  
  // Compteur de temps
  const timeCounter = document.createElement('p');
  timeCounter.className = 'text-xl font-bold mb-8';
  timeCounter.textContent = '00:00';
  
  // Bouton d'annulation
  const cancelButton = document.createElement('button');
  cancelButton.className = 'px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition';
  cancelButton.textContent = 'Annuler la recherche';
  cancelButton.addEventListener('click', () => {
    // Recharger la page de jeu
    renderGame();
  });
  
  // Assembler la carte de recherche
  searchingCard.appendChild(loadingAnimation);
  searchingCard.appendChild(searchingTitle);
  searchingCard.appendChild(searchingMessage);
  searchingCard.appendChild(timeCounter);
  searchingCard.appendChild(cancelButton);
  
  // Ajouter au conteneur
  container.appendChild(searchingCard);
  
  // Démarrer le compteur
  let seconds = 0;
  const updateTime = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timeCounter.textContent = `${mins}:${secs}`;
    
    // Simuler une partie trouvée après 5 secondes
    if (seconds === 5) {
      clearInterval(updateTime);
      showGameFound(container);
    }
  }, 1000);
}

/**
 * Affiche l'interface de partie trouvée
 */
function showGameFound(container: HTMLElement): void {
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer l'interface de partie trouvée
  const gameFoundCard = document.createElement('div');
  gameFoundCard.className = 'bg-gray-800 rounded-lg p-8 w-full flex flex-col items-center text-center shadow-lg';
  
  // Icône de succès
  const successIcon = document.createElement('div');
  successIcon.className = 'text-green-500 mb-6';
  successIcon.innerHTML = `
    <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
    </svg>
  `;
  
  // Titre
  const gameFoundTitle = document.createElement('h2');
  gameFoundTitle.className = 'text-2xl font-bold mb-2';
  gameFoundTitle.textContent = 'Adversaire trouvé !';
  
  // Joueurs
  const playersContainer = document.createElement('div');
  playersContainer.className = 'flex items-center justify-center space-x-8 my-8';
  
  // Utilisateur actuel
  const currentUser = authService.getCurrentUser();
  
  const player1 = document.createElement('div');
  player1.className = 'flex flex-col items-center';
  
  const player1Avatar = document.createElement('div');
  player1Avatar.className = 'w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center mb-2 text-2xl font-bold';
  player1Avatar.textContent = currentUser?.username.charAt(0).toUpperCase() || 'Y';
  
  const player1Name = document.createElement('p');
  player1Name.className = 'font-medium';
  player1Name.textContent = currentUser?.username || 'You';
  
  player1.appendChild(player1Avatar);
  player1.appendChild(player1Name);
  
  // Texte VS
  const vsText = document.createElement('div');
  vsText.className = 'text-2xl font-bold text-gray-500';
  vsText.textContent = 'VS';
  
  // Adversaire fictif
  const player2 = document.createElement('div');
  player2.className = 'flex flex-col items-center';
  
  const player2Avatar = document.createElement('div');
  player2Avatar.className = 'w-20 h-20 rounded-full bg-red-700 flex items-center justify-center mb-2 text-2xl font-bold';
  player2Avatar.textContent = 'O';
  
  const player2Name = document.createElement('p');
  player2Name.className = 'font-medium';
  player2Name.textContent = 'Opponent';
  
  player2.appendChild(player2Avatar);
  player2.appendChild(player2Name);
  
  // Assembler les joueurs
  playersContainer.appendChild(player1);
  playersContainer.appendChild(vsText);
  playersContainer.appendChild(player2);
  
  // Compte à rebours
  const countdownContainer = document.createElement('div');
  countdownContainer.className = 'mb-8';
  
  const countdownText = document.createElement('p');
  countdownText.className = 'text-sm text-gray-400 mb-2';
  countdownText.textContent = 'La partie commence dans';
  
  const countdownNumber = document.createElement('div');
  countdownNumber.className = 'text-4xl font-bold';
  countdownNumber.textContent = '5';
  
  countdownContainer.appendChild(countdownText);
  countdownContainer.appendChild(countdownNumber);
  
  // Bouton pour refuser la partie
  const declineButton = document.createElement('button');
  declineButton.className = 'px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition';
  declineButton.textContent = 'Refuser la partie';
  declineButton.addEventListener('click', () => {
    renderGame();
  });
  
  // Assembler la carte
  gameFoundCard.appendChild(successIcon);
  gameFoundCard.appendChild(gameFoundTitle);
  gameFoundCard.appendChild(playersContainer);
  gameFoundCard.appendChild(countdownContainer);
  gameFoundCard.appendChild(declineButton);
  
  // Ajouter au conteneur
  container.appendChild(gameFoundCard);
  
  // Démarrer le compte à rebours
  let countdown = 5;
  const updateCountdown = setInterval(() => {
    countdown--;
    countdownNumber.textContent = countdown.toString();
    
    if (countdown === 0) {
      clearInterval(updateCountdown);
      showGameCanvas(container);
    }
  }, 1000);
}

/**
 * Affiche le canvas du jeu
 */
function showGameCanvas(container: HTMLElement): void {
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer la zone de jeu
  const gameArea = document.createElement('div');
  gameArea.className = 'flex flex-col items-center w-full';
  
  // Score
  const scoreBoard = document.createElement('div');
  scoreBoard.className = 'flex justify-center items-center space-x-8 mb-4';
  
  // Score du joueur 1
  const player1Score = document.createElement('div');
  player1Score.className = 'text-4xl font-bold';
  player1Score.textContent = '0';
  player1Score.id = 'player1-score';
  
  // Séparateur
  const scoreSeparator = document.createElement('div');
  scoreSeparator.className = 'text-4xl font-bold';
  scoreSeparator.textContent = '-';
  
  // Score du joueur 2
  const player2Score = document.createElement('div');
  player2Score.className = 'text-4xl font-bold';
  player2Score.textContent = '0';
  player2Score.id = 'player2-score';
  
  // Assembler le tableau de score
  scoreBoard.appendChild(player1Score);
  scoreBoard.appendChild(scoreSeparator);
  scoreBoard.appendChild(player2Score);
  
  // Canvas du jeu
  const gameCanvas = document.createElement('canvas');
  gameCanvas.width = 800;
  gameCanvas.height = 400;
  gameCanvas.className = 'bg-black rounded-lg border-2 border-gray-700 shadow-lg';
  gameCanvas.id = 'game-canvas';
  
  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'mt-6 text-center text-gray-400 max-w-lg';
  instructions.textContent = 'Utilisez les touches flèche haut et flèche bas ou la souris pour déplacer votre raquette.';
  
  // Bouton pour abandonner
  const quitButton = document.createElement('button');
  quitButton.className = 'mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition';
  quitButton.textContent = 'Abandonner la partie';
  quitButton.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir abandonner la partie ?')) {
      renderGame();
    }
  });
  
  // Assembler la zone de jeu
  gameArea.appendChild(scoreBoard);
  gameArea.appendChild(gameCanvas);
  gameArea.appendChild(instructions);
  gameArea.appendChild(quitButton);
  
  // Ajouter au conteneur
  container.appendChild(gameArea);
  
  // Initialiser le jeu
  initGame(gameCanvas);
}

/**
 * Définition des états du jeu
 */
interface GameState {
  player1Y: number;
  player2Y: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  paddleWidth: number;
  paddleHeight: number;
  ballSize: number;
  player1Score: number;
  player2Score: number;
  gameOver: boolean;
}

/**
 * Initialise le jeu de Pong
 */
function initGame(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Variables du jeu
  const state: GameState = {
    player1Y: canvas.height / 2 - 40,
    player2Y: canvas.height / 2 - 40,
    ballX: canvas.width / 2,
    ballY: canvas.height / 2,
    ballSpeedX: 5,
    ballSpeedY: 3,
    paddleWidth: 10,
    paddleHeight: 80,
    ballSize: 10,
    player1Score: 0,
    player2Score: 0,
    gameOver: false
  };
  
  // Contrôles de la souris
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    state.player1Y = Math.max(0, Math.min(canvas.height - state.paddleHeight, mouseY - state.paddleHeight / 2));
  });
  
  // Contrôles du clavier
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      state.player1Y = Math.max(0, state.player1Y - 20);
    } else if (e.key === 'ArrowDown') {
      state.player1Y = Math.min(canvas.height - state.paddleHeight, state.player1Y + 20);
    }
  });
  
  // IA simple pour le joueur 2
  function updateAI() {
    const paddleCenter = state.player2Y + state.paddleHeight / 2;
    const ballCenter = state.ballY;
    const diff = ballCenter - paddleCenter;
    
    // Ajouter un délai de réaction pour que l'IA ne soit pas imbattable
    if (diff > 10) {
      state.player2Y += 4;
    } else if (diff < -10) {
      state.player2Y -= 4;
    }
    
    // Assurer que la raquette reste dans les limites
    state.player2Y = Math.max(0, Math.min(canvas.height - state.paddleHeight, state.player2Y));
  }
  
  // Mettre à jour la balle
  function updateBall() {
    // Déplacer la balle
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;
    
    // Collision avec les bords haut et bas
    if (state.ballY <= 0 || state.ballY >= canvas.height - state.ballSize) {
      state.ballSpeedY = -state.ballSpeedY;
    }
    
    // Collision avec la raquette du joueur 1
    if (
      state.ballX <= state.paddleWidth && 
      state.ballY >= state.player1Y && 
      state.ballY <= state.player1Y + state.paddleHeight
    ) {
      state.ballSpeedX = -state.ballSpeedX;
      // Modifier l'angle en fonction de l'endroit où la balle frappe la raquette
      const relativeIntersect = (state.player1Y + state.paddleHeight / 2) - state.ballY;
      state.ballSpeedY = relativeIntersect * -0.1;
    }
    
    // Collision avec la raquette du joueur 2
    if (
      state.ballX >= canvas.width - state.paddleWidth - state.ballSize && 
      state.ballY >= state.player2Y && 
      state.ballY <= state.player2Y + state.paddleHeight
    ) {
      state.ballSpeedX = -state.ballSpeedX;
      // Modifier l'angle en fonction de l'endroit où la balle frappe la raquette
      const relativeIntersect = (state.player2Y + state.paddleHeight / 2) - state.ballY;
      state.ballSpeedY = relativeIntersect * -0.1;
    }
    
    // Si la balle sort du terrain (point marqué)
    if (state.ballX < 0) {
      // Joueur 2 marque
      state.player2Score++;
      updateScoreDisplay();
      resetBall();
    } else if (state.ballX > canvas.width) {
      // Joueur 1 marque
      state.player1Score++;
      updateScoreDisplay();
      resetBall();
    }
    
    // Vérifier la fin de la partie
    if (state.player1Score >= 5 || state.player2Score >= 5) {
      state.gameOver = true;
      showGameOver();
    }
  }
  
  // Réinitialiser la balle après un point
  function resetBall() {
    state.ballX = canvas.width / 2;
    state.ballY = canvas.height / 2;
    state.ballSpeedX = -state.ballSpeedX;
    state.ballSpeedY = Math.random() * 6 - 3;
  }
  
  // Mettre à jour l'affichage du score
  function updateScoreDisplay() {
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    
    if (player1ScoreElement) {
      player1ScoreElement.textContent = state.player1Score.toString();
    }
    
    if (player2ScoreElement) {
      player2ScoreElement.textContent = state.player2Score.toString();
    }
  }
  
  // Afficher le message de fin de partie
  function showGameOver() {
    const winner = state.player1Score > state.player2Score ? 'Vous avez' : 'L\'adversaire a';
    
    toastUtils.success(`Partie terminée ! ${winner} gagné !`);
    
    // Attendre un peu avant de revenir au menu
    setTimeout(() => {
      renderGame();
    }, 3000);
  }
  
  // Dessiner le jeu
  function draw() {
    if (!ctx) return;
    
    // Effacer le canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la ligne médiane
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dessiner les raquettes
    ctx.fillStyle = 'white';
    
    // Raquette joueur 1 (gauche)
    ctx.fillRect(0, state.player1Y, state.paddleWidth, state.paddleHeight);
    
    // Raquette joueur 2 (droite)
    ctx.fillRect(canvas.width - state.paddleWidth, state.player2Y, state.paddleWidth, state.paddleHeight);
    
    // Dessiner la balle
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, state.ballSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Boucle de jeu principale
  function gameLoop() {
    if (!state.gameOver) {
      updateAI();
      updateBall();
      draw();
      requestAnimationFrame(gameLoop);
    }
  }
  
  // Démarrer le jeu
  gameLoop();
}