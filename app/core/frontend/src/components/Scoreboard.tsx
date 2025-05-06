import React from 'react';

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
  className?: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ 
  player1Score, 
  player2Score, 
  className = '' 
}) => {
  return (
    <div className={`flex justify-between items-center gap-12 my-4 ${className}`}>
      <div className="flex flex-col items-center p-3 bg-card/70 backdrop-blur-sm rounded-xl shadow-md border border-primary/20">
        <span className="text-primary text-sm font-semibold uppercase tracking-wider">Joueur 1</span>
        <span className="text-primary text-4xl md:text-5xl font-bold">{player1Score}</span>
      </div>
      
      <div className="flex justify-center items-center w-12 h-12 text-xl">
        <span className="text-muted-foreground font-bold">VS</span>
      </div>
      
      <div className="flex flex-col items-center p-3 bg-card/70 backdrop-blur-sm rounded-xl shadow-md border border-secondary/20">
        <span className="text-secondary text-sm font-semibold uppercase tracking-wider">Joueur 2</span>
        <span className="text-secondary text-4xl md:text-5xl font-bold">{player2Score}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
