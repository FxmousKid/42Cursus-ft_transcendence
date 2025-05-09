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
  keysPressed: Set<string>;
}

// Initialize game state
export const initGameState = (width: number, height: number): GameState => {
  const paddleHeight = height * 0.15;
  const paddleWidth = width * 0.02;
  const ballRadius = width * 0.015;
  
  return {
    ball: {
      x: width / 2,
      y: height / 2,
      velocityX: 5,
      velocityY: 5,
      radius: ballRadius,
      speed: 7,
    },
    playerPaddle: {
      x: paddleWidth * 2,
      y: height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: 8,
    },
    computerPaddle: {
      x: width - paddleWidth * 3,
      y: height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: 8, // Maintenant les deux paddles ont la même vitesse
    },
    gameWidth: width,
    gameHeight: height,
    playerScore: 0,
    computerScore: 0,
    isGameActive: false,
    keysPressed: new Set<string>(),
  };
};

// Update game state for each frame
export const updateGameState = (state: GameState): GameState => {
  if (!state.isGameActive) return state;

  const newState = { ...state };
  
  // Move the ball
  newState.ball.x += newState.ball.velocityX;
  newState.ball.y += newState.ball.velocityY;
  
  // Ball collision with top and bottom walls
  if (newState.ball.y + newState.ball.radius > newState.gameHeight || 
      newState.ball.y - newState.ball.radius < 0) {
    newState.ball.velocityY = -newState.ball.velocityY;
  }
  
  // Check if the ball is on the player's side or computer's side
  const isPlayerSide = newState.ball.x < newState.gameWidth / 2;

  // Determine which paddle to check collision with
  const paddle = isPlayerSide 
    ? newState.playerPaddle 
    : newState.computerPaddle;
  
  // Check ball collision with paddles
  if (
    newState.ball.x - newState.ball.radius < paddle.x + paddle.width &&
    newState.ball.x + newState.ball.radius > paddle.x &&
    newState.ball.y + newState.ball.radius > paddle.y &&
    newState.ball.y - newState.ball.radius < paddle.y + paddle.height
  ) {
    // Ball hits paddle
    let collidePoint = (newState.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    
    // Calculate angle and change ball direction
    const angle = collidePoint * Math.PI / 4;
    const direction = isPlayerSide ? 1 : -1;
    newState.ball.velocityX = direction * newState.ball.speed * Math.cos(angle);
    newState.ball.velocityY = newState.ball.speed * Math.sin(angle);
    
    // Increase ball speed slightly with each hit
    newState.ball.speed += 0.2;
  }
  
  // Move paddles based on keyboard input
  updatePaddlesPosition(newState);
  
  // Ball goes out of bounds - score update
  if (newState.ball.x - newState.ball.radius < 0) {
    // Computer scores
    newState.computerScore += 1;
    resetBall(newState, -1);
  } else if (newState.ball.x + newState.ball.radius > newState.gameWidth) {
    // Player scores
    newState.playerScore += 1;
    resetBall(newState, 1);
  }
  
  return newState;
};

// Update paddles position based on keyboard input
const updatePaddlesPosition = (state: GameState) => {
  // Player 1 controls (W/S)
  if (state.keysPressed.has('w') || state.keysPressed.has('W')) {
    state.playerPaddle.y -= state.playerPaddle.speed;
  }
  if (state.keysPressed.has('s') || state.keysPressed.has('S')) {
    state.playerPaddle.y += state.playerPaddle.speed;
  }
  
  // Player 2 controls (Arrow Up/Down)
  if (state.keysPressed.has('ArrowUp')) {
    state.computerPaddle.y -= state.computerPaddle.speed;
  }
  if (state.keysPressed.has('ArrowDown')) {
    state.computerPaddle.y += state.computerPaddle.speed;
  }
  
  // Keep paddles within the game boundaries
  if (state.playerPaddle.y < 0) {
    state.playerPaddle.y = 0;
  } else if (state.playerPaddle.y + state.playerPaddle.height > state.gameHeight) {
    state.playerPaddle.y = state.gameHeight - state.playerPaddle.height;
  }
  
  if (state.computerPaddle.y < 0) {
    state.computerPaddle.y = 0;
  } else if (state.computerPaddle.y + state.computerPaddle.height > state.gameHeight) {
    state.computerPaddle.y = state.gameHeight - state.computerPaddle.height;
  }
};

// Reset the ball after scoring
const resetBall = (state: GameState, direction: number) => {
  state.ball.x = state.gameWidth / 2;
  state.ball.y = state.gameHeight / 2;
  state.ball.velocityX = direction * state.ball.speed * Math.cos(Math.PI / 4);
  state.ball.velocityY = state.ball.speed * Math.sin(Math.PI / 4);
  state.ball.speed = 7; // Reset ball speed
};

// Handle key press
export const handleKeyDown = (state: GameState, key: string): GameState => {
  const newState = { ...state };
  newState.keysPressed.add(key);
  return newState;
};

// Handle key release
export const handleKeyUp = (state: GameState, key: string): GameState => {
  const newState = { ...state };
  newState.keysPressed.delete(key);
  return newState;
};

// Move player paddle based on mouse/touch position - keep this function for compatibility
export const movePlayerPaddle = (state: GameState, y: number): GameState => {
  return state;
};
