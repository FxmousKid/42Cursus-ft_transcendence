
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center px-4 md:px-10 py-16 relative">
        <div className="blob blob-primary w-80 h-80 -left-20 top-0 -z-10"></div>
        <div className="blob blob-secondary w-96 h-96 -right-20 bottom-0 -z-10"></div>
        
        <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="elegant-text-primary">PONG</span>
            <span className="elegant-text-secondary"> ARCADE</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
            Experience the classic arcade game that started it all. Simple, addictive, and now with modern controls!
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center md:justify-start">
            <Button 
              onClick={() => navigate('/game')} 
              className="elegant-button-primary text-lg px-8"
              size="lg"
            >
              Play Now
            </Button>
            <Button 
              onClick={() => navigate('/about')} 
              variant="outline"
              className="text-lg border-primary/40 hover:bg-primary/10 hover:text-primary"
              size="lg"
            >
              Learn More
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 max-w-md md:max-w-xl animate-float">
          <div className="aspect-[4/3] bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden shadow-lg">
            <div className="w-full h-full relative">
              {/* Simplified pong visual */}
              <div className="absolute top-1/2 left-[10%] h-[30%] w-[3%] bg-primary rounded-md"></div>
              <div className="absolute top-[40%] left-[50%] h-6 w-6 bg-white rounded-full shadow-lg animate-pulse"></div>
              <div className="absolute top-[40%] right-[10%] h-[30%] w-[3%] bg-secondary rounded-md"></div>
              
              {/* Center line */}
              <div className="absolute left-1/2 top-0 h-full w-0.5 border-l border-dashed border-muted-foreground opacity-50"></div>
              
              {/* Scores */}
              <div className="absolute top-[10%] left-[30%] text-3xl font-mono font-bold text-primary">3</div>
              <div className="absolute top-[10%] right-[30%] text-3xl font-mono font-bold text-secondary">2</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="bg-card/5 backdrop-blur-sm py-16 px-4 border-t border-border/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center elegant-text-accent">Game Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border border-primary/20 shadow-lg transition-shadow duration-300 hover:shadow-primary/10">
              <h3 className="text-xl font-bold mb-3 elegant-text-primary">Classic Gameplay</h3>
              <p className="text-muted-foreground">Experience the timeless gameplay that revolutionized the gaming industry, now with modern visual enhancements.</p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border border-secondary/20 shadow-lg transition-shadow duration-300 hover:shadow-secondary/10">
              <h3 className="text-xl font-bold mb-3 elegant-text-secondary">Keyboard Controls</h3>
              <p className="text-muted-foreground">Player 1 uses W/S keys while Player 2 uses Arrow Up/Down for intuitive paddle control.</p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border border-accent/20 shadow-lg transition-shadow duration-300 hover:shadow-accent/10">
              <h3 className="text-xl font-bold mb-3 elegant-text-accent">Modern Design</h3>
              <p className="text-muted-foreground">Immerse yourself in a sleek, elegant interface that enhances the classic gameplay experience.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-card/5 border-t border-border/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 elegant-text-primary">Ready to Play?</h2>
          <p className="text-xl text-muted-foreground mb-10">Challenge your friend or beat your own high score!</p>
          <Button 
            onClick={() => navigate('/game')} 
            className="elegant-button-primary text-xl px-10"
            size="lg"
          >
            Start Playing Now
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card/10 backdrop-blur-sm py-8 px-4 border-t border-border/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <span className="text-xl font-bold elegant-text-primary">PONG ARCADE</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pong Arcade. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
