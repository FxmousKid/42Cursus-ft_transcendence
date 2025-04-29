
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="elegant-card text-center max-w-md">
          <h1 className="text-6xl font-bold mb-4 elegant-text-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
          <Button 
            onClick={() => navigate("/")}
            className="elegant-button-primary"
            size="lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
