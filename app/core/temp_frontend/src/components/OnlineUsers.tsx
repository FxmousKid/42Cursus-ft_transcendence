import { useState, useEffect } from 'react';
import { UserPlus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface OnlineUser {
  id: number;
  username: string;
  status: string;
  avatar_url: string | null;
}

export const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fonction pour charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Obtenir tous les utilisateurs
        const allUsersResponse = await api.user.getAllUsers();
        const onlineUsersResponse = await api.user.getOnlineUsers();
        
        if (allUsersResponse.data && onlineUsersResponse.data) {
          // Filtrer pour enlever l'utilisateur actuel
          const allUsersFiltered = allUsersResponse.data.filter(
            u => u.id !== user?.id
          );
          
          const onlineUsersFiltered = onlineUsersResponse.data.filter(
            u => u.id !== user?.id
          );
          
          const offlineUsersFiltered = allUsersFiltered.filter(
            u => !onlineUsersFiltered.some(online => online.id === u.id)
          );
          
          setOnlineUsers(onlineUsersFiltered);
          setOfflineUsers(offlineUsersFiltered);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Charger les utilisateurs initialement et toutes les 30 secondes
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    
    return () => clearInterval(interval);
  }, [user, toast]);

  // Fonction pour envoyer une demande d'ami
  const sendFriendRequest = async (friendId: number) => {
    if (!user) return;
    
    try {
      await api.friendship.sendRequest(friendId.toString());
      toast({
        title: 'Success',
        description: 'Friend request sent successfully',
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-[#0b2046]/80 border-[#0b2046] text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Users</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Online ({onlineUsers.length})
              </h3>
              <div className="space-y-2">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0056d3]/20 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-[#0056d3] flex items-center justify-center">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.username} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0b2046]"></div>
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-gray-300">{user.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:bg-[#0056d3]/30"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-[#0056d3]/30">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-2">No users online</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Offline ({offlineUsers.length})
              </h3>
              <div className="space-y-2">
                {offlineUsers.length > 0 ? (
                  offlineUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0056d3]/20 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-[#0056d3]/50 flex items-center justify-center text-white/70">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.username} 
                                className="h-10 w-10 rounded-full object-cover opacity-70"
                              />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-500 border-2 border-[#0b2046]"></div>
                        </div>
                        <div>
                          <p className="font-medium text-white/70">{user.username}</p>
                          <p className="text-xs text-gray-400">Offline</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:bg-[#0056d3]/30 text-white/50"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-[#0056d3]/30 text-white/50">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-2">No offline users</div>
                )}
                
                {offlineUsers.length > 5 && (
                  <div className="text-center text-sm text-gray-400 mt-2">
                    + {offlineUsers.length - 5} more offline users
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 