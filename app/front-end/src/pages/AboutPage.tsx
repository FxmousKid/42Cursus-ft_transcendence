import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background blobs */}
      <div className="blob blob-primary w-64 h-64 top-20 left-10 -z-10"></div>
      <div className="blob blob-secondary w-72 h-72 bottom-20 right-10 -z-10"></div>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 elegant-text-primary">About Pong Arcade</h1>
          <div className="elegant-card mb-10">
            <p className="text-lg mb-4">
              Pong Arcade is a modern reimagining of the classic arcade game Pong. 
              It features multiple game modes, online multiplayer, and a competitive ranking system.
            </p>
            <p className="text-lg">
              This project was created as part of the 42 school curriculum, focusing on web 
              development with modern technologies and best practices.
            </p>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 elegant-text-secondary">Game Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="elegant-card">
              <h3 className="text-xl font-bold mb-2">Local Multiplayer</h3>
              <p>Challenge a friend on the same device for classic head-to-head competition.</p>
            </div>
            <div className="elegant-card">
              <h3 className="text-xl font-bold mb-2">Online Matches</h3>
              <p>Compete against players from around the world and climb the global leaderboard.</p>
            </div>
            <div className="elegant-card">
              <h3 className="text-xl font-bold mb-2">Tournaments</h3>
              <p>Join scheduled tournaments with brackets and prizes for the winners.</p>
            </div>
            <div className="elegant-card">
              <h3 className="text-xl font-bold mb-2">Custom Games</h3>
              <p>Create games with custom rules, paddle sizes, ball speeds, and more.</p>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => navigate('/game')}
              className="elegant-button-primary text-lg px-8 py-6 rounded-full"
            >
              Play Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
