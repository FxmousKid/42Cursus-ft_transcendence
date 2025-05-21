// ts/game.ts - Simplified Pong Game Implementation with TypeScript

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Game canvas and context
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    
    // Game elements
    interface Ball {
        x: number;
        y: number;
        radius: number;
        velocityX: number;
        velocityY: number;
        speed: number;
        color: string;
    }
    
    interface Paddle {
        x: number;
        y: number;
        width: number;
        height: number;
        score: number;
        color: string;
        moveUp: boolean;
        moveDown: boolean;
        speed: number;
    }
    
    // Game constants
    const WINNING_SCORE: number = 10;
    const BALL_SPEED: number = 8; // Increased ball speed for better responsiveness
    const PADDLE_SPEED: number = 12; // Increased paddle speed
    
    // Performance tracking
    let lastTime: number = 0;
    let fpsCounter: number = 0;
    let fpsTimer: number = 0;
    let currentFps: number = 0;
    
    const ball: Ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        velocityX: 0,      // Will be set in resetBall()
        velocityY: 0,      // Will be set in resetBall()
        speed: BALL_SPEED,
        color: 'white'
    };
    
    const paddleWidth: number = 10;
    const paddleHeight: number = 100;
    const paddleOffset: number = 20;
    
    const leftPaddle: Paddle = {
        x: paddleOffset,
        y: (canvas.height - paddleHeight) / 2,
        width: paddleWidth,
        height: paddleHeight,
        score: 0,
        color: 'white',
        moveUp: false,
        moveDown: false,
        speed: PADDLE_SPEED
    };
    
    const rightPaddle: Paddle = {
        x: canvas.width - paddleOffset - paddleWidth,
        y: (canvas.height - paddleHeight) / 2,
        width: paddleWidth,
        height: paddleHeight,
        score: 0,
        color: 'white',
        moveUp: false,
        moveDown: false,
        speed: PADDLE_SPEED
    };
    
    // Game state
    let gameRunning: boolean = false;
    let gamePaused: boolean = false;
    let gameOver: boolean = false;
    let winner: string = '';
    
    // DOM elements
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    const leftScoreDisplay = document.getElementById('player-left-score') as HTMLElement;
    const rightScoreDisplay = document.getElementById('player-right-score') as HTMLElement;
    
    // Event listeners for paddles
    document.addEventListener('keydown', function(event: KeyboardEvent) {
        if (gameOver) return; // Don't allow controls if game is over
        
        // Left paddle (Q - up, W - down)
        if (event.code === 'KeyQ') {
            leftPaddle.moveUp = true;
        } else if (event.code === 'KeyW') {
            leftPaddle.moveDown = true;
        }
        
        // Right paddle (Left arrow - up, Right arrow - down)
        if (event.code === 'ArrowLeft') {
            rightPaddle.moveUp = true;
        } else if (event.code === 'ArrowRight') {
            rightPaddle.moveDown = true;
        }
        
        // Add pause toggle on 'P' key press
        if (event.code === 'KeyP' && gameRunning) {
            gamePaused = !gamePaused;
            
            if (gamePaused) {
                startButton.textContent = "Reprendre";
            } else {
                startButton.textContent = "Pause";
            }
        }
    });
    
    document.addEventListener('keyup', function(event: KeyboardEvent) {
        // Left paddle
        if (event.code === 'KeyQ') {
            leftPaddle.moveUp = false;
        } else if (event.code === 'KeyW') {
            leftPaddle.moveDown = false;
        }
        
        // Right paddle
        if (event.code === 'ArrowLeft') {
            rightPaddle.moveUp = false;
        } else if (event.code === 'ArrowRight') {
            rightPaddle.moveDown = false;
        }
    });
    
    // Button controls
    startButton.addEventListener('click', function() {
        if (gameOver) {
            // If game is over, reset everything and start a new game
            gameOver = false;
            winner = '';
            resetGame();
            startGame();
        } else if (!gameRunning) {
            // Start the game if it's not running
            gameRunning = true;
            gamePaused = false;
            startButton.textContent = "Pause";
            startGame();
        } else {
            // Toggle pause if the game is already running
            gamePaused = !gamePaused;
            
            if (gamePaused) {
                // Game is now paused
                startButton.textContent = "Reprendre";
            } else {
                // Game is now resumed
                startButton.textContent = "Pause";
            }
        }
    });
    
    resetButton.addEventListener('click', function() {
        // Reset the game
        resetGame();
        
        // Reset game state
        gameOver = false;
        winner = '';
        
        // Reset the pause state and button appearance if game is running
        if (gameRunning) {
            gamePaused = false;
            startButton.textContent = "Pause";
        }
    });
    
    // Drawing functions
    function drawRect(x: number, y: number, width: number, height: number, color: string): void {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }
    
    function drawCircle(x: number, y: number, radius: number, color: string): void {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawNet(): void {
        const netWidth: number = 2;
        const netHeight: number = 10;
        const netGap: number = 15;
        
        for (let y: number = 0; y <= canvas.height; y += netHeight + netGap) {
            drawRect(canvas.width / 2 - netWidth / 2, y, netWidth, netHeight, 'rgba(255, 255, 255, 0.5)');
        }
    }
    
    function drawPaddle(paddle: Paddle): void {
        drawRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.color);
    }
    
    function drawScore(): void {
        leftScoreDisplay.textContent = leftPaddle.score.toString();
        rightScoreDisplay.textContent = rightPaddle.score.toString();
    }
    
    // Collision detection
    function collision(ball: Ball, paddle: Paddle): boolean {
        // Check if ball coordinates are within paddle boundaries
        return (
            ball.x + ball.radius > paddle.x &&
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height
        );
    }
    
    // Game logic
    function update(): void {
        // Don't update the game if it's not running, paused, or over
        if (!gameRunning || gamePaused || gameOver) return;
        
        // Move left paddle
        if (leftPaddle.moveUp && leftPaddle.y > 0) {
            leftPaddle.y -= leftPaddle.speed;
        } else if (leftPaddle.moveDown && leftPaddle.y + leftPaddle.height < canvas.height) {
            leftPaddle.y += leftPaddle.speed;
        }
        
        // Move right paddle
        if (rightPaddle.moveUp && rightPaddle.y > 0) {
            rightPaddle.y -= rightPaddle.speed;
        } else if (rightPaddle.moveDown && rightPaddle.y + rightPaddle.height < canvas.height) {
            rightPaddle.y += rightPaddle.speed;
        }
        
        // Update ball position
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        
        // Wall collision (top and bottom)
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.velocityY = -ball.velocityY;
        }
        
        // Determine which paddle is being hit by the ball
        let player: Paddle = (ball.x < canvas.width / 2) ? leftPaddle : rightPaddle;
        
        // If the ball hits a paddle
        if (collision(ball, player)) {
            // Where the ball hit the paddle
            let collidePoint: number = ball.y - (player.y + player.height / 2);
            
            // Normalize the value of collidePoint
            collidePoint = collidePoint / (player.height / 2);
            
            // Calculate angle in radians (simplified)
            let angleRad: number = collidePoint * (Math.PI / 4);
            
            // X direction of the ball
            let direction: number = (ball.x < canvas.width / 2) ? 1 : -1;
            
            // Set velocity based on direction and angle
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);
        }
        
        // Scoring - ball goes beyond paddles
        if (ball.x - ball.radius < 0) {
            // Right player scores
            rightPaddle.score++;
            
            // Check for win
            if (rightPaddle.score >= WINNING_SCORE) {
                gameOver = true;
                winner = 'Joueur 2';
                startButton.textContent = "Nouvelle Partie";
            } else {
                resetBall();
            }
        } else if (ball.x + ball.radius > canvas.width) {
            // Left player scores
            leftPaddle.score++;
            
            // Check for win
            if (leftPaddle.score >= WINNING_SCORE) {
                gameOver = true;
                winner = 'Joueur 1';
                startButton.textContent = "Nouvelle Partie";
            } else {
                resetBall();
            }
        }
        
        // Update score display
        drawScore();
    }
    
    function resetBall(): void {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      
      // Set a random angle, but avoid too vertical trajectories
      let angle = (Math.random() * 0.5 + 0.25) * Math.PI; // angle between PI/4 and 3PI/4
      
      // 50% chance of going left or right
      if (Math.random() < 0.5) {
          angle = Math.PI - angle; // Reflect angle to go left
      }
      
      // Calculate velocity components based on speed and angle
      ball.velocityX = ball.speed * Math.cos(angle);
      ball.velocityY = ball.speed * Math.sin(angle) * (Math.random() < 0.5 ? 1 : -1); // Random up/down
    }
    
    function resetGame(): void {
        // Reset scores
        leftPaddle.score = 0;
        rightPaddle.score = 0;
        
        // Reset paddles position
        leftPaddle.y = (canvas.height - leftPaddle.height) / 2;
        rightPaddle.y = (canvas.height - rightPaddle.height) / 2;
        
        // Reset ball and its velocity
        resetBall();
        
        // Update score display
        drawScore();
        
        // Redraw the game
        render();
    }
    
    function render(): void {
        // Clear the canvas - use clearRect for better performance
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRect(0, 0, canvas.width, canvas.height, '#111827');
        
        // Draw the net
        drawNet();
        
        // Draw paddles
        drawPaddle(leftPaddle);
        drawPaddle(rightPaddle);
        
        // Draw the ball
        drawCircle(ball.x, ball.y, ball.radius, ball.color);
        
        // Display FPS counter (for development)
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`FPS: ${currentFps}`, canvas.width - 70, 20);
        
        // Display game information
        if (gameOver) {
            // Game over overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PARTIE TERMINÉE', canvas.width / 2, canvas.height / 2 - 50);
            
            ctx.font = 'bold 32px Arial';
            ctx.fillText(`${winner} gagne!`, canvas.width / 2, canvas.height / 2 + 10);
            
            ctx.font = '20px Arial';
            ctx.fillText('Cliquez sur "Nouvelle Partie" pour recommencer', canvas.width / 2, canvas.height / 2 + 60);
            
            ctx.textAlign = 'left'; // Reset text alignment
        } else if (gamePaused && gameRunning) {
            // Pause overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left'; // Reset text alignment
        }
    }
    
    function gameLoop(timestamp: number = 0): void {
        // Calculate delta time for smooth animation
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Update FPS counter
        fpsCounter++;
        fpsTimer += deltaTime;
        if (fpsTimer >= 1000) {
            currentFps = fpsCounter;
            fpsCounter = 0;
            fpsTimer -= 1000;
        }
        
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    
    function startGame(): void {
        resetGame();
        gameRunning = true;
        gamePaused = false;
        gameOver = false;
        winner = '';
        startButton.textContent = "Pause";
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
    
    // Initialize the game
    resetGame();
  });