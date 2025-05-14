import { useEffect, useRef } from 'react';

interface PaddleProps {
  position: { x: number; y: number };
  width: number;
  height: number;
  isPlayer?: boolean;
  gameActive: boolean;
}

const Paddle: React.FC<PaddleProps> = ({ position, width, height, isPlayer = false, gameActive }) => {
  const paddleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paddle = paddleRef.current;
    if (!paddle) return;
    
    paddle.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }, [position]);

  // Colors for player 1 and player 2 paddles
  const paddleColor = isPlayer ? '#0056d3' : '#2c84ff';

  return (
    <div
      ref={paddleRef}
      className="pong-paddle absolute z-10"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Main paddle body */}
      <div 
        className="absolute inset-0 rounded-md"
        style={{
          backgroundColor: paddleColor,
          boxShadow: gameActive ? `0 0 15px ${paddleColor}` : 'none',
          transition: 'box-shadow 0.3s ease'
        }}
      />
      
      {/* Shine effect */}
      <div 
        className="absolute inset-0 rounded-md"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          opacity: 0.7
        }}
      />
      
      {/* Border */}
      <div
        className="absolute inset-0 rounded-md border border-white/30"
      />
    </div>
  );
};

export default Paddle;
