import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { api } from '@/services/api';
import type { UserProfileData } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { websocketService } from '../services/websocket.service';

// Import our components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileNavigation from '@/components/profile/ProfileNavigation';
import ProfileOverview from '@/components/profile/ProfileOverview';
import MatchHistory from '@/components/profile/MatchHistory';
import FriendsSection from '@/components/profile/FriendsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';

// Types
interface Friend {
  id: number;
  username: string;
  email: string;
}

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
}

const ProfilePage = () => {
  // Auth context
  const { user: authUser, logout } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const { toast } = useToast();

  // Fetching user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;
      
      setIsLoading(true);
      
      try {
        // Récupérer les données du profil de l'utilisateur
        const profileRes = await api.user.getProfile();
        
        if (profileRes.data) {
          // Si on a des données d'API, on les utilise
          setProfile(profileRes.data);
        } else if (profileRes.error) {
          // Gestion des erreurs d'authentification
          if (profileRes.error.includes('Invalid token') || profileRes.error.includes('unauthorized')) {
            // Si on n'a pas de données d'API, on utilise les données de l'authentification
            const userData: UserProfileData = {
              id: authUser.id as number,
              username: authUser.username,
              email: authUser.email,
              joinDate: new Date().toISOString(),
              totalGames: 0,
              winRate: 0,
              matches: []
            };
            
            setProfile(userData);
            
            toast({ title: "Erreur d'authentification", description: "Votre session a expiré. Certaines fonctionnalités du profil seront limitées.", variant: "destructive"});
          } else {
            toast({ title: "Erreur", description: "Impossible de charger les données du profil: " + profileRes.error, variant: "destructive" });
          }
        } else {
          // Si on n'a pas de données d'API, on utilise les données de l'authentification
          const userData: UserProfileData = {
            id: authUser.id as number,
            username: authUser.username,
            email: authUser.email,
            joinDate: new Date().toISOString(),
            totalGames: 0,
            winRate: 0,
            matches: []
          };
          
          // Try to get match data
          try {
            const matchesRes = await api.user.getMatches();
            if (matchesRes.data && matchesRes.data.length > 0) {
              userData.matches = matchesRes.data;
              userData.totalGames = matchesRes.data.length;
              
              // Calculate win rate
              const wins = matchesRes.data.filter(match => match.result === 'Win').length;
              userData.winRate = userData.totalGames > 0 
                ? Math.round((wins / userData.totalGames) * 100) 
                : 0;
            }
          } catch (error) {
            console.log("Error fetching matches:", error);
            // Fallback to example match data if endpoint doesn't exist
            userData.matches = [
              { 
                opponent: "Joueur", 
                result: "Win", 
                score: "10-5", 
                date: new Date().toLocaleDateString() 
              }
            ];
            userData.totalGames = 1;
            userData.winRate = 100;
          }
          
          setProfile(userData);
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive"
        });
        
        // Si on n'a pas de données d'API, on utilise les données de l'authentification
        if (authUser) {
          setProfile({
            id: authUser.id as number,
            username: authUser.username,
            email: authUser.email,
          });
        }
      } finally {
        setIsLoading(false);
      }
      
      fetchFriends();
      fetchPendingRequests();
    };

    fetchUserData();
  }, [authUser, toast]);

  useEffect(() => {
    if (authUser?.token) {
      websocketService.connect(authUser.token);

      // Écouteur pour les nouvelles demandes d'ami
      websocketService.on('friendRequest', (data) => {
        toast({
          title: "Nouvelle demande d'ami",
          description: `${data.from.username} vous a envoyé une demande d'ami`,
        });
        fetchPendingRequests();
      });

      // Écouteur pour les demandes d'ami acceptées
      websocketService.on('friendRequestAccepted', (data) => {
        toast({
          title: "Demande d'ami acceptée",
          description: `${data.friend.username} a accepté votre demande d'ami`,
        });
        fetchFriends();
      });

      return () => {
        websocketService.off('friendRequest', () => {});
        websocketService.off('friendRequestAccepted', () => {});
      };
    }
  }, [authUser?.token, toast]);

  // API calls for friendship management
  const fetchFriends = async () => {
    try {
      const res = await api.friendship.getFriends();
      if (res.data) {
        setFriends(res.data as Friend[]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.friendship.getPendingRequests();
      if (res.data) {
        setPendingRequests(res.data as FriendRequest[]);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleSendFriendRequest = async (username: string) => {
    if (!username.trim()) return;

    const res = await api.friendship.sendRequest(username);
    if (res.error) {
      toast({
        title: "Erreur",
        description: res.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: `Demande d'ami envoyée à ${username}`,
      });
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    const res = await api.friendship.acceptRequest(requestId);
    if (res.error) {
      toast({ title: "Erreur", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Demande d'ami acceptée" });
      fetchFriends();
      fetchPendingRequests();
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    const res = await api.friendship.rejectRequest(requestId);
    if (res.error) {
      toast({ title: "Erreur", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Demande d'ami rejetée" });
      fetchPendingRequests();
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    const res = await api.friendship.removeFriend(friendId);
    if (res.error) {
      toast({ title: "Erreur", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Ami supprimé" });
      fetchFriends();
    }
  };

  const handleSaveProfile = async (data: { username?: string; email?: string; password?: string }) => {
    try {
      const res = await api.user.updateProfile(data);
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Mettre à jour le profil avec les nouvelles données
      if (res.data) {
        setProfile(oldProfile => {
          if (!oldProfile) return res.data || null;
          return { ...oldProfile, ...res.data };
        });
      }
      
      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    // Implement logout functionality
    logout();
    console.log("Logout");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      try {
        // This will need to be implemented on the backend
        const res = await api.user.deleteAccount();
        
        if (res.error) {
          throw new Error(res.error);
        }
        
        toast({
          title: "Compte supprimé",
          description: "Votre compte a été supprimé avec succès",
        });
        
        // Logout the user after account deletion
        logout();
        
        // Redirect to homepage
        window.location.href = "/";
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du compte",
          variant: "destructive"
        });
      }
    }
  };

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-teal-500/30 animate-ping"></div>
            <div className="relative z-10 h-full w-full rounded-full border-4 border-t-transparent border-teal-500 animate-spin"></div>
          </div>
          <p className="text-white/70 text-lg font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Render active section content
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <ProfileOverview profile={profile} />;
      case 'matches':
        return <MatchHistory matches={profile.matches || []} />;
      case 'friends':
        return (
          <FriendsSection 
            friends={friends}
            pendingRequests={pendingRequests}
            onSendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
          />
        );
      case 'settings':
        return (
          <ProfileSettings 
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return <ProfileOverview profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-12">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl -z-10"></div>
      
      {/* Main content */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />
        
        {/* Navigation */}
        <div className="mt-6">
          <ProfileNavigation 
            activeSection={activeSection}
            pendingRequestsCount={pendingRequests.length}
            onChange={setActiveSection}
          />
        </div>
        
        {/* Content Section */}
        <div className="mt-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 