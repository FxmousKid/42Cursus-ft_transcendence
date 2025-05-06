import PongGame from '@/components/PongGame';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

const LocalGamePage = () => {
  const navigate = useNavigate();
  
  // Prevent scrolling on this page when using arrow keys
  useEffect(() => {
    // Prevent default arrow key behavior on this page
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Set body to prevent overflow
    document.body.style.overflow = 'hidden';
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, []);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-b from-[#06142e] to-[#0d3b8a] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed top-20 left-10 w-96 h-96 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 rounded-full bg-[#06142e]/40 blur-3xl -z-10"></div>
      
      {/* Header */}
      <header className="pt-6 pb-2 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/game')}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          
          <h1 className="text-2xl font-bold text-white/90">PONG</h1>
          
          <div className="w-20"></div> {/* Spacer for centering title */}
        </div>
      </header>
      
      {/* Game container - optimized for fullscreen experience */}
      <main className="flex-1 flex items-center justify-center pb-4">
        <PongGame className="max-h-[90vh]" />
      </main>
      
      {/* Minimal footer */}
      <footer className="py-2 px-4 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Transcendence
      </footer>
    </div>
  );
};

export default LocalGamePage; 