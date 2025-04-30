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
import { Expand, Minimize, Play, Pause, RotateCcw } from 'lucide-react';

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
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto relative">
      {/* Background blobs */}
      <div className="absolute -z-10 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob blob-primary w-64 h-64 -top-32 -left-32"></div>
        <div className="blob blob-secondary w-64 h-64 -bottom-32 -right-32"></div>
        <div className="blob blob-accent w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <Scoreboard 
        playerScore={gameState.playerScore} 
        computerScore={gameState.computerScore} 
      />
      
      <div 
        ref={gameRef}
        className="game-board w-full aspect-[16/10] relative"
        tabIndex={0}
      >
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20 transform -translate-x-1/2"></div>
        
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 backdrop-blur-sm rounded-xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 animate-pulsate elegant-text-primary">
              PONG ARCADE
            </h2>
            <p className="text-muted-foreground text-lg mb-8 text-center px-6 max-w-md">
              Use <span className="text-primary">W/S</span> for Player 1 and <span className="text-secondary">↑/↓</span> for Player 2
            </p>
            <Button 
              onClick={toggleGame} 
              className="elegant-button-primary text-lg md:text-xl px-8 py-6 rounded-full group"
            >
              {gameState.isGameActive ? (
                <Pause className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              )}
              {gameState.isGameActive ? 'Pause' : 'Play'}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 mt-6">
        <Button 
          onClick={toggleGame} 
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 group"
        >
          {gameState.isGameActive ? (
            <>
              <Pause className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Play
            </>
          )}
        </Button>
        <Button 
          onClick={resetGame} 
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary/10 group"
        >
          <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform" />
          Reset
        </Button>
        <Button 
          onClick={toggleFullscreen} 
          variant="outline"
          className="border-accent text-accent hover:bg-accent/10 group"
        >
          {isFullscreen ? (
            <>
              <Minimize className="mr-2 h-4 w-4 group-hover:scale-90 transition-transform" />
              Exit
            </>
          ) : (
            <>
              <Expand className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Fullscreen
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PongGame;
