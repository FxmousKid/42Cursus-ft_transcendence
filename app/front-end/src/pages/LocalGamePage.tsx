import PongGame from '@/components/PongGame';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LocalGamePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10"></div>
      
      {/* Header */}
      <header className="py-4 px-6 bg-[#0b2046]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            LOCAL GAME
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
      
      {/* Game container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <PongGame />
      </main>
      
      {/* Footer */}
      <footer className="bg-[#0b2046]/80 backdrop-blur-sm py-6 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-sm text-gray-300">© {new Date().getFullYear()} Transcendence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LocalGamePage; 