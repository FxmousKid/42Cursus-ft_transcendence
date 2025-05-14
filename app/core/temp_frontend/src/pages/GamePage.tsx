import PongGame from '@/components/PongGame';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const GamePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-primary w-64 h-64 top-20 left-10 -z-10"></div>
      <div className="blob blob-secondary w-72 h-72 bottom-20 right-10 -z-10"></div>
      <div className="blob blob-accent w-48 h-48 bottom-40 left-1/4 -z-10"></div>
      
      {/* Game container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <PongGame />
      </main>
      
      {/* Game instructions */}
      <section className="py-10 px-6 bg-card/40 backdrop-blur-sm border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-secondary text-center">How to Play</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="instruction-card">
              <h3 className="text-lg font-bold mb-2 text-primary">Controls</h3>
              <p className="text-muted-foreground">Player 1: W (up) / S (down)</p>
              <p className="text-muted-foreground">Player 2: ↑ (up) / ↓ (down)</p>
            </div>
            
            <div className="instruction-card">
              <h3 className="text-lg font-bold mb-2 text-secondary">Scoring</h3>
              <p className="text-muted-foreground">Score points by getting the ball past your opponent's paddle.</p>
            </div>
            
            <div className="instruction-card">
              <h3 className="text-lg font-bold mb-2 text-accent">Victory</h3>
              <p className="text-muted-foreground">The first player to reach 10 points wins the match!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GamePage;
