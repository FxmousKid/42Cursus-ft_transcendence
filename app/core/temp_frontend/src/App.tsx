import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import GameModePage from '@/pages/GameModePage';
import LocalGamePage from '@/pages/LocalGamePage';
import TournamentGamePage from '@/pages/TournamentGamePage';
import FriendsGamePage from '@/pages/FriendsGamePage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFound';
import LoginPage from '@/pages/Login';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

// Wrapper component to conditionally render navbar and padding
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col">
      {!isLoginPage && <Navbar />}
      <main 
        className={cn(
          "flex-1", // Add flex-1 to make main content take available space
          // Only add minimal top padding if we have a navbar (not login page)
          !isLoginPage ? "pt-12" : "",
          // Special handling for home page which already has spacing in its design
          isHomePage ? "pt-0" : ""
        )}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />

          {/* Protected routes - require authentication */}
          <Route path="/game" element={
            <ProtectedRoute requireAuth={true}>
              <GameModePage />
            </ProtectedRoute>
          } />
          <Route path="/game/local" element={
            <ProtectedRoute requireAuth={true}>
              <LocalGamePage />
            </ProtectedRoute>
          } />
          <Route path="/game/tournament" element={
            <ProtectedRoute requireAuth={true}>
              <TournamentGamePage />
            </ProtectedRoute>
          } />
          <Route path="/game/friends" element={
            <ProtectedRoute requireAuth={true}>
              <FriendsGamePage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute requireAuth={true}>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
