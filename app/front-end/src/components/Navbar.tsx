import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, GamepadIcon, User, Menu, X, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { 
    name: 'Home', 
    path: '/', 
    icon: <Home className="w-4 h-4" />,
    description: 'Return to the main page'
  },
  { 
    name: 'Play', 
    path: '/game', 
    icon: <GamepadIcon className="w-4 h-4" />,
    description: 'Play Pong game'
  },
  { 
    name: 'Profile', 
    path: '/profile', 
    icon: <User className="w-4 h-4" />,
    description: 'View your profile'
  }
];

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      to={item.path}
      className={`
        group flex items-center gap-2 px-4 py-2 rounded-full transition-all
        ${location.pathname === item.path 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-primary/5 text-foreground/80 hover:text-primary'
        }
      `}
      onClick={() => setIsOpen(false)}
    >
      <span className="group-hover:scale-110 transition-transform">
        {item.icon}
      </span>
      <span>{item.name}</span>
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent group-hover:animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xl font-bold elegant-text-primary">PONG</span>
              <span className="text-xs text-muted-foreground">TRANSCENDENCE</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-1">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>

          {/* Login/Profile Button */}
          <Link to="/login" className="ml-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </Link>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden ml-4">
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-5 w-5 transition-transform" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
                    <span className="elegant-text-primary">PONG TRANSCENDENCE</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg transition-all
                      ${location.pathname === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground/80 hover:text-primary'
                      }
                    `}
                  >
                    <span className="p-2 rounded-lg bg-background">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
