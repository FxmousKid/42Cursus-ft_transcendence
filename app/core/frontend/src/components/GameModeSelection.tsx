import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const GameModeCard = ({ title, description, icon, onClick }: GameModeCardProps) => (
  <Card 
    onClick={onClick}
    className="simple-card simple-card-hover cursor-pointer transition-all"
  >
    <CardHeader className="simple-text-center">
      <div className="simple-feature-icon simple-mx-auto mb-4 transition-transform duration-300 transform group-hover:scale-110">
        {icon}
      </div>
      <CardTitle className="simple-feature-title">{title}</CardTitle>
    </CardHeader>
    
    <CardContent className="simple-text-center">
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
    
    <CardFooter className="justify-center pt-4">
      <Button className="simple-btn">
        SELECT
      </Button>
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
    <div className="simple-container simple-my-8">
      <h2 className="simple-feature-section-title mb-8">
        Choose <span className="simple-text-primary">Game Mode</span>
      </h2>
      
      <div className="simple-grid simple-grid-3 gap-6">
        <GameModeCard
          title="LOCAL"
          description="Play against a friend on the same device. Take turns controlling paddles using keyboard controls."
          icon={<Gamepad2 size={36} className="simple-text-primary" />}
          onClick={() => handleModeSelect('local')}
        />
        
        <GameModeCard
          title="TOURNAMENT"
          description="Join or create tournaments with multiple players and compete for the championship."
          icon={<Trophy size={36} className="simple-text-primary" />}
          onClick={() => handleModeSelect('tournament')}
        />
        
        <GameModeCard
          title="FRIENDS"
          description="Challenge your friends to an online match. Send invites and compete remotely."
          icon={<Users size={36} className="simple-text-primary" />}
          onClick={() => handleModeSelect('friends')}
        />
      </div>
      
      <div className="simple-text-center mt-16">
        <div className="simple-flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="text-lg font-bold simple-text-primary">PONG</span>
        </div>
        <span className="text-sm text-muted-foreground">
          © Transcendence {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}

export default GameModeSelection; 