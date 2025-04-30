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

  const gradientColor = isPlayer ? 'primary' : 'secondary';

  return (
    <div
      ref={paddleRef}
      className={`pong-paddle absolute`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Main paddle body */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(90deg, hsl(var(--${gradientColor})), hsl(var(--${gradientColor}) / 0.8))`,
        }}
      />
      
      {/* Shine effect */}
      <div 
        className="absolute inset-0 rounded-lg opacity-50"
        style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 50%)`,
        }}
      />
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-lg opacity-30"
        style={{
          boxShadow: `0 0 20px hsl(var(--${gradientColor}))`,
        }}
      />
      
      {/* Active state indicator */}
      {gameActive && (
        <div 
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(var(--${gradientColor}) / 0.2))`,
          }}
        />
      )}
    </div>
  );
};

export default Paddle;
