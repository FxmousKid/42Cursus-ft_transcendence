import { useState, useEffect } from 'react';
import { friendshipService } from '@/services/friendship.service';
import { userService, User } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, CircleUserRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function AddFriendSection() {
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Récupérer l'ID de l'utilisateur connecté depuis le localStorage
  const userId = Number(localStorage.getItem('userId'));

  // Load online users on component mount
  useEffect(() => {
    loadOnlineUsers();
  }, []);

  const loadOnlineUsers = async () => {
    setIsLoading(true);
    try {
      const users = await userService.getAllUsers();
      // Filter out current user
      const filteredUsers = users.filter(user => user.id !== userId);
      setOnlineUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load online users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs en ligne",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSearching(true);
    try {
      const allUsers = await userService.getAllUsers();
      const results = allUsers.filter(user => 
        user.username.toLowerCase().includes(username.toLowerCase()) && 
        user.id !== userId
      );
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rechercher des utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await friendshipService.sendFriendRequest(userId, friendId);
      toast({
        title: "Succès",
        description: "Demande d'ami envoyée"
      });
      // Réinitialiser la recherche
      setUsername('');
      setSearchResults([]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande d'ami",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'in-game':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Ajouter des amis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSearching}
                className="pl-8"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Recherche..." : "Rechercher"}
            </Button>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Résultats</h3>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                        ) : (
                          <CircleUserRound className="h-6 w-6" />
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-background`}></div>
                    </div>
                    <div>
                      <span>{user.username}</span>
                      <Badge variant={user.status === 'online' ? 'secondary' : 'outline'} className="ml-2">
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddFriend(user.id)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Utilisateurs en ligne */}
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              Utilisateurs ({onlineUsers.length})
            </h3>
            {isLoading ? (
              <div className="text-center py-2">Chargement des utilisateurs...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                          ) : (
                            <CircleUserRound className="h-6 w-6" />
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-background`}></div>
                      </div>
                      <div>
                        <span>{user.username}</span>
                        <Badge variant={user.status === 'online' ? 'secondary' : 'outline'} className="ml-2">
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddFriend(user.id)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <div className="text-center col-span-2 py-4 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 