import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Gamepad2 } from 'lucide-react';

interface GameModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const GameModeCard = ({ title, description, icon, onClick }: GameModeCardProps) => (
  <Card 
    onClick={onClick}
    className="bg-[#0b2046] text-white border-none cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#0d2650] flex flex-col h-full relative overflow-hidden"
  >
    {/* Subtle glow effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#0056d3]/10 to-transparent opacity-70"></div>
    
    <CardHeader className="flex items-center justify-center pt-8 relative z-10">
      <div className="p-4 rounded-full bg-[#0056d3]/20 mb-4 flex items-center justify-center">
        {icon}
      </div>
      <CardTitle className="text-2xl text-center font-bold">{title}</CardTitle>
    </CardHeader>
    
    <CardContent className="flex-grow text-center relative z-10">
      <p className="text-gray-300 text-sm">{description}</p>
    </CardContent>
    
    <CardFooter className="justify-center pt-2 pb-6 relative z-10">
      <div className="bg-[#0056d3] text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors hover:bg-[#0048b3]">
        SELECT
      </div>
    </CardFooter>
  </Card>
);

export function GameModeSelection() {
  const navigate = useNavigate();

  const handleModeSelect = (mode: string) => {
    if (mode === 'local') {
      // Navigate to the local game
      navigate('/game/local');
    } else if (mode === 'tournament') {
      // Navigate to the tournament page
      navigate('/game/tournament');
    } else if (mode === 'friends') {
      // Navigate to the friends game page
      navigate('/game/friends');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
        Choose Game Mode
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GameModeCard
          title="LOCAL"
          description="Play against a friend on the same device. Take turns controlling paddles using keyboard controls."
          icon={<Gamepad2 size={36} className="text-[#0056d3]" />}
          onClick={() => handleModeSelect('local')}
        />
        
        <GameModeCard
          title="TOURNAMENT"
          description="Join or create tournaments with multiple players and compete for the championship."
          icon={<Trophy size={36} className="text-[#0056d3]" />}
          onClick={() => handleModeSelect('tournament')}
        />
        
        <GameModeCard
          title="FRIENDS"
          description="Challenge your friends to an online match. Send invites and compete remotely."
          icon={<Users size={36} className="text-[#0056d3]" />}
          onClick={() => handleModeSelect('friends')}
        />
      </div>
      
      <div className="text-center mt-16 text-sm text-gray-400">
        © Transcendence 2025
      </div>
    </div>
  );
}

export default GameModeSelection; 