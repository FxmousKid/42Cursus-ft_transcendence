import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shuffle, X, Trophy, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Player {
  id: number;
  name: string;
}

const TournamentGamePage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '' },
    { id: 2, name: '' }
  ]);
  const [nextId, setNextId] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if we have a complete bracket (power of 2)
  const isPowerOfTwo = (n: number) => {
    return n > 0 && (n & (n - 1)) === 0;
  };
  
  const isValidBracket = isPowerOfTwo(players.length);
  const allPlayersNamed = players.every(player => player.name.trim() !== '');
  const canContinue = isValidBracket && allPlayersNamed && players.length >= 2;
  
  const addPlayer = () => {
    setPlayers([...players, { id: nextId, name: '' }]);
    setNextId(nextId + 1);
  };
  
  const updatePlayerName = (id: number, name: string) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, name } : player
    ));
  };
  
  const removePlayer = (id: number) => {
    if (players.length > 2) {
      setPlayers(players.filter(player => player.id !== id));
    }
  };
  
  const randomizePlayers = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    setPlayers(shuffled);
  };
  
  const handleStartTournament = () => {
    if (!canContinue) return;
    
    setIsSubmitting(true);
    // Simulate loading for demo
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate or start tournament logic would go here
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001a40] to-[#001230] text-white flex flex-col">
      {/* Header */}
      <header className="py-5 px-6 bg-[#00102a]/90 backdrop-blur-sm border-b border-[#1a3366]/30">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/game')}
            className="text-sm text-white/70 hover:text-white flex items-center gap-2 transition-colors hover:translate-x-[-3px] duration-200"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-bold tracking-wider">TOURNAMENT</h1>
          <div className="w-[60px]"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="bg-[#00102a]/95 backdrop-blur-sm border border-[#1a3366]/20 shadow-2xl rounded-xl w-full max-w-3xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-10 relative">
              <div className="absolute w-40 h-40 rounded-full border-4 border-[#1a3366]/20 border-dashed animate-spin-slow"></div>
              <Trophy className="h-10 w-10 text-[#3d85ff] mr-3 drop-shadow-glow" />
              <h2 className="text-2xl font-bold">Tournament Setup</h2>
            </div>
            
            {/* Players Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-[#3d85ff] mr-2" />
                  <h3 className="text-lg font-medium">Players <span className="text-[#3d85ff] ml-1">({players.length})</span></h3>
                </div>
                <div className="transition hover:scale-105 active:scale-95 duration-200">
                  <Button
                    onClick={randomizePlayers}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-[#1a3366]/30"
                  >
                    <Shuffle className="h-4 w-4 mr-2" /> Shuffle
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 bg-[#1a3366]/40 rounded-full flex items-center justify-center text-sm font-medium text-[#3d85ff] shadow-inner">
                      {index + 1}
                    </div>
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="bg-[#1a3366]/30 border-[#1a3366]/50 focus-visible:ring-[#3d85ff] text-white rounded-lg h-10 shadow-inner transition-all duration-200"
                    />
                    {players.length > 2 && (
                      <button 
                        onClick={() => removePlayer(player.id)}
                        className="opacity-0 group-hover:opacity-100 w-9 h-9 bg-[#1a3366]/30 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-all hover:scale-110 active:scale-90 hover:bg-[rgba(61,133,255,0.2)] duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 transition hover:scale-[1.02] active:scale-[0.98] duration-200">
                <Button
                  onClick={addPlayer}
                  variant="outline"
                  className="w-full border-dashed border-[#1a3366]/50 text-white/70 hover:text-white hover:bg-[#1a3366]/30 hover:border-[#3d85ff]/60 transition-all duration-300 h-10"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Player
                </Button>
              </div>
            </div>
            
            {/* Information and Status */}
            {!isValidBracket && (
              <div 
                className="bg-gradient-to-r from-[#1a3366]/20 to-[#1a3366]/30 border-l-4 border-[#3d85ff] rounded-r-lg p-4 mb-8"
              >
                <p className="text-sm text-[#3d85ff] font-medium">
                  For a valid tournament, you need {Math.pow(2, Math.ceil(Math.log2(players.length)))} players.
                  {Math.pow(2, Math.ceil(Math.log2(players.length))) - players.length > 0 && 
                    ` Add ${Math.pow(2, Math.ceil(Math.log2(players.length))) - players.length} more.`}
                </p>
              </div>
            )}
            
            {!allPlayersNamed && isValidBracket && (
              <div 
                className="bg-gradient-to-r from-[#1a3366]/20 to-[#1a3366]/30 border-l-4 border-[#3d85ff] rounded-r-lg p-4 mb-8"
              >
                <p className="text-sm text-[#3d85ff] font-medium">All players must have names.</p>
              </div>
            )}
            
            {/* Tournament Rules */}
            <div className="mb-10 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gradient-to-br from-[#1a3366]/30 to-[#1a3366]/20 backdrop-blur-sm rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="text-white/60 mb-2 uppercase tracking-wider text-xs">Players</div>
                <div className="text-xl font-bold">2, 4, 8, 16...</div>
                <div className="text-white/60 text-xs mt-1">Power of 2</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a3366]/30 to-[#1a3366]/20 backdrop-blur-sm rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="text-white/60 mb-2 uppercase tracking-wider text-xs">Format</div>
                <div className="text-xl font-bold">Single Elimination</div>
                <div className="text-white/60 text-xs mt-1">One chance</div>
              </div>
            </div>
            
            {/* Start Button */}
            <div className={`transition duration-200 ${canContinue ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}>
              <Button
                onClick={handleStartTournament}
                disabled={!canContinue || isSubmitting}
                className={`w-full py-6 text-lg font-bold tracking-wider transition-all duration-300 rounded-xl shadow-xl
                  ${canContinue 
                    ? 'bg-gradient-to-r from-[#3d85ff] to-[#1a6be5] hover:from-[#3d85ff] hover:to-[#1259c7] text-white' 
                    : 'bg-[#1a3366]/30 text-white/30 cursor-not-allowed'}`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SETTING UP...
                  </div>
                ) : "START TOURNAMENT"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default TournamentGamePage; 