import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, GamepadIcon, User, Menu, LogOut } from 'lucide-react';
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
import { cn } from "@/lib/utils";

const navItems = [
  { 
    name: 'Home', 
    path: '/', 
    icon: <Home className="w-5 h-5" />,
    description: 'Return to the main page'
  },
  { 
    name: 'Play', 
    path: '/game', 
    icon: <GamepadIcon className="w-5 h-5" />,
    description: 'Play Pong game',
    requireAuth: true
  }
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { user, isAuthenticated, logout } = useAuth();

  // Detect if we're on a game page
  const isGamePage = location.pathname.includes('/game');

  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter(item => 
    !item.requireAuth || (item.requireAuth && isAuthenticated)
  );

  // Handle scroll effect with direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled
      setScrolled(currentScrollY > 10);
      
      // Determine scroll direction and visibility
      if (currentScrollY > lastScrollY.current + 20) {
        // Scrolling down - hide navbar
        setVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 10) {
        // Scrolling up or at top - show navbar
        setVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
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
        group flex items-center gap-2 px-4 py-2 rounded-md transition-all text-base 
        ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          ? 'bg-primary/15 text-primary font-medium'
          : 'hover:bg-primary/5 text-foreground/90 hover:text-primary'
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
    <header 
      className={cn(
        // Base styles
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
        // Visibility and transform based on scroll
        visible ? "translate-y-0" : "-translate-y-full",
        // Styles when scrolled vs at top
        scrolled ? "py-1" : "py-2"
      )}
    >
      <div className="mx-auto px-4" style={{ maxWidth: "1000px" }}>
        <div 
          className={cn(
            "rounded-md backdrop-blur-sm transition-all duration-300",
            // Use consistent background color for all pages
            scrolled
              ? "bg-background/70 border-b border-primary/10"
              : "bg-transparent border-transparent"
          )}
        >
          <div className="flex h-12 items-center justify-between px-4">
            {/* Logo and bubble */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent group-hover:animate-pulse" />
              <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PONG</span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center gap-3 mx-2">
              {filteredNavItems.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </nav>

            {/* Login/Profile Button */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-md h-9 px-3 hover:bg-primary/10"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline">{user.username}</span>
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-md h-9 px-3 hover:bg-primary/10 hover:text-primary"
                >
                  <User className="h-5 w-5 mr-2" />
                  <span className="text-sm">Sign In</span>
                </Button>
              </Link>
            )}

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-md p-0 w-9 h-9 ml-1"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-72"
              >
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PONG</span>
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
                        ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-primary/5 text-foreground/80 hover:text-primary'
                        }
                      `}
                    >
                      <span className="p-2 rounded-lg bg-background">
                        {item.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  ))}
                  
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-4 p-3 rounded-lg justify-start mt-auto text-red-500 hover:text-red-600 hover:bg-red-100/10"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                    >
                      <span className="p-2 rounded-lg bg-background">
                        <LogOut className="w-5 h-5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">Logout</span>
                        <span className="text-xs text-muted-foreground">
                          Sign out from your account
                        </span>
                      </div>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
