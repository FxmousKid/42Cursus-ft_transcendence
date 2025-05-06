import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import GameModePage from '@/pages/GameModePage';
import LocalGamePage from '@/pages/LocalGamePage';
import TournamentGamePage from '@/pages/TournamentGamePage';
import FriendsGamePage from '@/pages/FriendsGamePage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFound';
import LoginPage from '@/pages/Login';
import { Toaster } from '@/components/ui/toaster';

// Wrapper component to conditionally render navbar and padding
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {!isLoginPage && <Navbar />}
      <main className={!isLoginPage ? "pt-20" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GameModePage />} />
          <Route path="/game/local" element={<LocalGamePage />} />
          <Route path="/game/tournament" element={<TournamentGamePage />} />
          <Route path="/game/friends" element={<FriendsGamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
