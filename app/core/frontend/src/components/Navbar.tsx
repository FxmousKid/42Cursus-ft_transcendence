import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, GamepadIcon, User, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import '../styles/dropdown.css';
import '../styles/navbar.css';

const navItems = [
  { 
    name: 'Home', 
    path: '/', 
    icon: <Home className="nav-icon" />,
  },
  { 
    name: 'Play', 
    path: '/game', 
    icon: <GamepadIcon className="nav-icon" />,
  },
  { 
    name: 'Profile', 
    path: '/profile', 
    icon: <User className="nav-icon" />,
  }
];

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`simple-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="simple-container">
        <div className="simple-flex-between">
          {/* Logo */}
          <Link to="/" className="simple-navbar-brand">
            <div className="simple-logo">
              <span>42</span>
            </div>
            <span className="simple-logo-text">TRANSCENDENCE</span>
          </Link>

          {/* Main Navigation */}
          <nav className="simple-nav">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`simple-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User section */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="simple-button simple-button-ghost">
                  <User className="button-icon" />
                  <span>{user.username}</span>
                  <ChevronDown className="button-icon" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="dropdown-link">
                    <User className="dropdown-icon" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="destructive"
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="dropdown-icon" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <button className="simple-button">
                <User className="button-icon" />
                <span>Sign In</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
