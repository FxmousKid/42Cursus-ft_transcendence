import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Ball from './Ball';
import Paddle from './Paddle';
import Scoreboard from './Scoreboard';
import { 
  GameState, 
  initGameState, 
  updateGameState, 
  handleKeyDown, 
  handleKeyUp 
} from '@/utils/gameEngine';

interface PongGameProps {
  width?: number;
  height?: number;
}

const PongGame: React.FC<PongGameProps> = ({
  width = 800,
  height = 500,
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(initGameState(width, height));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef<number>(0);
  
  const resetGame = () => {
    setGameState(initGameState(
      gameRef.current?.clientWidth || width,
      gameRef.current?.clientHeight || height
    ));
  };
  
  const toggleGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameActive: !prev.isGameActive
    }));
  };
  
  const toggleFullscreen = () => {
    if (!gameRef.current) return;
    
    if (!isFullscreen) {
      if (gameRef.current.requestFullscreen) {
        gameRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Handle keyboard events for player controls
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      setGameState(prev => handleKeyDown(prev, e.key));
    };
    
    const handleKeyUpEvent = (e: KeyboardEvent) => {
      setGameState(prev => handleKeyUp(prev, e.key));
    };
    
    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    if (!gameState.isGameActive) return;
    
    const gameLoop = () => {
      setGameState(prev => updateGameState(prev));
      frameRef.current = requestAnimationFrame(gameLoop);
    };
    
    frameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameState.isGameActive]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!gameRef.current) return;
      
      const newWidth = gameRef.current.clientWidth;
      const newHeight = gameRef.current.clientHeight;
      
      setGameState(prev => {
        const widthRatio = newWidth / prev.gameWidth;
        const heightRatio = newHeight / prev.gameHeight;
        
        return {
          ...prev,
          gameWidth: newWidth,
          gameHeight: newHeight,
          ball: {
            ...prev.ball,
            x: prev.ball.x * widthRatio,
            y: prev.ball.y * heightRatio,
            radius: prev.ball.radius * Math.min(widthRatio, heightRatio)
          },
          playerPaddle: {
            ...prev.playerPaddle,
            x: prev.playerPaddle.x * widthRatio,
            y: prev.playerPaddle.y * heightRatio,
            width: prev.playerPaddle.width * widthRatio,
            height: prev.playerPaddle.height * heightRatio
          },
          computerPaddle: {
            ...prev.computerPaddle,
            x: prev.computerPaddle.x * widthRatio,
            y: prev.computerPaddle.y * heightRatio,
            width: prev.computerPaddle.width * widthRatio,
            height: prev.computerPaddle.height * heightRatio
          }
        };
      });
    };
    
    // Set initial size
    if (gameRef.current) {
      const initialWidth = gameRef.current.clientWidth;
      const initialHeight = gameRef.current.clientHeight;
      setGameState(initGameState(initialWidth, initialHeight));
    }
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement);
      handleResize();
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', () => {
        setIsFullscreen(false);
      });
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <Scoreboard 
        playerScore={gameState.playerScore} 
        computerScore={gameState.computerScore} 
      />
      
      <div 
        ref={gameRef}
        className="game-board w-full aspect-[16/10]"
        tabIndex={0}
      >
        <Ball
          position={{ 
            x: gameState.ball.x - gameState.ball.radius, 
            y: gameState.ball.y - gameState.ball.radius 
          }}
          radius={gameState.ball.radius}
        />
        <Paddle
          position={{ 
            x: gameState.playerPaddle.x, 
            y: gameState.playerPaddle.y 
          }}
          width={gameState.playerPaddle.width}
          height={gameState.playerPaddle.height}
          isPlayer={true}
          gameActive={gameState.isGameActive}
        />
        <Paddle
          position={{ 
            x: gameState.computerPaddle.x, 
            y: gameState.computerPaddle.y 
          }}
          width={gameState.computerPaddle.width}
          height={gameState.computerPaddle.height}
          isPlayer={false}
          gameActive={gameState.isGameActive}
        />
        
        {!gameState.isGameActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 backdrop-blur-sm rounded-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8 animate-pulsate text-center px-4">
              PONG ARCADE
            </h2>
            <p className="text-muted-foreground text-lg mb-8 text-center px-6">
              Player 1: W (up) / S (down) | Player 2: ↑ (up) / ↓ (down)
            </p>
            <Button 
              onClick={toggleGame} 
              className="elegant-button-primary text-lg md:text-xl"
            >
              {gameState.isGameActive ? 'Pause' : 'Play'}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 mt-6">
        <Button 
          onClick={toggleGame} 
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          {gameState.isGameActive ? 'Pause' : 'Play'}
        </Button>
        <Button 
          onClick={resetGame} 
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary/10"
        >
          Reset
        </Button>
        <Button 
          onClick={toggleFullscreen} 
          variant="outline"
          className="border-accent text-accent hover:bg-accent/10"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </Button>
      </div>
    </div>
  );
};

export default PongGame;
