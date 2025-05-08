import React from 'react';

interface PaddleProps {
  position: {
    x: number;
    y: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  side: 'left' | 'right';
  className?: string;
}

const Paddle: React.FC<PaddleProps> = ({ position, dimensions, side, className = '' }) => {
  const isLeft = side === 'left';
  
  return (
    <div
      className={`absolute rounded-md ${className}`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        background: isLeft 
          ? 'linear-gradient(90deg, #1a5fb4, #3584e4)' 
          : 'linear-gradient(90deg, #c01c28, #e01b24)',
        boxShadow: isLeft
          ? '0 0 8px 2px rgba(53, 132, 228, 0.5)'
          : '0 0 8px 2px rgba(224, 27, 36, 0.5)',
        zIndex: 10
      }}
    />
  );
};

export default Paddle;
