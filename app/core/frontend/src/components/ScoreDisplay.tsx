import React from 'react';

interface ScoreDisplayProps {
  player1Score: number;
  player2Score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ player1Score, player2Score }) => {
  return (
    <div className="flex items-center gap-6 md:gap-10 px-8 py-2 rounded-full bg-gradient-to-r from-blue-900/40 to-blue-800/40 backdrop-blur-sm border border-blue-700/20 shadow-md">
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">Joueur 1</span>
        <div className="text-4xl font-bold text-white">{player1Score}</div>
      </div>
      
      <div className="text-xl font-bold text-blue-400">VS</div>
      
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium text-red-200 uppercase tracking-wider mb-1">Joueur 2</span>
        <div className="text-4xl font-bold text-white">{player2Score}</div>
      </div>
    </div>
  );
};

export default ScoreDisplay; 