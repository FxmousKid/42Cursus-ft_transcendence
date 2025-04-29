
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

  return (
    <div
      ref={paddleRef}
      className={`pong-paddle absolute ${isPlayer ? 'bg-primary' : 'bg-secondary'}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        background: isPlayer 
          ? "linear-gradient(90deg, #4a9eda, #6eb7f7)" 
          : "linear-gradient(90deg, #40c8c8, #56e9e9)",
        borderRadius: '8px',
      }}
    />
  );
};

export default Paddle;
