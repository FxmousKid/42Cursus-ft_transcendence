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
      className="pong-ball absolute z-10"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Inner glow effect */}
      <div 
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle at 30% 30%, white, transparent)`,
        }}
      />
    </div>
  );
};

export default Ball;
