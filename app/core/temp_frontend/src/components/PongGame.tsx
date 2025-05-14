import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Ball from './Ball';
import Paddle from './Paddle';
import { 
  GameState, 
  initGameState, 
  updateGameState, 
  handleKeyDown, 
  handleKeyUp 
} from '@/utils/gameEngine';
import { Pause, Play, RotateCcw, MessageCircle, Flag } from 'lucide-react';

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
  const [showChat, setShowChat] = useState(false);
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto relative">
      {/* Header */}
      <header className="w-full mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">PLAY</h1>
        <Button
          onClick={() => setShowChat(!showChat)}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          CHAT
        </Button>
      </header>

      {/* Player profiles */}
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-full overflow-hidden mb-2 border-2 border-white/20">
            <div className="w-full h-full flex items-center justify-center text-white font-bold">P1</div>
          </div>
          <span className="text-white text-sm">Player 1</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-secondary rounded-full overflow-hidden mb-2 border-2 border-white/20">
            <div className="w-full h-full flex items-center justify-center text-white font-bold">P2</div>
          </div>
          <span className="text-white text-sm">Player 2</span>
        </div>
      </div>
      
      {/* Game board with integrated scoring */}
      <div 
        ref={gameRef}
        className="game-board w-full aspect-[16/10] relative bg-[#0b2046] rounded-lg border border-white/20 overflow-hidden"
        tabIndex={0}
      >
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 transform -translate-x-1/2 border-dashed"></div>
        
        {/* Integrated Score Display */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
          <div className="flex w-full justify-around">
            <span className="text-white/20 text-9xl font-bold">{gameState.playerScore}</span>
            <span className="text-white/20 text-9xl font-bold">{gameState.computerScore}</span>
          </div>
        </div>
        
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b2046]/90 backdrop-blur-sm z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
              PONG
            </h2>
            <p className="text-gray-300 text-lg mb-8 text-center px-6 max-w-md">
              Use <span className="text-primary">W/S</span> for Player 1 and <span className="text-secondary">↑/↓</span> for Player 2
            </p>
            <Button 
              onClick={toggleGame} 
              className="bg-[#0056d3] hover:bg-[#0048b3] text-white text-lg px-8 py-6 rounded-full"
            >
              <Play className="mr-2 h-5 w-5" />
              Play
            </Button>
          </div>
        )}
        
        {/* Chat Sidebar */}
        {showChat && (
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-[#0b2046]/90 backdrop-blur-sm border-l border-white/20 z-20 transform transition-transform duration-300 ease-in-out">
            <div className="p-4">
              <h3 className="text-white font-bold mb-2 flex justify-between items-center">
                Chat
                <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">×</button>
              </h3>
              <div className="bg-[#071835] rounded-lg h-[calc(100%-90px)] p-2 mb-2 overflow-y-auto">
                <div className="text-gray-400 text-sm italic">No messages yet</div>
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="bg-[#071835] border-none text-white text-sm rounded-l-lg p-2 flex-grow"
                />
                <button className="bg-[#0056d3] text-white rounded-r-lg px-3">
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Game Controls */}
      <div className="flex justify-center gap-4 mt-6">
        <Button 
          onClick={toggleGame} 
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 gap-2"
        >
          {gameState.isGameActive ? (
            <>
              <Pause className="h-4 w-4" />
              PAUSE
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              PLAY
            </>
          )}
        </Button>
        <Button 
          onClick={resetGame} 
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          RESTART
        </Button>
        <Button 
          variant="outline"
          className="border-white/20 text-white hover:bg-red-500/20 gap-2"
        >
          <Flag className="h-4 w-4" />
          GIVE UP
        </Button>
      </div>
    </div>
  );
};

export default PongGame;
