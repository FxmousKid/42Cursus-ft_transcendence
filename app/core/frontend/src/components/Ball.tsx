import React from 'react';

interface BallProps {
  position: {
    x: number;
    y: number;
  };
  size: number;
  className?: string;
}

const Ball: React.FC<BallProps> = ({ position, size, className = '' }) => {
  return (
    <div
      className={`absolute rounded-full ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        background: 'white',
        boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.7), 0 0 20px 4px rgba(100, 150, 255, 0.5)',
        zIndex: 20
      }}
    />
  );
};

export default Ball;
