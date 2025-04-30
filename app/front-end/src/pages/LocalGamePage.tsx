import PongGame from '@/components/PongGame';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LocalGamePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-primary w-64 h-64 top-20 left-10 -z-10"></div>
      <div className="blob blob-secondary w-72 h-72 bottom-20 right-10 -z-10"></div>
      <div className="blob blob-accent w-48 h-48 bottom-40 left-1/4 -z-10"></div>
      
      {/* Header */}
      <header className="py-4 px-6 bg-card/40 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            LOCAL GAME
          </h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/game')}
            className="border-primary text-primary hover:bg-primary/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Game Modes
          </Button>
        </div>
      </header>
      
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
      
      {/* Footer */}
      <footer className="bg-card/40 backdrop-blur-sm py-6 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Transcendence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LocalGamePage; 