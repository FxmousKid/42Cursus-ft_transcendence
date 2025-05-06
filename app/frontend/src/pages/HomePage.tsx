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
      <section className="simple-hero">
        <div className="simple-container">
          <h1 className="simple-hero-title">
            Welcome to{" "}
            <span className="simple-text-primary">Pong</span>{" "}
            <span className="simple-text-primary">Transcendence</span>
          </h1>
          <p className="simple-hero-description">
            Experience the classic game reimagined for the modern era.
            Challenge players, climb the ranks, and become a Pong master.
          </p>
          <div className="simple-hero-actions">
            <Link to="/game">
              <Button className="simple-btn simple-btn-lg">
                <GamepadIcon className="mr-2 h-5 w-5" />
                Play Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="simple-btn-outline simple-btn-lg">
                <User className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="simple-feature-section bg-card-30">
        <div className="simple-container">
          <h2 className="simple-feature-section-title">
            Game <span className="simple-text-primary">Features</span>
          </h2>
          <div className="simple-grid simple-grid-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="simple-feature-card hover:shadow-md transition-all"
              >
                <div className="simple-feature-icon">
                  {feature.icon}
                </div>
                <h3 className="simple-feature-title">{feature.title}</h3>
                <p className="simple-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="simple-feature-section">
        <div className="simple-container">
          <h2 className="simple-feature-section-title">
            About <span className="simple-text-primary">The Project</span>
          </h2>
          <p className="simple-hero-description">
            Pong Transcendence is a modern take on the classic Pong game, developed as part of the 42 school curriculum.
            Our team has reimagined this timeless game with contemporary features while maintaining its iconic gameplay.
          </p>
          
          <h3 className="simple-text-center text-2xl font-bold mb-8">
            Meet <span className="simple-text-primary">The Team</span>
          </h3>
          <div className="simple-grid simple-grid-4">
            {contributors.map((contributor) => (
              <div key={contributor.name} className="simple-card text-center hover:shadow-md transition-all">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary-20 flex items-center justify-center">
                    <span className="text-2xl font-bold simple-text-primary">
                      {contributor.avatar}
                    </span>
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
      </section>

      {/* Call to Action */}
      <section className="simple-feature-section">
        <div className="simple-container">
          <div className="simple-text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Start Your <span className="simple-text-primary">Journey</span>?
            </h2>
            <p className="simple-hero-description">
              Join thousands of players already enjoying Pong Transcendence.
              Create your account now and start playing!
            </p>
            <Link to="/profile">
              <Button className="simple-btn simple-btn-lg mt-6">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border-10 bg-card-30">
        <div className="simple-container">
          <div className="simple-flex simple-flex-between">
            <div className="simple-flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-xl font-bold simple-text-primary">PONG TRANSCENDENCE</span>
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
