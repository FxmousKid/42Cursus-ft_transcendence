import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "You have been signed out",
        variant: "default",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-md mx-auto">
        <div className="bg-card shadow-lg rounded-lg p-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-primary">
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{user?.username || 'User'}</h1>
            <p className="text-muted-foreground mt-2">{user?.email || 'No email provided'}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-muted/50 rounded-md">
              <User className="h-5 w-5 mr-4 text-primary" />
              <div>
                <h3 className="font-medium">User ID</h3>
                <p className="text-sm text-muted-foreground">{user?.id || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 