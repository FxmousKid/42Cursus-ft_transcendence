
import React from 'react';

interface ScoreboardProps {
  playerScore: number;
  computerScore: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ playerScore, computerScore }) => {
  return (
    <div className="flex justify-center items-center gap-12 text-4xl sm:text-5xl font-bold mt-2 mb-4">
      <div className="flex flex-col items-center p-3 bg-card backdrop-blur-sm rounded-xl shadow-md border border-border">
        <span className="text-primary text-lg">YOU</span>
        <span className="text-primary text-5xl sm:text-6xl">{playerScore}</span>
      </div>
      <div className="flex justify-center items-center w-12 h-12 text-lg">
        <span className="text-muted-foreground">VS</span>
      </div>
      <div className="flex flex-col items-center p-3 bg-card backdrop-blur-sm rounded-xl shadow-md border border-border">
        <span className="text-secondary text-lg">OPP</span>
        <span className="text-secondary text-5xl sm:text-6xl">{computerScore}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
