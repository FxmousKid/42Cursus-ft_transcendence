import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  GamepadIcon,
  Users, 
  Zap, 
  ArrowRight, 
  Github, 
  User,
  MessageSquare,
  Trophy
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const features = [
  {
    icon: <GamepadIcon className="h-10 w-10" />,
    title: "Real-time Gameplay",
    description: "Experience smooth and responsive Pong gameplay with modern controls"
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: "Multiplayer Matches",
    description: "Challenge friends or random opponents in exciting matches"
  },
  {
    icon: <Zap className="h-10 w-10" />,
    title: "Instant Matchmaking",
    description: "Quick and efficient matchmaking system for seamless gaming"
  },
  {
    icon: <MessageSquare className="h-10 w-10" />,
    title: "Live Chat",
    description: "Chat with other players and friends while enjoying the game"
  }
];

const contributors = [ { username: "jcoh3n" }, { username: "FxmousKid" }, { username: "MonkePlusPlus" }, { username: "wanderfulife" }, { username: "g-garibotti" } ];


const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Full screen with dramatic background */}
      <section className="min-h-[70vh] flex items-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
          {/* Large glowing orbs */}
          <div className="absolute opacity-20 blur-3xl -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full bg-primary/40 animate-pulse-slow" />
          <div className="absolute opacity-20 blur-3xl -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-secondary/40 animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto px-6 pt-0 pb-12">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground tracking-tight leading-tight">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                ft_transcendence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Experience the classic game reimagined for the modern era.
              Challenge players, climb the ranks, and become a Pong master.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-6">
              <Link to="/game">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white text-lg h-16 px-10">
                  <GamepadIcon className="mr-3 h-6 w-6" />
                  Play Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-full border-primary/20 hover:bg-primary/5 text-lg h-16 px-10">
                  <User className="mr-3 h-6 w-6" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Eye-catching display */}
      <section className="py-16 bg-card/5 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">The Team</span>
            </h2>
            
            <div className="flex flex-wrap justify-center gap-12">
              {contributors.map((contributor, index) => (
                <div 
                  key={contributor.username}
                  className="group"
                >
                  <a
                    href={`https://github.com/${contributor.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-6 transition-all duration-300 group-hover:transform group-hover:translate-y-[-8px]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-md opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <Avatar className="w-32 h-32 border-4 border-background/80 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 relative">
                        <AvatarImage 
                          src={`https://github.com/${contributor.username}.png`} 
                          alt={contributor.username}
                          className="scale-110"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                          {contributor.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-card px-4 py-1 rounded-full border border-border/50 shadow-md">
                        <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                          <Github className="h-3.5 w-3.5" />
                          <span>@{contributor.username}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Large, impactful cards */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">
            Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="bg-card/50 backdrop-blur-sm border-border/20 hover:shadow-xl transition-all hover:-translate-y-2 duration-300 overflow-hidden group h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Bold, attention-grabbing */}
      <section className="py-28 bg-card/5 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute opacity-10 blur-3xl top-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary/30" />
          <div className="absolute opacity-10 blur-3xl bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/30" />
        </div>
        
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Journey</span>?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12">
              Join thousands of players already enjoying Pong Transcendence.
              Create your account now and start playing!
            </p>
            <Link to="/profile">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white group text-lg h-16 px-10">
                Get Started
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
