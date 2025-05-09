import { useEffect, useState } from 'react';
import { friendshipService, Friend, PendingRequest } from '@/services/friendship.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Récupérer l'ID de l'utilisateur connecté depuis le localStorage
  const currentUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    loadFriendsAndRequests();
  }, []);

  const loadFriendsAndRequests = async () => {
    try {
      setIsLoading(true);
      const [friendsData, pendingData] = await Promise.all([
        friendshipService.getFriends(currentUserId),
        friendshipService.getPendingRequests(currentUserId)
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste d'amis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendshipService.acceptFriendRequest(currentUserId, requestId);
      await loadFriendsAndRequests();
      toast({
        title: "Succès",
        description: "Demande d'ami acceptée"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la demande",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await friendshipService.rejectFriendRequest(currentUserId, requestId);
      await loadFriendsAndRequests();
      toast({
        title: "Succès",
        description: "Demande d'ami rejetée"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await friendshipService.removeFriend(currentUserId, friendId);
      await loadFriendsAndRequests();
      toast({
        title: "Succès",
        description: "Ami supprimé"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ami",
        variant: "destructive"
      });
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Amis</span>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : (
          <>
            {/* Demandes d'amis en attente */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Demandes en attente</h3>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {request.user.username[0].toUpperCase()}
                        </div>
                        <span>{request.user.username}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAcceptRequest(request.user.id)}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectRequest(request.user.id)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste d'amis */}
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {friend.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span>{friend.username}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {friend.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFriend(friend.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {filteredFriends.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun ami trouvé
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 