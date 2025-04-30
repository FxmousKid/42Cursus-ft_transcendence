import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Trophy, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const TournamentGamePage = () => {
  const navigate = useNavigate();
  
  const sampleTournaments = [
    {
      id: 1,
      name: "Weekly Championship",
      players: 8,
      status: "Registration Open",
      startTime: "In 2 hours",
      icon: <Clock className="h-5 w-5 text-amber-500" />
    },
    {
      id: 2,
      name: "Pro League Season 5",
      players: 16,
      status: "In Progress",
      startTime: "Active Now",
      icon: <Trophy className="h-5 w-5 text-emerald-500" />
    },
    {
      id: 3,
      name: "Beginner's Tournament",
      players: 4,
      status: "Needs Players",
      startTime: "Tomorrow",
      icon: <UserPlus className="h-5 w-5 text-blue-500" />
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10"></div>
      
      {/* Header */}
      <header className="py-4 px-6 bg-[#0b2046]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            TOURNAMENTS
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
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Available Tournaments</h2>
          <Button className="bg-[#0056d3] hover:bg-[#0048b3] text-white gap-2">
            <Plus className="h-4 w-4" /> Create Tournament
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleTournaments.map((tournament) => (
            <Card key={tournament.id} className="bg-[#0b2046]/80 border-white/10 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-white">{tournament.name}</CardTitle>
                    <CardDescription className="text-gray-300">{tournament.status}</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-[#0056d3]/20">
                    {tournament.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-300">Players:</span>
                  <span className="font-medium">{tournament.players}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Starts:</span>
                  <span className="font-medium">{tournament.startTime}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-[#0056d3] to-[#0077e6]">
                  Join Tournament
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {/* Create new tournament card */}
          <Card className="bg-[#0b2046]/60 border-dashed border-white/20 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-[#0b2046]/80 transition-colors">
            <Plus className="h-12 w-12 text-[#0056d3] mb-4" />
            <h3 className="text-xl font-medium mb-2">Create Tournament</h3>
            <p className="text-gray-300 text-center">Set up your own tournament with custom rules</p>
          </Card>
        </div>
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

export default TournamentGamePage; 