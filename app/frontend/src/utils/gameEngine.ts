export interface GameState {
  ball: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    radius: number;
    speed: number;
  };
  playerPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
  };
  computerPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
  };
  gameWidth: number;
  gameHeight: number;
  playerScore: number;
  computerScore: number;
  isGameActive: boolean;
  isPaused: boolean;
  isCountingDown: boolean;
  countdownValue: number | null;
  keysPressed: Set<string>;
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'local' | 'ai' | 'online';
}

// Difficulté du jeu - affecte la vitesse et la réactivité de l'IA
const difficultySettings = {
  easy: { 
    paddleSpeed: 5, 
    initialBallSpeed: 5, 
    ballSpeedIncrement: 0.1,
    aiReactionDelay: 100,
    aiErrorMargin: 0.3
  },
  medium: { 
    paddleSpeed: 7, 
    initialBallSpeed: 7, 
    ballSpeedIncrement: 0.2,
    aiReactionDelay: 60,
    aiErrorMargin: 0.2
  },
  hard: { 
    paddleSpeed: 9, 
    initialBallSpeed: 9, 
    ballSpeedIncrement: 0.3,
    aiReactionDelay: 30,
    aiErrorMargin: 0.1
  }
};

// Initialiser l'état du jeu
export const initGameState = (width: number, height: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium', mode: 'local' | 'ai' | 'online' = 'local'): GameState => {
  const paddleHeight = height * 0.15;
  const paddleWidth = width * 0.02;
  const ballRadius = width * 0.015;
  
  const settings = difficultySettings[difficulty];
  
  return {
    ball: {
      x: width / 2,
      y: height / 2,
      velocityX: 0,
      velocityY: 0,
      radius: ballRadius,
      speed: settings.initialBallSpeed,
    },
    playerPaddle: {
      x: paddleWidth * 2,
      y: height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: settings.paddleSpeed,
    },
    computerPaddle: {
      x: width - paddleWidth * 3,
      y: height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: settings.paddleSpeed,
    },
    gameWidth: width,
    gameHeight: height,
    playerScore: 0,
    computerScore: 0,
    isGameActive: false,
    isPaused: false,
    isCountingDown: false,
    countdownValue: null,
    keysPressed: new Set<string>(),
    difficulty,
    mode
  };
};

// Lancer le décompte avant de démarrer le jeu
export const startCountdown = (state: GameState): GameState => {
  const newState = { ...state };
  newState.isCountingDown = true;
  newState.countdownValue = 3;
  newState.isPaused = false;
  return newState;
};

// Réduire le décompte
export const decrementCountdown = (state: GameState): GameState => {
  const newState = { ...state };
  
  if (newState.countdownValue && newState.countdownValue > 1) {
    newState.countdownValue -= 1;
  } else {
    newState.countdownValue = null;
    newState.isCountingDown = false;
    newState.isGameActive = true;
    startBall(newState);
  }
  
  return newState;
};

// Mettre le jeu en pause/reprendre
export const togglePause = (state: GameState): GameState => {
  const newState = { ...state };
  newState.isPaused = !newState.isPaused;
  return newState;
};

// Réinitialiser le jeu complet
export const resetGame = (state: GameState): GameState => {
  const settings = difficultySettings[state.difficulty];
  
  return {
    ...state,
    ball: {
      ...state.ball,
      x: state.gameWidth / 2,
      y: state.gameHeight / 2,
      velocityX: 0,
      velocityY: 0,
      speed: settings.initialBallSpeed
    },
    playerPaddle: {
      ...state.playerPaddle,
      y: state.gameHeight / 2 - state.playerPaddle.height / 2
    },
    computerPaddle: {
      ...state.computerPaddle,
      y: state.gameHeight / 2 - state.computerPaddle.height / 2
    },
    playerScore: 0,
    computerScore: 0,
    isGameActive: false,
    isPaused: false,
    isCountingDown: false,
    countdownValue: null
  };
};

// Lancer la balle dans une direction aléatoire
export const startBall = (state: GameState): void => {
  const randomAngle = (Math.random() * Math.PI / 4) - Math.PI / 8;
  const direction = Math.random() > 0.5 ? 1 : -1;
  
  state.ball.velocityX = direction * state.ball.speed * Math.cos(randomAngle);
  state.ball.velocityY = state.ball.speed * Math.sin(randomAngle);
};

// Réinitialiser la balle après un point marqué
export const resetBall = (state: GameState, direction: number): void => {
  const settings = difficultySettings[state.difficulty];
  
  state.ball.x = state.gameWidth / 2;
  state.ball.y = state.gameHeight / 2;
  state.ball.speed = settings.initialBallSpeed;
  state.ball.velocityX = 0;
  state.ball.velocityY = 0;
  
  // Ajouter un petit délai avant de relancer la balle
  setTimeout(() => {
    if (state.isGameActive && !state.isPaused) {
      state.ball.velocityX = direction * state.ball.speed * Math.cos(Math.PI / 4);
      state.ball.velocityY = state.ball.speed * Math.sin(Math.PI / 4);
    }
  }, 1000);
};

// Gérer la collision entre la balle et une raquette
export const handlePaddleCollision = (state: GameState, paddle: typeof state.playerPaddle, isLeft: boolean): void => {
  // Calculer le point de collision relatif (-1 en haut, 1 en bas)
  const collidePoint = (state.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
  
  // Calculer l'angle de rebond (max 75 degrés)
  const bounceAngle = collidePoint * (Math.PI / 2.4);
  
  // Calculer la nouvelle direction
  const direction = isLeft ? 1 : -1;
  const settings = difficultySettings[state.difficulty];
  
  state.ball.velocityX = direction * state.ball.speed * Math.cos(bounceAngle);
  state.ball.velocityY = state.ball.speed * Math.sin(bounceAngle);
  
  // Augmenter légèrement la vitesse de la balle à chaque rebond
  state.ball.speed += settings.ballSpeedIncrement;
};

// Mettre à jour l'état du jeu pour chaque frame
export const updateGameState = (state: GameState): GameState => {
  if (!state.isGameActive || state.isPaused || state.isCountingDown) return state;

  const newState = { ...state };
  
  // Déplacer la balle
  newState.ball.x += newState.ball.velocityX;
  newState.ball.y += newState.ball.velocityY;
  
  // Collision avec les murs supérieur et inférieur
  if (newState.ball.y - newState.ball.radius <= 0 || 
      newState.ball.y + newState.ball.radius >= newState.gameHeight) {
    // Ajouter un facteur aléatoire pour éviter les motifs prévisibles
    const randomFactor = 1 + (Math.random() * 0.05 - 0.025);
    
    newState.ball.velocityY = -newState.ball.velocityY * randomFactor;
    
    // Ajuster la position pour éviter que la balle ne reste coincée
    if (newState.ball.y - newState.ball.radius <= 0) {
      newState.ball.y = newState.ball.radius;
    } else {
      newState.ball.y = newState.gameHeight - newState.ball.radius;
    }
  }
  
  // Vérifier si la balle est du côté du joueur ou de l'ordinateur
  const isPlayerSide = newState.ball.x < newState.gameWidth / 2;
  
  // Déterminer quelle raquette vérifier pour la collision
  const paddle = isPlayerSide ? newState.playerPaddle : newState.computerPaddle;
  
  // Vérifier la collision avec les raquettes
  if (
    newState.ball.x - newState.ball.radius < paddle.x + paddle.width &&
    newState.ball.x + newState.ball.radius > paddle.x &&
    newState.ball.y + newState.ball.radius > paddle.y &&
    newState.ball.y - newState.ball.radius < paddle.y + paddle.height
  ) {
    // La balle touche la raquette
    handlePaddleCollision(newState, paddle, isPlayerSide);
  }
  
  // Déplacer les raquettes en fonction des touches enfoncées
  updatePaddlesPosition(newState);
  
  // La balle sort des limites - mise à jour du score
  if (newState.ball.x - newState.ball.radius < 0) {
    // L'ordinateur marque
    newState.computerScore += 1;
    resetBall(newState, -1);
  } else if (newState.ball.x + newState.ball.radius > newState.gameWidth) {
    // Le joueur marque
    newState.playerScore += 1;
    resetBall(newState, 1);
  }
  
  return newState;
};

// Mettre à jour la position des raquettes
const updatePaddlesPosition = (state: GameState): void => {
  // Contrôles du joueur 1 (W/S)
  if (state.keysPressed.has('w') || state.keysPressed.has('W')) {
    state.playerPaddle.y = Math.max(0, state.playerPaddle.y - state.playerPaddle.speed);
  }
  if (state.keysPressed.has('s') || state.keysPressed.has('S')) {
    state.playerPaddle.y = Math.min(
      state.gameHeight - state.playerPaddle.height,
      state.playerPaddle.y + state.playerPaddle.speed
    );
  }
  
  // Mode de jeu
  if (state.mode === 'local') {
    // Contrôles du joueur 2 (flèches haut/bas)
    if (state.keysPressed.has('ArrowUp')) {
      state.computerPaddle.y = Math.max(0, state.computerPaddle.y - state.computerPaddle.speed);
    }
    if (state.keysPressed.has('ArrowDown')) {
      state.computerPaddle.y = Math.min(
        state.gameHeight - state.computerPaddle.height,
        state.computerPaddle.y + state.computerPaddle.speed
      );
    }
  } else if (state.mode === 'ai') {
    // IA - suit la balle avec un certain délai et une certaine marge d'erreur
    updateAIPaddle(state);
  }
};

// Mettre à jour la position de la raquette IA
const updateAIPaddle = (state: GameState): void => {
  const settings = difficultySettings[state.difficulty];
  const paddle = state.computerPaddle;
  
  // La cible idéale serait de centrer la raquette sur la balle
  const idealY = state.ball.y - paddle.height / 2;
  
  // Ajouter une marge d'erreur pour rendre l'IA imparfaite
  const errorMargin = (Math.random() * 2 - 1) * settings.aiErrorMargin * paddle.height;
  const targetY = Math.max(0, Math.min(state.gameHeight - paddle.height, idealY + errorMargin));
  
  // Déplacer la raquette vers la cible
  if (paddle.y < targetY) {
    paddle.y = Math.min(targetY, paddle.y + paddle.speed * 0.7);
  } else if (paddle.y > targetY) {
    paddle.y = Math.max(targetY, paddle.y - paddle.speed * 0.7);
  }
};

// Gérer l'enfoncement des touches
export const handleKeyDown = (state: GameState, key: string): GameState => {
  const newState = { ...state };
  newState.keysPressed.add(key);
  
  // Espace pour mettre en pause/reprendre
  if (key === ' ' && newState.isGameActive) {
    newState.isPaused = !newState.isPaused;
  }
  
  // Démarrer le jeu si une touche est pressée et que le jeu n'est pas actif
  if (!newState.isGameActive && !newState.isPaused && !newState.isCountingDown) {
    return startCountdown(newState);
  }
  
  return newState;
};

// Gérer le relâchement des touches
export const handleKeyUp = (state: GameState, key: string): GameState => {
  const newState = { ...state };
  newState.keysPressed.delete(key);
  return newState;
};

// Redimensionner le jeu (pour le responsive)
export const resizeGame = (state: GameState, width: number, height: number): GameState => {
  const widthRatio = width / state.gameWidth;
  const heightRatio = height / state.gameHeight;
  
  return {
    ...state,
    gameWidth: width,
    gameHeight: height,
    ball: {
      ...state.ball,
      x: state.ball.x * widthRatio,
      y: state.ball.y * heightRatio,
      radius: state.ball.radius * Math.min(widthRatio, heightRatio)
    },
    playerPaddle: {
      ...state.playerPaddle,
      x: state.playerPaddle.x * widthRatio,
      y: state.playerPaddle.y * heightRatio,
      width: state.playerPaddle.width * widthRatio,
      height: state.playerPaddle.height * heightRatio
    },
    computerPaddle: {
      ...state.computerPaddle,
      x: state.computerPaddle.x * widthRatio,
      y: state.computerPaddle.y * heightRatio,
      width: state.computerPaddle.width * widthRatio,
      height: state.computerPaddle.height * heightRatio
    }
  };
};
