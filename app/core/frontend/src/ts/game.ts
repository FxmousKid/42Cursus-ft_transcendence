// Improved Pong Game - Cleaner, Simpler, More Efficient
// Key improvements: Better separation of concerns, simpler physics, more efficient rendering

class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number = 0;
    
    // Game dimensions
    private readonly ASPECT_RATIO = 16 / 10;
    private readonly MIN_WIDTH = 320;
    
    // Game settings
    private readonly WINNING_SCORE = 2;
    private readonly BALL_SPEED = 0.5; // Percentage of canvas width per second
    private readonly PADDLE_SPEED = 0.6; // Percentage of canvas height per second
    private readonly PADDLE_HEIGHT = 0.2; // 20% of canvas height
    private readonly PADDLE_WIDTH = 0.02; // 2% of canvas width
    private readonly BALL_SIZE = 0.02; // 2% of canvas width
    
    // Game state
    private gameState: 'menu' | 'playing' | 'paused' | 'gameover' | 'scoring' = 'menu';
    private winner: string = '';
    private lastTime: number = 0;
    private deltaTime: number = 0;
    
    // Game objects (normalized coordinates 0-1)
    private ball = {
        x: 0.5,
        y: 0.5,
        vx: 0,
        vy: 0,
        speed: this.BALL_SPEED
    };
    
    private paddles = {
        left: {
            y: 0.5,
            score: 0,
            up: false,
            down: false
        },
        right: {
            y: 0.5,
            score: 0,
            up: false,
            down: false
        }
    };
    
    // DOM elements
    private elements: {
        startBtn: HTMLButtonElement;
        resetBtn: HTMLButtonElement;
        leftScore: HTMLElement;
        rightScore: HTMLElement;
        leftCard: HTMLElement;
        rightCard: HTMLElement;
    };
    
    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Cache DOM elements
        this.elements = {
            startBtn: document.getElementById('start-button') as HTMLButtonElement,
            resetBtn: document.getElementById('reset-button') as HTMLButtonElement,
            leftScore: document.getElementById('player-left-score') as HTMLElement,
            rightScore: document.getElementById('player-right-score') as HTMLElement,
            leftCard: document.getElementById('player-left-card') as HTMLElement,
            rightCard: document.getElementById('player-right-card') as HTMLElement
        };
        
        this.init();
    }
    
    private init(): void {
        this.setupCanvas();
        this.setupEventListeners();
        this.resetGame();
        this.gameLoop();
    }
    
    private setupCanvas(): void {
        const resize = () => {
            const container = this.canvas.parentElement!;
            const maxWidth = container.clientWidth - 32;
            const width = Math.max(this.MIN_WIDTH, Math.min(800, maxWidth));
            const height = width / this.ASPECT_RATIO;
            
            this.canvas.width = width;
            this.canvas.height = height;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    private setupEventListeners(): void {
        // Keyboard controls
        const keyMap: { [key: string]: () => void } = {
            'KeyA': () => this.paddles.left.up = true,
            'KeyD': () => this.paddles.left.down = true,
            'ArrowRight': () => this.paddles.right.up = true,
            'ArrowLeft': () => this.paddles.right.down = true,
            'KeyP': () => this.togglePause(),
            'Escape': () => this.togglePause(),
            'Space': () => this.togglePause()
        };
        
        document.addEventListener('keydown', (e) => {
            if (keyMap[e.code]) {
                e.preventDefault();
                keyMap[e.code]();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyA': this.paddles.left.up = false; break;
                case 'KeyD': this.paddles.left.down = false; break;
                case 'ArrowRight': this.paddles.right.up = false; break;
                case 'ArrowLeft': this.paddles.right.down = false; break;
            }
        });
        
        // Button controls
        this.elements.startBtn.addEventListener('click', () => this.handleStartButton());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
    }
    
    private handleStartButton(): void {
        switch(this.gameState) {
            case 'menu':
            case 'gameover':
                this.startGame();
                break;
            case 'playing':
                this.pauseGame();
                break;
            case 'paused':
                this.resumeGame();
                break;
        }
    }
    
    private startGame(): void {
        this.resetGame();
        this.gameState = 'playing';
        this.elements.startBtn.textContent = 'Pause';
        this.serveBall();
    }
    
    private pauseGame(): void {
        this.gameState = 'paused';
        this.elements.startBtn.textContent = 'Reprendre';
    }
    
    private resumeGame(): void {
        this.gameState = 'playing';
        this.elements.startBtn.textContent = 'Pause';
    }
    
    private togglePause(): void {
        if (this.gameState === 'playing') {
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    private resetGame(): void {
        this.paddles.left.score = 0;
        this.paddles.right.score = 0;
        this.paddles.left.y = 0.5;
        this.paddles.right.y = 0.5;
        this.ball.x = 0.5;
        this.ball.y = 0.5;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.updateScore();
        
        if (this.gameState === 'gameover') {
            this.gameState = 'menu';
            this.elements.startBtn.textContent = 'Commencer';
        }
    }
    
    private serveBall(): void {
        this.ball.x = 0.5;
        this.ball.y = 0.5;
        
        // Random angle between -45 and 45 degrees
        const angle = (Math.random() - 0.5) * Math.PI / 2;
        const direction = Math.random() < 0.5 ? -1 : 1;
        
        this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
        this.ball.vy = Math.sin(angle) * this.ball.speed;
    }
    
    private update(): void {
        if (this.gameState !== 'playing') return;
        
        const dt = this.deltaTime;
        
        // Update paddles
        const paddleSpeed = this.PADDLE_SPEED * dt;
        
        if (this.paddles.left.up && this.paddles.left.y > this.PADDLE_HEIGHT / 2) {
            this.paddles.left.y -= paddleSpeed;
        }
        if (this.paddles.left.down && this.paddles.left.y < 1 - this.PADDLE_HEIGHT / 2) {
            this.paddles.left.y += paddleSpeed;
        }
        if (this.paddles.right.up && this.paddles.right.y > this.PADDLE_HEIGHT / 2) {
            this.paddles.right.y -= paddleSpeed;
        }
        if (this.paddles.right.down && this.paddles.right.y < 1 - this.PADDLE_HEIGHT / 2) {
            this.paddles.right.y += paddleSpeed;
        }
        
        // Update ball
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        
        // Ball collision with top/bottom
        if (this.ball.y <= this.BALL_SIZE || this.ball.y >= 1 - this.BALL_SIZE) {
            this.ball.vy *= -1;
            this.ball.y = Math.max(this.BALL_SIZE, Math.min(1 - this.BALL_SIZE, this.ball.y));
        }
        
        // Paddle collision
        const paddleLeft = 0.02;
        const paddleRight = 0.98;
        
        // Left paddle collision
        if (this.ball.x - this.BALL_SIZE <= paddleLeft + this.PADDLE_WIDTH &&
            this.ball.x - this.BALL_SIZE > paddleLeft &&
            this.ball.vx < 0) {
            
            const paddleTop = this.paddles.left.y - this.PADDLE_HEIGHT / 2;
            const paddleBottom = this.paddles.left.y + this.PADDLE_HEIGHT / 2;
            
            if (this.ball.y >= paddleTop && this.ball.y <= paddleBottom) {
                this.ball.vx *= -1;
                
                // Add spin based on hit position
                const relativeY = (this.ball.y - this.paddles.left.y) / (this.PADDLE_HEIGHT / 2);
                this.ball.vy = relativeY * this.ball.speed * 0.5;
                
                // Normalize velocity
                const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
                this.ball.vx = (this.ball.vx / speed) * this.ball.speed;
                this.ball.vy = (this.ball.vy / speed) * this.ball.speed;
                
                this.ball.x = paddleLeft + this.PADDLE_WIDTH + this.BALL_SIZE;
            }
        }
        
        // Right paddle collision
        if (this.ball.x + this.BALL_SIZE >= paddleRight - this.PADDLE_WIDTH &&
            this.ball.x + this.BALL_SIZE < paddleRight &&
            this.ball.vx > 0) {
            
            const paddleTop = this.paddles.right.y - this.PADDLE_HEIGHT / 2;
            const paddleBottom = this.paddles.right.y + this.PADDLE_HEIGHT / 2;
            
            if (this.ball.y >= paddleTop && this.ball.y <= paddleBottom) {
                this.ball.vx *= -1;
                
                // Add spin
                const relativeY = (this.ball.y - this.paddles.right.y) / (this.PADDLE_HEIGHT / 2);
                this.ball.vy = relativeY * this.ball.speed * 0.5;
                
                // Normalize velocity
                const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
                this.ball.vx = (this.ball.vx / speed) * this.ball.speed;
                this.ball.vy = (this.ball.vy / speed) * this.ball.speed;
                
                this.ball.x = paddleRight - this.PADDLE_WIDTH - this.BALL_SIZE;
            }
        }
        
        // Scoring
        if (this.ball.x < 0) {
            this.scorePoint('right');
        } else if (this.ball.x > 1) {
            this.scorePoint('left');
        }
    }
    
    private render(): void {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        
        // Draw middle line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw paddles
        ctx.fillStyle = 'white';
        const pw = this.PADDLE_WIDTH * width;
        const ph = this.PADDLE_HEIGHT * height;
        
        // Left paddle
        ctx.fillRect(
            0.02 * width,
            (this.paddles.left.y - this.PADDLE_HEIGHT / 2) * height,
            pw,
            ph
        );
        
        // Right paddle
        ctx.fillRect(
            0.98 * width - pw,
            (this.paddles.right.y - this.PADDLE_HEIGHT / 2) * height,
            pw,
            ph
        );
        
        // Draw ball
        const ballRadius = this.BALL_SIZE * width / 2;
        ctx.beginPath();
        ctx.arc(this.ball.x * width, this.ball.y * height, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw game state overlays
        if (this.gameState === 'paused') {
            this.drawOverlay('PAUSE');
        } else if (this.gameState === 'gameover') {
            this.drawOverlay(`PARTIE TERMINÉE\n${this.winner} gagne!`);
        }
    }
    
    private scorePoint(side: 'left' | 'right'): void {
        if (this.gameState !== 'playing') return; // Prevent multiple scoring
        
        this.gameState = 'scoring'; // Temporarily block further scoring
        
        if (side === 'right') {
            this.paddles.right.score++;
            this.updateScore();
            this.highlightWinner(this.elements.rightCard);
            
            if (this.paddles.right.score >= this.WINNING_SCORE) {
                this.endGame('Joueur 2');
            } else {
                this.ball.x = 0.5;
                this.ball.y = 0.5;
                this.ball.vx = 0;
                this.ball.vy = 0;
                setTimeout(() => {
                    if (this.gameState === 'scoring') {
                        this.gameState = 'playing';
                        this.serveBall();
                    }
                }, 1000);
            }
        } else {
            this.paddles.left.score++;
            this.updateScore();
            this.highlightWinner(this.elements.leftCard);
            
            if (this.paddles.left.score >= this.WINNING_SCORE) {
                this.endGame('Joueur 1');
            } else {
                this.ball.x = 0.5;
                this.ball.y = 0.5;
                this.ball.vx = 0;
                this.ball.vy = 0;
                setTimeout(() => {
                    if (this.gameState === 'scoring') {
                        this.gameState = 'playing';
                        this.serveBall();
                    }
                }, 1000);
            }
        }
    }
    
    private drawOverlay(text: string): void {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${width * 0.06}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = text.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, width / 2, height / 2 + (i - 0.5) * width * 0.08);
        });
    }
    
    private updateScore(): void {
        this.elements.leftScore.textContent = this.paddles.left.score.toString();
        this.elements.rightScore.textContent = this.paddles.right.score.toString();
    }
    
    private highlightWinner(card: HTMLElement): void {
        card.classList.add('scoring');
        setTimeout(() => card.classList.remove('scoring'), 500);
    }
    
    private endGame(winner: string): void {
        this.winner = winner;
        this.gameState = 'gameover';
        this.elements.startBtn.textContent = 'Nouvelle Partie';
    }
    
    private gameLoop = (timestamp: number = 0): void => {
        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = timestamp;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(this.gameLoop);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PongGame('game-canvas');
});

// Add CSS for scoring animation
const style = document.createElement('style');
style.textContent = `
    .scoring {
        animation: scoreFlash 0.5s ease-out;
    }
    
    @keyframes scoreFlash {
        0% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        100% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
    }
`;
document.head.appendChild(style);
