import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import GamePage from '@/pages/GamePage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFound';
import LoginPage from '@/pages/Login';

// Wrapper component to conditionally render navbar and padding
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {!isLoginPage && <Navbar />}
      <main className={!isLoginPage ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
