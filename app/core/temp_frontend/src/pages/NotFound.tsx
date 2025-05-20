import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-9xl font-bold tracking-tighter text-primary">404</h1>
        <h2 className="text-3xl font-semibold tracking-tight">Page not found</h2>
        <p className="text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button
        onClick={() => navigate("/")}
        size="lg"
        className="gap-2"
      >
        <Home className="h-5 w-5" />
        Return Home
      </Button>
    </div>
  );
}
