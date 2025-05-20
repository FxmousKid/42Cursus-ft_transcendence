import { socketService, SocketEvent } from '../services/socket';
import { authUtils } from '../utils/auth';
import { toastUtils } from '../utils/toast';
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
let gameState = {
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    player1Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
    player2Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
    player1Score: 0,
    player2Score: 0,
    gameStatus: 'waiting'
};
// Game variables
let canvas;
let ctx;
let animationId = null;
let currentPlayerId = null;
let opponentId = null;
let isPlayer1 = false;
export function renderGame() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    // Get current user
    const currentUser = authUtils.getCurrentUser();
    if (currentUser) {
        currentPlayerId = currentUser.id;
    }
    // Create game container
    const gameContainer = document.createElement('div');
    gameContainer.className = 'flex flex-col items-center py-8';
    // Game header
    const gameHeader = document.createElement('div');
    gameHeader.className = 'text-center mb-8';
    const gameTitle = document.createElement('h1');
    gameTitle.className = 'text-3xl font-bold mb-2';
    gameTitle.textContent = 'Pong Game';
    const gameSubtitle = document.createElement('p');
    gameSubtitle.className = 'text-gray-300';
    gameSubtitle.textContent = 'Use W/S or Up/Down arrow keys to move your paddle';
    gameHeader.appendChild(gameTitle);
    gameHeader.appendChild(gameSubtitle);
    // Game modes
    const gameModes = document.createElement('div');
    gameModes.className = 'grid grid-cols-3 gap-4 mb-8';
    const modes = [
        { name: 'Play Local', id: 'local' },
        { name: 'Play vs Friend', id: 'friend' },
        { name: 'Tournament', id: 'tournament' }
    ];
    modes.forEach(mode => {
        const modeButton = document.createElement('button');
        modeButton.className = 'btn btn-secondary py-3 px-6';
        modeButton.textContent = mode.name;
        modeButton.dataset.mode = mode.id;
        modeButton.addEventListener('click', () => selectGameMode(mode.id));
        gameModes.appendChild(modeButton);
    });
    // Game canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'bg-gray-800 rounded-lg p-4 mb-6';
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.className = 'bg-gray-900 rounded';
    canvasContainer.appendChild(canvas);
    // Game status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'text-center mb-6';
    statusContainer.id = 'game-status';
    statusContainer.textContent = 'Select a game mode to start';
    // Game controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'flex justify-center space-x-4';
    const startButton = document.createElement('button');
    startButton.className = 'btn btn-primary';
    startButton.textContent = 'Start Game';
    startButton.id = 'start-button';
    startButton.disabled = true;
    startButton.addEventListener('click', startGame);
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-secondary';
    resetButton.textContent = 'Reset Game';
    resetButton.id = 'reset-button';
    resetButton.disabled = true;
    resetButton.addEventListener('click', resetGame);
    controlsContainer.appendChild(startButton);
    controlsContainer.appendChild(resetButton);
    // Assemble the page
    gameContainer.appendChild(gameHeader);
    gameContainer.appendChild(gameModes);
    gameContainer.appendChild(canvasContainer);
    gameContainer.appendChild(statusContainer);
    gameContainer.appendChild(controlsContainer);
    // Add to container
    appContainer.appendChild(gameContainer);
    // Initialize canvas context
    ctx = canvas.getContext('2d');
    // Draw initial game state
    drawGame();
    // Set up keyboard event listeners
    setupControls();
    // Set up socket event listeners
    setupSocketListeners();
}
function selectGameMode(mode) {
    const statusElement = document.getElementById('game-status');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    if (!statusElement || !startButton || !resetButton)
        return;
    // Reset game state
    resetGameState();
    // Handle different game modes
    switch (mode) {
        case 'local':
            statusElement.textContent = 'Local Game Mode: Player vs Player on the same computer';
            startButton.disabled = false;
            resetButton.disabled = false;
            break;
        case 'friend':
            showFriendsList();
            statusElement.textContent = 'Select a friend to play with';
            startButton.disabled = true;
            resetButton.disabled = true;
            break;
        case 'tournament':
            statusElement.textContent = 'Tournament Mode: Looking for opponents...';
            startButton.disabled = true;
            resetButton.disabled = true;
            toastUtils.info('Tournament mode is not implemented in this version.');
            break;
        default:
            statusElement.textContent = 'Select a game mode to start';
            startButton.disabled = true;
            resetButton.disabled = true;
    }
    // Draw game
    drawGame();
}
function showFriendsList() {
    // This would normally call the API to get friends list
    // For this demo, we'll just show a mock list
    toastUtils.info('Friend selection is not implemented in this version.');
}
function startGame() {
    const statusElement = document.getElementById('game-status');
    if (!statusElement)
        return;
    gameState.gameStatus = 'playing';
    statusElement.textContent = 'Game in progress';
    // Start game loop
    if (!animationId) {
        animationId = requestAnimationFrame(gameLoop);
    }
}
function resetGame() {
    resetGameState();
    const statusElement = document.getElementById('game-status');
    if (statusElement) {
        statusElement.textContent = 'Game reset. Press Start to play again.';
    }
    // Update canvas
    drawGame();
}
function resetGameState() {
    // Cancel animation frame if running
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    // Reset game state
    gameState = {
        ballX: CANVAS_WIDTH / 2,
        ballY: CANVAS_HEIGHT / 2,
        player1Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
        player2Y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
        player1Score: 0,
        player2Score: 0,
        gameStatus: 'waiting'
    };
}
function gameLoop() {
    // Only update game state in local mode
    // For multiplayer, updates come from server
    if (gameState.gameStatus === 'playing') {
        updateGame();
    }
    drawGame();
    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}
function updateGame() {
    // This is a simplified version of the game logic
    // In a real game, this would be more complex
    // Ball movement
    gameState.ballX += 5; // Simple horizontal movement
    // Ball bouncing off paddles
    if (gameState.ballX <= PADDLE_OFFSET + PADDLE_WIDTH &&
        gameState.ballY >= gameState.player1Y &&
        gameState.ballY <= gameState.player1Y + PADDLE_HEIGHT) {
        // Hit left paddle
        gameState.ballX = PADDLE_OFFSET + PADDLE_WIDTH;
    }
    else if (gameState.ballX >= CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH &&
        gameState.ballY >= gameState.player2Y &&
        gameState.ballY <= gameState.player2Y + PADDLE_HEIGHT) {
        // Hit right paddle
        gameState.ballX = CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH;
    }
    // Ball out of bounds
    if (gameState.ballX < 0) {
        // Right player scored
        gameState.player2Score++;
        resetBall();
    }
    else if (gameState.ballX > CANVAS_WIDTH) {
        // Left player scored
        gameState.player1Score++;
        resetBall();
    }
    // Check for game end
    if (gameState.player1Score >= 10 || gameState.player2Score >= 10) {
        gameState.gameStatus = 'ended';
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            const winner = gameState.player1Score > gameState.player2Score ? 'Player 1' : 'Player 2';
            statusElement.textContent = `Game Over! ${winner} wins!`;
        }
    }
}
function resetBall() {
    gameState.ballX = CANVAS_WIDTH / 2;
    gameState.ballY = CANVAS_HEIGHT / 2;
}
function drawGame() {
    if (!ctx)
        return;
    // Clear canvas
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Draw center line
    ctx.strokeStyle = LINE_COLOR;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    // Draw paddles
    ctx.fillStyle = PADDLE_COLOR;
    // Left paddle
    ctx.fillRect(PADDLE_OFFSET, gameState.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Right paddle
    ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH, gameState.player2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Draw ball
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(gameState.ballX, gameState.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Draw scores
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    // Left player score
    ctx.fillText(gameState.player1Score.toString(), CANVAS_WIDTH / 4, 80);
    // Right player score
    ctx.fillText(gameState.player2Score.toString(), CANVAS_WIDTH * 3 / 4, 80);
    // Draw game status if waiting or ended
    if (gameState.gameStatus !== 'playing') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (gameState.gameStatus === 'waiting') {
            ctx.fillText('Press Start to Play', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
        else if (gameState.gameStatus === 'ended') {
            const winner = gameState.player1Score > gameState.player2Score ? 'Player 1' : 'Player 2';
            ctx.fillText(`Game Over! ${winner} wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }
}
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState.gameStatus !== 'playing')
            return;
        // Movement amount
        const moveAmount = 20;
        // Player 1 controls (W and S keys)
        if (e.key === 'w' || e.key === 'W') {
            gameState.player1Y = Math.max(0, gameState.player1Y - moveAmount);
        }
        else if (e.key === 's' || e.key === 'S') {
            gameState.player1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player1Y + moveAmount);
        }
        // Player 2 controls (Arrow keys)
        if (e.key === 'ArrowUp') {
            gameState.player2Y = Math.max(0, gameState.player2Y - moveAmount);
        }
        else if (e.key === 'ArrowDown') {
            gameState.player2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player2Y + moveAmount);
        }
        // In a real multiplayer game, we would send these movements to the server
        if (gameState.gameStatus === 'playing' && opponentId) {
            if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                // Determine direction
                const direction = e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' ? 'up' : 'down';
                socketService.sendGameInput(direction);
            }
        }
    });
    // Also listen for key up to stop paddle movement
    document.addEventListener('keyup', (e) => {
        if (gameState.gameStatus !== 'playing' || !opponentId)
            return;
        if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            socketService.sendGameInput('stop');
        }
    });
}
function setupSocketListeners() {
    // Listen for game start
    socketService.on(SocketEvent.GAME_STARTED, (data) => {
        console.log('Game started', data);
        // Store opponent ID
        if (data.player1_id === currentPlayerId) {
            opponentId = data.player2_id;
            isPlayer1 = true;
        }
        else {
            opponentId = data.player1_id;
            isPlayer1 = false;
        }
        // Update UI
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = 'Game started! You are ' + (isPlayer1 ? 'Player 1' : 'Player 2');
        }
        // Start the game
        gameState.gameStatus = 'playing';
        if (!animationId) {
            animationId = requestAnimationFrame(gameLoop);
        }
    });
    // Listen for game state updates
    socketService.on(SocketEvent.GAME_STATE_UPDATE, (data) => {
        // Update game state with data from server
        gameState = data;
        // No need to call drawGame here, the game loop will handle it
    });
    // Listen for game end
    socketService.on(SocketEvent.GAME_ENDED, (data) => {
        console.log('Game ended', data);
        // Update game status
        gameState.gameStatus = 'ended';
        // Update UI
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            const isWinner = data.winner_id === currentPlayerId;
            statusElement.textContent = isWinner ? 'You won!' : 'You lost!';
        }
        // Show final score
        toastUtils.info(`Final score: ${data.final_score[0]} - ${data.final_score[1]}`);
        // Reset opponent
        opponentId = null;
    });
    // Listen for game invitation
    socketService.on(SocketEvent.GAME_INVITATION_RECEIVED, (data) => {
        console.log('Game invitation received', data);
        // Show invitation toast with accept/decline options
        const message = `${data.from_username} invited you to play a game`;
        // Custom toast with buttons would be implemented here
        // For simplicity, we'll just show a regular toast and auto-accept
        toastUtils.info(message);
        // Auto-accept for demo purposes
        setTimeout(() => {
            socketService.respondToGameInvitation(data.from_id, true);
        }, 2000);
    });
}
//# sourceMappingURL=game.js.map