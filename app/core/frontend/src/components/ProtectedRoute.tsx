import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  requireAuth: boolean;
}

/**
 * ProtectedRoute component that handles routing based on authentication status
 * @param requireAuth - If true, user must be logged in to access the route; if false, user must be logged out
 * @param children - The components to render if authentication requirements are met
 */
export const ProtectedRoute = ({ children, requireAuth }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Route requires authentication but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Route requires user to be logged out (like login page) but user is already authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect to home page or a default authenticated route
    return <Navigate to="/" replace />;
  }

  // If authentication requirements are met, render the children
  return children;
}; 