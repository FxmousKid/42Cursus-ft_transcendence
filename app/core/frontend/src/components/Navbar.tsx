import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HomeIcon, Gamepad2Icon, UserCircle2, Menu, LogOut } from 'lucide-react';
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
    icon: <HomeIcon className="w-6 h-6" />,
    description: 'Return to the main page'
  },
  { 
    name: 'Play', 
    path: '/game', 
    icon: <Gamepad2Icon className="w-6 h-6" />,
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
        group flex items-center gap-3 rounded-lg transition-all text-base font-medium
        ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          ? 'bg-primary text-background px-5 py-2.5 shadow-md'
          : 'hover:bg-primary/20 text-foreground hover:text-primary px-5 py-2.5'
        }
      `}
      onClick={() => setIsOpen(false)}
    >
      <span className="group-hover:scale-110 transition-transform">
        {item.icon}
      </span>
      <span className="text-lg">{item.name}</span>
    </Link>
  );

  return (
    <header 
      className={cn(
        // Base styles
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full flex justify-center",
        // Visibility and transform based on scroll
        visible ? "translate-y-0" : "-translate-y-full",
        // Styles when scrolled vs at top
        scrolled ? "py-2" : "py-3"
      )}
    >
      <div className="max-w-2xl w-auto px-4 mx-auto">
        <div 
          className={cn(
            "rounded-lg backdrop-blur-md transition-all duration-300 flex items-center",
            // Use consistent background color for all pages
            scrolled
              ? "bg-background/95 border-2 border-primary/20 shadow-lg"
              : "bg-background/85 border-2 border-primary/10"
          )}
        >
          <div className="flex h-16 items-center justify-between w-full px-4 gap-3">
            {/* Logo bubble with 42-transcendence text */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/80 absolute inset-0 logo-glow"></div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent relative z-10 logo-breathe">
                    <div className="logo-inner-light"></div>
                  </div>
                </div>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight hidden sm:inline">42-Transcendence</span>
              </Link>
            </div>

            {/* Desktop Navigation - Centered with bigger buttons */}
            <div className="flex items-center justify-center">
              <nav className="flex items-center justify-center">
                {filteredNavItems.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </nav>
            </div>

            {/* Login/Profile Button - bigger */}
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="rounded-lg h-12 w-12 p-0 hover:bg-primary/10 border border-primary/20"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={user.username} />
                        <AvatarFallback className="text-lg bg-primary/20 text-primary font-bold">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="text-base">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="py-2 text-base">
                      <UserCircle2 className="mr-3 h-5 w-5" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="py-2 text-base text-red-500 hover:text-red-600">
                      <LogOut className="mr-3 h-5 w-5" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="rounded-lg h-12 w-12 p-0 hover:bg-primary/10 hover:text-primary border border-primary/20"
                  >
                    <UserCircle2 className="h-8 w-8" />
                  </Button>
                </Link>
              )}

              {/* Mobile Navigation */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden ml-2">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="rounded-lg p-0 w-12 h-12 border border-primary/20"
                  >
                    <Menu className="h-8 w-8" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-72"
                >
                  <SheetHeader>
                    <SheetTitle>
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary/70 absolute inset-0 logo-glow"></div>
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent relative z-10 logo-breathe">
                            <div className="logo-inner-light"></div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight">42-transcendence</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-3 mt-6">
                    {filteredNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center gap-4 p-3 rounded-lg transition-all
                          ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                            ? 'bg-primary text-background'
                            : 'hover:bg-primary/10 text-foreground hover:text-primary'
                          }
                        `}
                      >
                        <span className="p-2 rounded-lg bg-background/20">
                          {item.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-lg">{item.name}</span>
                          <span className="text-sm opacity-90">
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
                        <span className="p-2 rounded-lg bg-background/20">
                          <LogOut className="w-6 h-6" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-lg">Logout</span>
                          <span className="text-sm opacity-90">
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
      </div>
    </header>
  );
}
