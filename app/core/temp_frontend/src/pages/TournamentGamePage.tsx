import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shuffle } from 'lucide-react';
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
  
  // Generate bracket matches based on players
  const generateBracketMatches = (playerList: Player[]) => {
    const matches = [];
    for (let i = 0; i < playerList.length; i += 2) {
      if (i + 1 < playerList.length) {
        matches.push({
          player1: playerList[i],
          player2: playerList[i + 1]
        });
      } else {
        matches.push({
          player1: playerList[i],
          player2: { id: -1, name: "TBD" }
        });
      }
    }
    return matches;
  };
  
  // Generate all rounds of the bracket
  const generateBracket = () => {
    const rounds = [];
    let currentRound = [...players];
    
    while (currentRound.length > 1) {
      rounds.push(generateBracketMatches(currentRound));
      
      // Next round contestants (placeholders)
      currentRound = currentRound.map((_, index) => {
        if (index % 2 === 0) {
          return { id: -1, name: "Winner" };
        }
        return null;
      }).filter(Boolean) as Player[];
    }
    
    return rounds;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10"></div>
      
      {/* Header */}
      <header className="py-4 px-6 bg-[#0b2046]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            TOURNAMENT SETUP
          </h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/game')}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Game Modes
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <Card className="bg-[#0b2046]/80 border-white/10 backdrop-blur-sm overflow-hidden p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Player Setup */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Tournament Players</h2>
              
              <div className="space-y-3 mb-6">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="w-6 text-center text-gray-400">{index + 1}</div>
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                      className="bg-[#071835] border-white/10 focus-visible:ring-[#0056d3] text-white"
                    />
                    {players.length > 2 && (
                      <button 
                        onClick={() => removePlayer(player.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                onClick={addPlayer}
                className="w-full bg-[#0056d3]/30 hover:bg-[#0056d3]/50 border border-[#0056d3]/50 flex items-center justify-center gap-2 mb-6"
              >
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
              
              <div className="bg-[#071835]/50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Tournament Rules</h3>
                <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
                  <li>For a valid bracket, player count must be a power of 2 (2, 4, 8, 16, etc.)</li>
                  <li>All players must have unique names</li>
                  <li>Matches are played in order from top to bottom</li>
                  <li>The tournament follows a single elimination format</li>
                </ul>
              </div>
            </div>
            
            {/* Right Column - Tournament Bracket */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Tournament Bracket</h2>
                <Button
                  onClick={randomizePlayers}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  Randomize
                </Button>
              </div>
              
              <div className="bg-[#071835]/30 rounded-lg p-6 h-[400px] overflow-auto">
                {players.length >= 2 ? (
                  <div className="tournament-bracket flex">
                    {generateBracket().map((round, roundIndex) => (
                      <div 
                        key={roundIndex} 
                        className="round flex-1 flex flex-col justify-around min-w-[180px] relative"
                        style={{ 
                          marginRight: roundIndex < generateBracket().length - 1 ? '40px' : '0',
                          height: `${Math.pow(2, roundIndex+1) * 50}px` 
                        }}
                      >
                        {/* Render match cards */}
                        {round.map((match, matchIndex) => (
                          <div 
                            key={matchIndex} 
                            className="match-container relative"
                            style={{ 
                              height: `${Math.pow(2, roundIndex) * 100}px`,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div className="match bg-[#0b2046] rounded-lg border border-white/10 overflow-hidden hover:bg-[#0d2650] transition-colors">
                              <div className={`p-3 border-b border-white/10 ${match.player1.name ? 'text-white' : 'text-gray-500'}`}>
                                {match.player1.name || 'Player 1'}
                              </div>
                              <div className={`p-3 ${match.player2.name ? 'text-white' : 'text-gray-500'}`}>
                                {match.player2.name || 'Player 2'}
                              </div>
                            </div>
                            
                            {/* Horizontal connector lines */}
                            {roundIndex < generateBracket().length - 1 && (
                              <div className="connector absolute top-1/2 right-0 h-px w-10 bg-white/30 -mr-10"></div>
                            )}
                          </div>
                        ))}
                        
                        {/* Vertical connector lines (drawn separately for cleaner appearance) */}
                        {roundIndex < generateBracket().length - 1 && round.map((_, matchIndex) => {
                          // Only create vertical connector for every odd-even pair
                          if (matchIndex % 2 === 0 && matchIndex + 1 < round.length) {
                            const startY = matchIndex * (Math.pow(2, roundIndex) * 100) + Math.pow(2, roundIndex) * 50;
                            const height = Math.pow(2, roundIndex) * 100;
                            
                            return (
                              <div 
                                key={`connector-${matchIndex}`}
                                className="absolute right-0 bg-white/30"
                                style={{
                                  width: '1px',
                                  height: `${height}px`,
                                  top: `${startY}px`,
                                  right: '-10px'
                                }}
                              ></div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Add at least 2 players to generate a bracket
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer Controls */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {!isValidBracket && (
                <span className="text-amber-400">
                  Current player count ({players.length}) is not valid for a tournament bracket. 
                  Use {Math.pow(2, Math.ceil(Math.log2(players.length)))} players for a complete bracket.
                </span>
              )}
              {!allPlayersNamed && isValidBracket && (
                <span className="text-amber-400">All players must have names</span>
              )}
            </div>
            <Button
              disabled={!canContinue}
              className="bg-[#0056d3] hover:bg-[#0048b3] text-white font-bold px-6"
            >
              CONTINUE
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default TournamentGamePage; 