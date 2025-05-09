import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, GamepadIcon, User, Menu, X, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    description: 'Play Pong game',
    requireAuth: true
  }
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter(item => 
    !item.requireAuth || (item.requireAuth && isAuthenticated)
  );

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      to={item.path}
      className={`
        group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm
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
    <header className={`
      absolute top-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-3xl transition-all duration-300
      ${scrolled ? 'scale-95 opacity-90 hover:opacity-100' : 'scale-100 opacity-100'}
    `}>
      <div className="rounded-full backdrop-blur-sm border border-primary/20 bg-background/70 shadow-md">
        <div className="flex h-12 items-center justify-between px-4">
          {/* Logo and bubble */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent group-hover:animate-pulse" />
            <span className="text-sm font-bold elegant-text-primary">PONG</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center gap-1 mx-2">
            {filteredNavItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>

          {/* Login/Profile Button */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-8 px-2 hover:bg-primary/10">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs hidden sm:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 hover:bg-primary/10 hover:text-primary">
                <User className="h-4 w-4 mr-1" />
                <span className="text-xs">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="rounded-full p-0 w-8 h-8 ml-1">
                <Menu className="h-4 w-4 transition-transform" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
                    <span className="elegant-text-primary">PONG</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-4 p-3 rounded-lg transition-all
                      ${location.pathname === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground/80 hover:text-primary'
                      }
                    `}
                  >
                    <span className="p-2 rounded-lg bg-background">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </Link>
                ))}
                
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-4 p-3 rounded-lg justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10 mt-auto"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                  >
                    <span className="p-2 rounded-lg bg-background"><LogOut className="w-4 h-4" /></span>
                    <div className="flex flex-col">
                      <span className="font-medium">Logout</span>
                      <span className="text-xs text-muted-foreground">Sign out from your account</span>
                    </div>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
