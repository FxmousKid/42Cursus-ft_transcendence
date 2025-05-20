import { Trophy, History, ChevronRight, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import type { MatchData } from '@/services/api';
import { Button } from '@/components/ui/button';

interface MatchHistoryProps {
  matches: MatchData[];
}

const MatchResult = ({ match }: { match: MatchData }) => {
  const isWin = match.result === 'Win';
  
  return (
    <div className="group relative bg-black/20 border border-white/10 rounded-lg overflow-hidden hover:border-blue-500/30 transition-all duration-200">
      <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-blue-500 to-gray-500 opacity-50 group-hover:opacity-100"></div>
      
      <div className="flex items-center p-4 pl-5">
        {/* Result icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          isWin 
            ? 'bg-blue-500/10 text-blue-400' 
            : 'bg-rose-500/10 text-rose-400'
        }`}>
          {isWin ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        </div>
        
        {/* Match details */}
        <div className="ml-4 flex-1">
          <div className="flex items-center">
            <h3 className="font-semibold">Match vs {match.opponent}</h3>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              isWin 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isWin ? 'Victoire' : 'Défaite'}
            </span>
          </div>
          <p className="text-sm text-white/50">{match.score}</p>
        </div>
        
        {/* Date */}
        <div className="text-right flex items-center">
          <p className="text-sm text-white/60 mr-2">{match.date}</p>
          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

const ExampleMatch = () => {
  return (
    <div className="group relative bg-black/20 border border-white/10 border-dashed rounded-lg overflow-hidden hover:border-blue-500/30 transition-all duration-200">
      <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-blue-500 to-gray-500 opacity-50 group-hover:opacity-100"></div>
      
      <div className="flex items-center p-4 pl-5">
        {/* Result icon */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400">
          <TrendingUp className="h-5 w-5" />
        </div>
        
        {/* Match details */}
        <div className="ml-4 flex-1">
          <div className="flex items-center">
            <h3 className="font-semibold">Match vs ExempleJoueur</h3>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
              Victoire
            </span>
          </div>
          <p className="text-sm text-white/50">10-5</p>
        </div>
        
        {/* Date */}
        <div className="text-right flex items-center">
          <p className="text-sm text-white/60 mr-2">Aujourd'hui</p>
          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

const MatchHistory = ({ matches }: MatchHistoryProps) => {
  // Calculate stats
  const totalMatches = matches.length;
  const wins = matches.filter(match => match.result === 'Win').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Historique de matchs</h2>
          <p className="text-white/50 mt-1">Vos performances récentes</p>
        </div>
        
        {/* Stats overview */}
        {matches.length > 0 && (
          <div className="flex gap-4 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-3">
            <div className="px-3 border-r border-white/10">
              <p className="text-xs text-white/50">Total</p>
              <p className="text-lg font-semibold">{totalMatches}</p>
            </div>
            <div className="px-3 border-r border-white/10">
              <p className="text-xs text-white/50">Victoires</p>
              <p className="text-lg font-semibold text-blue-400">{wins}</p>
            </div>
            <div className="px-3">
              <p className="text-xs text-white/50">Win Rate</p>
              <p className="text-lg font-semibold">{winRate}%</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Match list */}
      {matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((match, index) => (
            <MatchResult key={index} match={match} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mb-4">
              <Trophy className="h-7 w-7 text-white/20" />
            </div>
            <h3 className="text-xl font-medium mb-2">Aucun match joué</h3>
            <p className="text-white/50 max-w-md text-center mb-6">
              Vos matchs apparaîtront ici une fois que vous commencerez à jouer. 
              Lancez-vous dans une partie dès maintenant !
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Jouer maintenant
            </Button>
          </div>
          
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-medium mb-4">À quoi ressemblera votre match :</h3>
            <ExampleMatch />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchHistory; 