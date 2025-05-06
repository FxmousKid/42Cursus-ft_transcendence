import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="simple-flex simple-flex-center simple-flex-col min-h-screen">
      <div className="text-center">
        <h1 className="text-9xl font-bold simple-text-primary">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page not found</h2>
        <p className="text-lg text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button
        onClick={() => navigate("/")}
        className="simple-btn"
      >
        <Home className="mr-2 h-5 w-5" />
        Return Home
      </Button>
    </div>
  );
}
