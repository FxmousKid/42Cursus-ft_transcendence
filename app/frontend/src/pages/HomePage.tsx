import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GamepadIcon, Trophy, Users, Zap, ArrowRight, Github, User } from "lucide-react";

const features = [
  {
    icon: <GamepadIcon className="h-6 w-6" />,
    title: "Real-time Gameplay",
    description: "Experience smooth and responsive Pong gameplay with modern controls"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Multiplayer Matches",
    description: "Challenge friends or random opponents in exciting matches"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Matchmaking",
    description: "Quick and efficient matchmaking system for seamless gaming"
  }
];

const contributors = [
  {
    name: "John Doe",
    role: "Frontend Developer",
    github: "johndoe",
    avatar: "J"
  },
  {
    name: "Jane Smith",
    role: "Backend Developer",
    github: "janesmith",
    avatar: "J"
  },
  {
    name: "Mike Johnson",
    role: "Game Developer",
    github: "mikejohnson",
    avatar: "M"
  },
  {
    name: "Sarah Wilson",
    role: "UI/UX Designer",
    github: "sarahwilson",
    avatar: "S"
  }
];

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-background" />
          <div className="blob blob-primary w-[800px] h-[800px] -top-[400px] -left-[400px]" />
          <div className="blob blob-secondary w-[600px] h-[600px] -bottom-[300px] -right-[300px]" />
          <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to{" "}
              <span className="elegant-text-primary">Pong</span>{" "}
              <span className="elegant-text-secondary">Transcendence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the classic game reimagined for the modern era.
              Challenge players, climb the ranks, and become a Pong master.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/game">
                <Button className="elegant-button-primary text-lg px-8 py-6 rounded-full group">
                  <GamepadIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Play Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="text-lg px-8 py-6 rounded-full border-primary text-primary hover:bg-primary/10">
                  <User className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Game <span className="elegant-text-primary">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="elegant-card group hover:scale-105 transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              About <span className="elegant-text-primary">The Project</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Pong Transcendence is a modern take on the classic Pong game, developed as part of the 42 school curriculum.
              Our team has reimagined this timeless game with contemporary features while maintaining its iconic gameplay.
            </p>
            
            <h3 className="text-2xl font-bold text-center mb-8">
              Meet <span className="elegant-text-secondary">The Team</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contributors.map((contributor, index) => (
                <div
                  key={contributor.name}
                  className="elegant-card group hover:scale-105 transition-all text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent p-1">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <span className="text-2xl font-bold elegant-text-primary">
                          {contributor.avatar}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold mb-1">{contributor.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{contributor.role}</p>
                  <a
                    href={`https://github.com/${contributor.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    @{contributor.github}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your <span className="elegant-text-primary">Journey</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of players already enjoying Pong Transcendence.
              Create your account now and start playing!
            </p>
            <Link to="/profile">
              <Button className="elegant-button-primary text-lg px-8 py-6 rounded-full group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/10 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
              <span className="text-xl font-bold elegant-text-primary">PONG TRANSCENDENCE</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pong Transcendence. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
