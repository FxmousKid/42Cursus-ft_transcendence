import React, { useEffect, useRef, useState } from 'react';
import Ball from './Ball';
import Paddle from './Paddle';
import ScoreDisplay from './ScoreDisplay';


const PongGame: React.FC = () => {
  // Références
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(0);
  const requestAnimationFrameIdRef = useRef<number>(0);
  
  // Dimensions du jeu
  const [gameSize, setGameSize] = useState({
    width: 800,
    height: 500
  });
  
  // État des touches
  const [keys, setKeys] = useState({
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  });
  
  // État du jeu
  const [gameState, setGameState] = useState({
    player1Position: 0,
    player2Position: 0,
    ball: {
      x: 0,
      y: 0,
      velocityX: 5,
      velocityY: 3
    },
    scores: {
      player1: 0,
      player2: 0
    },
    isRunning: false,
    isPaused: false,
    lastScorer: null as 'player1' | 'player2' | null
  });
  
  // Dimensions des raquettes et de la balle
  const paddleWidth = 10;
  const paddleHeight = 80;
  const ballSize = 14;
  
  // Gérer le redimensionnement du jeu
  useEffect(() => {
    const resizeGame = () => {
      if (gameContainerRef.current) {
        const containerWidth = Math.min(window.innerWidth - 40, 800);
        const containerHeight = Math.min(window.innerHeight - 230, 500);
        
        setGameSize({
          width: containerWidth,
          height: containerHeight
        });
      }
    };
    
    resizeGame();
    window.addEventListener('resize', resizeGame);
    
    return () => {
      window.removeEventListener('resize', resizeGame);
    };
  }, []);
  
  // Initialisation du jeu
  useEffect(() => {
    resetGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSize.width, gameSize.height]);
  
  // Réinitialiser le jeu
  const resetGame = () => {
    setGameState(prevState => ({
      ...prevState,
      player1Position: (gameSize.height - paddleHeight) / 2,
      player2Position: (gameSize.height - paddleHeight) / 2,
      ball: {
        x: gameSize.width / 2 - ballSize / 2,
        y: gameSize.height / 2 - ballSize / 2,
        velocityX: Math.random() > 0.5 ? 5 : -5,
        velocityY: (Math.random() * 2 - 1) * 3
      },
      scores: {
        player1: 0,
        player2: 0
      },
      isRunning: false,
      isPaused: false,
      lastScorer: null
    }));
    
    // Réinitialiser le temps écoulé
    lastTimeRef.current = 0;
    
    setTimeout(() => {
      setGameState(prevState => ({ ...prevState, isRunning: true }));
    }, 1000);
  };
  
  // Mettre en pause ou reprendre le jeu
  const togglePause = () => {
    setGameState(prevState => ({
      ...prevState,
      isPaused: !prevState.isPaused
    }));
  };
  
  // Logique de mise à jour du jeu avec delta time pour une meilleure fluidité
  const updateGame = (timestamp: number) => {
    // Calculer le delta time (temps écoulé depuis la dernière frame)
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = (timestamp - lastTimeRef.current) / 16.67; // Normaliser par rapport à 60fps
    lastTimeRef.current = timestamp;
    
    setGameState(prevState => {
      if (!prevState.isRunning || prevState.isPaused) return prevState;
      
      // Copie de l'état pour modifications
      const newState = { ...prevState };
      
      // Vitesse de déplacement des raquettes (plus sensible)
      const paddleSpeed = 7 * deltaTime;
      
      // Gérer le mouvement de la raquette du joueur 1 (W/S)
      if (keys.w) {
        newState.player1Position = Math.max(0, newState.player1Position - paddleSpeed);
      }
      if (keys.s) {
        newState.player1Position = Math.min(gameSize.height - paddleHeight, newState.player1Position + paddleSpeed);
      }
      
      // Gérer le mouvement de la raquette du joueur 2 (flèches haut/bas)
      if (keys.ArrowUp) {
        newState.player2Position = Math.max(0, newState.player2Position - paddleSpeed);
      }
      if (keys.ArrowDown) {
        newState.player2Position = Math.min(gameSize.height - paddleHeight, newState.player2Position + paddleSpeed);
      }
      
      // Mettre à jour la position de la balle avec le deltaTime pour un mouvement plus fluide
      let newBallX = newState.ball.x + newState.ball.velocityX * deltaTime;
      let newBallY = newState.ball.y + newState.ball.velocityY * deltaTime;
      
      // Collision avec les raquettes
      // Raquette gauche (joueur 1)
      if (newBallX <= paddleWidth && 
          newBallY + ballSize >= newState.player1Position && 
          newBallY <= newState.player1Position + paddleHeight) {
          
        // Calculer où la balle a frappé la raquette (0 = haut, 1 = bas)
        const hitPosition = (newBallY + ballSize/2 - newState.player1Position) / paddleHeight;
        
        // Changer l'angle en fonction de l'endroit où la balle a frappé
        const angleModifier = 2.5 * (hitPosition - 0.5); // -1.25 à 1.25
        
        // Inverser la direction X et ajuster légèrement la vitesse
        // Accélération plus progressive
        newState.ball.velocityX = Math.abs(newState.ball.velocityX) * 1.03;
        
        // Ajuster la vélocité Y en fonction de l'endroit où la balle a frappé la raquette
        // Angle plus prononcé
        newState.ball.velocityY = angleModifier * 5;
        
        // Ajouter un effet plus naturel basé sur le mouvement de la raquette
        if (keys.w) newState.ball.velocityY -= 1; // Si la raquette monte, la balle prend un peu de cette vitesse
        if (keys.s) newState.ball.velocityY += 1; // Si la raquette descend, la balle prend un peu de cette vitesse
        
        // Repositionner la balle pour éviter qu'elle ne reste coincée
        newBallX = paddleWidth;
      }
      
      // Raquette droite (joueur 2)
      if (newBallX + ballSize >= gameSize.width - paddleWidth && 
          newBallY + ballSize >= newState.player2Position && 
          newBallY <= newState.player2Position + paddleHeight) {
          
        // Même logique que pour la raquette gauche
        const hitPosition = (newBallY + ballSize/2 - newState.player2Position) / paddleHeight;
        const angleModifier = 2.5 * (hitPosition - 0.5);
        
        // Inverser la direction X et ajuster légèrement la vitesse
        newState.ball.velocityX = -Math.abs(newState.ball.velocityX) * 1.03;
        
        // Ajuster la vélocité Y en fonction de l'endroit où la balle a frappé la raquette
        newState.ball.velocityY = angleModifier * 5;
        
        // Ajouter un effet plus naturel basé sur le mouvement de la raquette
        if (keys.ArrowUp) newState.ball.velocityY -= 1; // Si la raquette monte, la balle prend un peu de cette vitesse
        if (keys.ArrowDown) newState.ball.velocityY += 1; // Si la raquette descend, la balle prend un peu de cette vitesse
        
        // Repositionner la balle
        newBallX = gameSize.width - paddleWidth - ballSize;
      }
      
      // Collision avec les bords haut et bas
      if (newBallY <= 0) {
        newState.ball.velocityY = Math.abs(newState.ball.velocityY);
        newBallY = 0;
        // Légère modification aléatoire de la trajectoire pour plus de naturel
        newState.ball.velocityY += (Math.random() * 0.4 - 0.2);
      } else if (newBallY + ballSize >= gameSize.height) {
        newState.ball.velocityY = -Math.abs(newState.ball.velocityY);
        newBallY = gameSize.height - ballSize;
        // Légère modification aléatoire de la trajectoire pour plus de naturel
        newState.ball.velocityY += (Math.random() * 0.4 - 0.2);
      }
      
      // Limiter la vitesse maximale de la balle
      const maxSpeedX = 12;
      const maxSpeedY = 8;
      if (Math.abs(newState.ball.velocityX) > maxSpeedX) {
        newState.ball.velocityX = maxSpeedX * Math.sign(newState.ball.velocityX);
      }
      if (Math.abs(newState.ball.velocityY) > maxSpeedY) {
        newState.ball.velocityY = maxSpeedY * Math.sign(newState.ball.velocityY);
      }
      
      // Vérifier si un joueur a marqué
      if (newBallX <= 0) {
        // Joueur 2 marque
        newState.scores.player2 += 1;
        newState.lastScorer = 'player2';
        resetBall(newState);
        return newState;
      } else if (newBallX + ballSize >= gameSize.width) {
        // Joueur 1 marque
        newState.scores.player1 += 1;
        newState.lastScorer = 'player1';
        resetBall(newState);
        return newState;
      }
      
      // Mise à jour de la position de la balle
      newState.ball.x = newBallX;
      newState.ball.y = newBallY;
      
      return newState;
    });
  };
  
  // Réinitialiser la balle après un point
  const resetBall = (state: typeof gameState) => {
    state.ball = {
      x: gameSize.width / 2 - ballSize / 2,
      y: gameSize.height / 2 - ballSize / 2,
      velocityX: state.lastScorer === 'player1' ? -5 : 5,
      velocityY: (Math.random() * 2 - 1) * 3
    };
    state.isRunning = false;
    
    // Réinitialiser le temps écoulé
    lastTimeRef.current = 0;
    
    setTimeout(() => {
      setGameState(prevState => ({ ...prevState, isRunning: true }));
    }, 1000);
  };
  
  // Relancer la balle
  const relaunchBall = () => {
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.ball = {
        x: gameSize.width / 2 - ballSize / 2,
        y: gameSize.height / 2 - ballSize / 2,
        velocityX: Math.random() > 0.5 ? 5 : -5,
        velocityY: (Math.random() * 2 - 1) * 3
      };
      newState.isRunning = true;
      newState.isPaused = false;
      return newState;
    });
  };
  
  // Boucle de jeu avec requestAnimationFrame
  useEffect(() => {
    if (!gameState.isRunning) return;
    
    const gameLoop = (timestamp: number) => {
      updateGame(timestamp);
      if (gameState.isRunning) {
        requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop);
      }
    };
    
    requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (requestAnimationFrameIdRef.current) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.isRunning]);
  
  // Contrôles du clavier avec gestion des keypresses continus
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); // Empêcher le défilement de la page avec les flèches
        setKeys(prevKeys => ({
          ...prevKeys,
          [e.key]: true
        }));
      } else if (e.key === 'r') {
        resetGame();
      } else if (e.key === 'p' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault(); // Empêcher le défilement de la page avec la barre d'espace
        togglePause();
      } else if (e.key === 'Enter') {
        relaunchBall();
      }
    };
    
    const keyUpHandler = (e: KeyboardEvent) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setKeys(prevKeys => ({
          ...prevKeys,
          [e.key]: false
        }));
      }
    };
    
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, []);
  
  // Relancer la balle après un point
  useEffect(() => {
    if (gameState.lastScorer) {
      const timer = setTimeout(() => {
        relaunchBall();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.lastScorer]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      
      {/* Scoreboard épuré */}
      <div className="flex items-center justify-center w-full my-2">
        <ScoreDisplay player1Score={gameState.scores.player1} player2Score={gameState.scores.player2} />
      </div>
      
      {/* Aire de jeu centrée */}
      <div 
        ref={gameContainerRef}
        className="relative mx-auto overflow-hidden rounded-lg border border-blue-900/30 shadow-[0_0_15px_rgba(0,30,60,0.5)]"
        style={{
          width: `${gameSize.width}px`,
          height: `${gameSize.height}px`,
          background: 'linear-gradient(to bottom, #0a1929, #07101b)',
        }}
      >
        {/* Ligne médiane */}
        <div 
          className="absolute h-full w-0.5 left-1/2 transform -translate-x-1/2 z-5"
          style={{ 
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 10px, rgba(100, 150, 255, 0.4) 10px, rgba(100, 150, 255, 0.4) 20px)'
          }}
        />
        
        {/* Raquette du joueur 1 */}
        <Paddle
          position={{ x: 0, y: gameState.player1Position }}
          dimensions={{ width: paddleWidth, height: paddleHeight }}
          side="left"
        />
        
        {/* Raquette du joueur 2 */}
        <Paddle
          position={{ x: gameSize.width - paddleWidth, y: gameState.player2Position }}
          dimensions={{ width: paddleWidth, height: paddleHeight }}
          side="right"
        />
        
        {/* Balle */}
        <Ball position={gameState.ball} size={ballSize} />
        
        {/* Indicateur d'état non bloquant */}
        {(!gameState.isRunning || gameState.isPaused) && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-[1px] rounded-full">
              <span className="text-sm font-medium text-white">
                {gameState.isPaused ? 'Pause' : gameState.lastScorer ? `Point pour Joueur ${gameState.lastScorer === 'player1' ? '1' : '2'}` : 'Prêt ?'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Contrôles sous le jeu */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5 w-full max-w-2xl px-4">
        <button 
          onClick={togglePause}
          className="px-5 py-2 rounded-full bg-slate-200 text-blue-700 text-sm font-medium shadow-md hover:bg-slate-300 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
        >
          {gameState.isPaused ? 'Reprendre' : 'Pause'}
        </button>
        
        <button 
          onClick={resetGame}
          className="px-5 py-2 rounded-full bg-slate-200 text-blue-700 text-sm font-medium shadow-md hover:bg-slate-300 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
        >
          Redémarrer
        </button>
        
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-800/50 backdrop-blur-sm rounded-full border border-blue-900/20">
          <span className="text-xs text-white/80">Touches:</span>
          <span className="text-xs font-mono text-white/70 bg-gray-700/50 px-1.5 py-0.5 rounded">W/S</span>
          <span className="text-xs text-white/70">|</span>
          <span className="text-xs font-mono text-white/70 bg-gray-700/50 px-1.5 py-0.5 rounded">↑/↓</span>
          <span className="text-xs text-white/70">|</span>
          <span className="text-xs font-mono text-white/70 bg-gray-700/50 px-1.5 py-0.5 rounded">ESC</span>
        </div>
      </div>
    </div>
  );
};

export default PongGame;
