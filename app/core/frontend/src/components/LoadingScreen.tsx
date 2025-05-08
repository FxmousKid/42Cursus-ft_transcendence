import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Loading...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we prepare everything for you</p>
      </div>
    </div>
  );
}; 