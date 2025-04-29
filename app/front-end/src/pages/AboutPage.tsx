
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background blobs */}
      <div className="blob blob-primary w-64 h-64 top-20 left-10 -z-10"></div>
      <div className="blob blob-secondary w-72 h-72 bottom-20 right-10 -z-10"></div>
      
      {/* Header */}
      <header className="py-4 px-6 bg-card/40 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 
            onClick={() => navigate('/')} 
            className="text-2xl font-bold elegant-text-primary cursor-pointer"
          >
            PONG ARCADE
          </h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/game')}
              className="border-secondary text-secondary hover:bg-secondary/10"
            >
              Play Game
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="border-primary text-primary hover:bg-primary/10"
            >
              Home
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center">
            <span className="elegant-text-primary">About </span>
            <span className="elegant-text-secondary">Pong</span>
          </h1>
          
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-4 elegant-text-accent">The History of Pong</h2>
            <div className="elegant-card">
              <p className="text-muted-foreground mb-4">
                Released in 1972 by Atari, Pong is one of the earliest arcade video games and the very first sports arcade game. It simulates table tennis (ping pong), featuring simple 2D graphics.
              </p>
              <p className="text-muted-foreground mb-4">
                Created by Allan Alcorn as a training exercise assigned by Atari co-founder Nolan Bushnell, Pong became the first commercially successful video game and helped establish the video game industry.
              </p>
              <p className="text-muted-foreground">
                The game's commercial success led to the creation of numerous clones and variations, eventually leading to the birth of the home video game console market when Atari released a home version of Pong in 1975.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div>
              <h2 className="text-2xl font-bold mb-4 elegant-text-primary">Gameplay</h2>
              <div className="elegant-card h-full border-primary/20">
                <p className="text-muted-foreground mb-4">
                  Pong is a two-dimensional sports game that simulates table tennis. Players control an in-game paddle by moving it vertically across the left or right side of the screen.
                </p>
                <p className="text-muted-foreground">
                  The goal is to defeat an opponent by earning a higher score. Points are earned when one fails to return the ball to the other. The ball bounces off the paddles and walls, creating dynamic gameplay.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4 elegant-text-secondary">Legacy</h2>
              <div className="elegant-card h-full border-secondary/20">
                <p className="text-muted-foreground mb-4">
                  Pong has been referenced and remade in numerous games and media, and has become part of popular culture. The game's simple premise has made it ideal for introducing new players to video games.
                </p>
                <p className="text-muted-foreground">
                  In 2015, Pong was added to The Strong's World Video Game Hall of Fame, cementing its historical significance in the gaming industry.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 elegant-text-accent">Experience It Yourself</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our version of Pong recreates the classic gameplay with a modern elegant aesthetic. Try it now!
            </p>
            <Button 
              onClick={() => navigate('/game')} 
              className="elegant-button-primary text-lg"
              size="lg"
            >
              Play Pong
            </Button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-card py-8 px-4 border-t border-border">
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

export default AboutPage;
