import React from 'react';
import { Trophy } from 'lucide-react';

interface ScoreboardProps {
  playerScore: number;
  computerScore: number;
}

const ScoreCard = ({ score, label, color }: { score: number; label: string; color: string }) => (
  <div className={`flex flex-col items-center p-4 elegant-card group hover:scale-105 transition-transform`}>
    <span className={`text-${color} text-lg font-medium mb-1`}>{label}</span>
    <span className={`text-${color} text-5xl sm:text-6xl font-bold tabular-nums`}>
      {score.toString().padStart(2, '0')}
    </span>
    {score >= 5 && (
      <Trophy className={`text-${color} mt-2 animate-bounce`} />
    )}
  </div>
);

const Scoreboard: React.FC<ScoreboardProps> = ({ playerScore, computerScore }) => {
  return (
    <div className="flex justify-center items-center gap-12 mb-8">
      <ScoreCard score={playerScore} label="PLAYER 1" color="primary" />
      <div className="flex flex-col items-center justify-center">
        <span className="text-muted-foreground text-lg font-medium">VS</span>
        <div className="h-px w-8 bg-muted-foreground/30 my-2" />
      </div>
      <ScoreCard score={computerScore} label="PLAYER 2" color="secondary" />
    </div>
  );
};

export default Scoreboard;
