import { useState, useEffect } from 'react';
import { 
  Trophy, Settings, History, User, Edit, LogOut, 
  Calendar, Mail, UserPlus, X, Check, UserMinus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from '@/services/api';
import type { UserProfileData, MatchData } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';

// Define Friend and FriendRequest types locally
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

// Match component
const MatchResult = ({ match }: { match: MatchData }) => (
  <div className={`flex items-center justify-between rounded-lg border p-3 ${
    match.result === 'Win' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-900/20' 
    : 'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-900/20'
  }`}>
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${
        match.result === 'Win' 
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
      }`}>
        {match.result === 'Win' ? <Trophy className="h-5 w-5" /> : <History className="h-5 w-5" />}
      </div>
      <div>
        <p className="font-medium">vs {match.opponent}</p>
        <p className="text-sm text-muted-foreground">{match.score}</p>
      </div>
    </div>
    <div className="text-sm text-muted-foreground">{match.date}</div>
  </div>
);

const ProfilePage = () => {
  // Auth context
  const { user: authUser } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { toast } = useToast();

  // Fetching user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;
      
      setIsLoading(true);
      
      try {
        // Try to fetch from API first
        const profileRes = await api.user.getProfile();
        
        if (profileRes.data) {
          // If we have API data, use it
          setProfile(profileRes.data);
          setFormData({
            username: profileRes.data.username,
            email: profileRes.data.email,
            password: '',
          });
        } else {
          // Fallback to auth context data
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
          const matchesRes = await api.user.getMatches();
          if (matchesRes.data && matchesRes.data.length > 0) {
            userData.matches = matchesRes.data;
            userData.totalGames = matchesRes.data.length;
            
            // Calculate win rate
            const wins = matchesRes.data.filter(match => match.result === 'Win').length;
            userData.winRate = userData.totalGames > 0 
              ? Math.round((wins / userData.totalGames) * 100) 
              : 0;
          } else {
            // Example match for new users
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
          setFormData({
            username: userData.username,
            email: userData.email,
            password: '',
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive"
        });
        
        // Still set profile with auth data as fallback
        if (authUser) {
          setProfile({
            id: authUser.id as number,
            username: authUser.username,
            email: authUser.email,
          });
          
          setFormData({
            username: authUser.username,
            email: authUser.email,
            password: '',
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

  // API calls for friendship management
  const fetchFriends = async () => {
    const res = await api.friendship.getFriends();
    if (res.data) {
      setFriends(res.data as Friend[]);
    }
  };

  const fetchPendingRequests = async () => {
    const res = await api.friendship.getPendingRequests();
    if (res.data) {
      setPendingRequests(res.data as FriendRequest[]);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!newFriendUsername.trim()) return;

    const res = await api.friendship.sendRequest(newFriendUsername);
    if (res.error) {
      toast({
        title: "Erreur",
        description: res.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: `Demande d'ami envoyée à ${newFriendUsername}`,
      });
      setNewFriendUsername('');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    const res = await api.friendship.acceptRequest(requestId);
    if (res.error) {
      toast({
        title: "Erreur",
        description: res.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Demande d'ami acceptée",
      });
      fetchFriends();
      fetchPendingRequests();
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    const res = await api.friendship.rejectRequest(requestId);
    if (res.error) {
      toast({
        title: "Erreur",
        description: res.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Demande d'ami rejetée",
      });
      fetchPendingRequests();
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    const res = await api.friendship.removeFriend(friendId);
    if (res.error) {
      toast({
        title: "Erreur",
        description: res.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Ami supprimé",
      });
      fetchFriends();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.user.updateProfile({
        username: formData.username !== profile?.username ? formData.username : undefined,
        email: formData.email !== profile?.email ? formData.email : undefined,
        password: formData.password ? formData.password : undefined,
      });
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Update profile with new data
      if (res.data) {
        setProfile(oldProfile => {
          if (!oldProfile) return res.data || null;
          return { ...oldProfile, ...res.data };
        });
      }
      
      // Clear password field
      setFormData(prev => ({ ...prev, password: '' }));
      
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

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            {/* Avatar */}
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarFallback className="text-2xl">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-2">{profile.username}</h1>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </Badge>
                
                {profile.joinDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Inscrit depuis {new Date(profile.joinDate).toLocaleDateString()}
                  </Badge>
                )}
                
                {profile.totalGames !== undefined && profile.totalGames > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {profile.totalGames} {profile.totalGames > 1 ? 'parties' : 'partie'}
                  </Badge>
                )}
              </div>
              
              {profile.winRate !== undefined && profile.winRate > 0 && (
                <div className="w-full max-w-xs mx-auto sm:mx-0 mt-3">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Performances</span>
                    <span className="font-medium">{profile.winRate}%</span>
                  </div>
                  <Progress value={profile.winRate} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs Section */}
      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Matchs</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Amis</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        {/* Recent Matches */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Vos matchs récents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.matches && profile.matches.length > 0 ? (
                profile.matches.map((match, index) => (
                  <MatchResult key={index} match={match} />
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">
                  Vous n'avez pas encore joué de matchs
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends */}
        <TabsContent value="friends">
          <div className="grid gap-6">
            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle>Mes Amis</CardTitle>
                <CardDescription>
                  {friends.length > 0 
                    ? `Vous avez ${friends.length} ami${friends.length > 1 ? 's' : ''}`
                    : "Vous n'avez pas encore d'amis"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Friend */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Nom d'utilisateur"
                    value={newFriendUsername}
                    onChange={(e) => setNewFriendUsername(e.target.value)}
                  />
                  <Button onClick={handleSendFriendRequest}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                
                <Separator />
                
                {/* Friends List */}
                {friends.length === 0 ? (
                  <div className="text-center py-6">
                    <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Commencez à ajouter des amis</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.username}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Friend Requests */}
                {pendingRequests.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      Demandes d'ami
                      <Badge>{pendingRequests.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {request.sender.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.sender.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                              className="h-8 gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Accepter</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              className="h-8 gap-1 border-rose-200 bg-rose-100/50 text-rose-700 hover:bg-rose-200"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Rejeter</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du Profil</CardTitle>
              <CardDescription>Mettez à jour vos informations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button 
                  onClick={handleSaveProfile}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Enregistrer
                </Button>
                
                <Button 
                  variant="destructive"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage; 