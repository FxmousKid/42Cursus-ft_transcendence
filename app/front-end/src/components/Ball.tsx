
import { useEffect, useRef } from 'react';

interface BallProps {
  position: { x: number; y: number };
  radius: number;
}

const Ball: React.FC<BallProps> = ({ position, radius }) => {
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;
    
    ball.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }, [position]);

  return (
    <div
      ref={ballRef}
      className="pong-ball absolute"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        background: "linear-gradient(135deg, #fff, #ccc)",
        boxShadow: "0 0 10px rgba(255, 255, 255, 0.7)",
      }}
    />
  );
};

export default Ball;
