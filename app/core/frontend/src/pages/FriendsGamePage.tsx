import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, UserPlus, MessageSquare, RefreshCw, GamepadIcon, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, Friend } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';

// Extended Friend interface to include the properties we need
interface ExtendedFriend extends Friend {
  status: string;
  avatar_url: string | null;
}

const FriendsGamePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [friends, setFriends] = useState<ExtendedFriend[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<ExtendedFriend[]>([]);
  const [offlineFriends, setOfflineFriends] = useState<ExtendedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<ExtendedFriend | null>(null);
  
  // Charger les amis
  useEffect(() => {
    const loadFriends = async () => {
      try {
        setLoading(true);
        // Récupérer la liste des amis
        const friendsResponse = await api.friendship.getFriends();
        if (friendsResponse.data) {
          // Cast the response to our extended type
          const extendedFriends = friendsResponse.data as unknown as ExtendedFriend[];
          setFriends(extendedFriends);
          
          // Séparer les amis en ligne et hors ligne
          const online = extendedFriends.filter(friend => friend.status !== 'offline');
          const offline = extendedFriends.filter(friend => friend.status === 'offline');
          
          setOnlineFriends(online);
          setOfflineFriends(offline);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger votre liste d\'amis',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadFriends();
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(loadFriends, 30000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  const refreshFriendsList = async () => {
    setLoading(true);
    try {
      const friendsResponse = await api.friendship.getFriends();
      if (friendsResponse.data) {
        // Cast the response to our extended type
        const extendedFriends = friendsResponse.data as unknown as ExtendedFriend[];
        setFriends(extendedFriends);
        
        const online = extendedFriends.filter(friend => friend.status !== 'offline');
        const offline = extendedFriends.filter(friend => friend.status === 'offline');
        
        setOnlineFriends(online);
        setOfflineFriends(offline);
      }
    } catch (error) {
      console.error('Error refreshing friends:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFriendSelect = (friend: ExtendedFriend) => {
    setSelectedFriend(friend);
  };
  
  const sendGameInvitation = () => {
    if (!selectedFriend) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un ami pour jouer',
        variant: 'destructive',
      });
      return;
    }
    
    // TODO: Implémenter l'envoi d'invitation via le système de chat (à venir)
    toast({
      title: 'Invitation envoyée',
      description: `Une invitation a été envoyée à ${selectedFriend.username}`,
    });
    
    // Rediriger vers la page d'attente ou créer directement la salle
    navigate('/game/waiting-room');
  };
  
  const openChat = (friend: ExtendedFriend) => {
    // TODO: Implémenter l'ouverture du chat avec l'ami sélectionné
    toast({
      title: 'Chat',
      description: `Ouverture du chat avec ${friend.username}`,
    });
    
    // Rediriger vers la page de chat (une fois implémentée)
    // navigate(`/chat/${friend.id}`);
  };
  
  const createGameRoom = () => {
    navigate('/game/create-room');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10"></div>
      
      {/* Back button */}
      <div className="pt-6 pb-2 px-6">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/game')}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux modes de jeu
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto bg-[#0b2046]/60 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Jouer avec des amis</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Friends List */}
            <div className="lg:col-span-1">
              <Card className="bg-[#0b2046]/80 border-white/10 text-white shadow-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Mes Amis</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-[#0056d3]/30"
                    onClick={refreshFriendsList}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="text-center py-4">Chargement...</div>
                  ) : (
                    <Tabs defaultValue="online">
                      <TabsList className="bg-[#071835] w-full mb-4">
                        <TabsTrigger value="online" className="flex-1">
                          En ligne <Badge className="ml-2 bg-blue-500">{onlineFriends.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex-1">
                          Tous <Badge className="ml-2">{friends.length}</Badge>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="online" className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {onlineFriends.length > 0 ? (
                          onlineFriends.map(friend => (
                            <div 
                              key={friend.id} 
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                                selectedFriend?.id === friend.id 
                                  ? 'bg-[#0056d3]/50' 
                                  : 'hover:bg-[#0056d3]/20'
                              }`}
                              onClick={() => handleFriendSelect(friend)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="h-10 w-10 rounded-full bg-[#0056d3] flex items-center justify-center">
                                    {friend.avatar_url ? (
                                      <img 
                                        src={friend.avatar_url} 
                                        alt={friend.username} 
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      friend.username.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0b2046]"></div>
                                </div>
                                <div>
                                  <p className="font-medium">{friend.username}</p>
                                  <p className="text-xs text-gray-300">
                                    {friend.status === 'in-game' ? 'En partie' : 'En ligne'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="hover:bg-[#0056d3]/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openChat(friend);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400 py-8">
                            Aucun ami en ligne actuellement
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="all" className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {/* Amis en ligne */}
                        {onlineFriends.length > 0 && (
                          <>
                            <h3 className="text-sm font-medium text-gray-300">En ligne</h3>
                            <div className="space-y-2 mb-4">
                              {onlineFriends.map(friend => (
                                <div 
                                  key={friend.id} 
                                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                                    selectedFriend?.id === friend.id 
                                      ? 'bg-[#0056d3]/50' 
                                      : 'hover:bg-[#0056d3]/20'
                                  }`}
                                  onClick={() => handleFriendSelect(friend)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="h-10 w-10 rounded-full bg-[#0056d3] flex items-center justify-center">
                                        {friend.avatar_url ? (
                                          <img 
                                            src={friend.avatar_url} 
                                            alt={friend.username} 
                                            className="h-10 w-10 rounded-full object-cover"
                                          />
                                        ) : (
                                          friend.username.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0b2046]"></div>
                                    </div>
                                    <div>
                                      <p className="font-medium">{friend.username}</p>
                                      <p className="text-xs text-gray-300">
                                        {friend.status === 'in-game' ? 'En partie' : 'En ligne'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="hover:bg-[#0056d3]/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openChat(friend);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <Separator className="bg-gray-700/50" />
                          </>
                        )}
                        
                        {/* Amis hors ligne */}
                        {offlineFriends.length > 0 && (
                          <>
                            <h3 className="text-sm font-medium text-gray-300 mt-2">Hors ligne</h3>
                            <div className="space-y-2">
                              {offlineFriends.map(friend => (
                                <div 
                                  key={friend.id} 
                                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                                    selectedFriend?.id === friend.id 
                                      ? 'bg-[#0056d3]/50' 
                                      : 'hover:bg-[#0056d3]/20'
                                  }`}
                                  onClick={() => handleFriendSelect(friend)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="h-10 w-10 rounded-full bg-[#0056d3]/50 flex items-center justify-center text-white/70">
                                        {friend.avatar_url ? (
                                          <img 
                                            src={friend.avatar_url} 
                                            alt={friend.username} 
                                            className="h-10 w-10 rounded-full object-cover opacity-70"
                                          />
                                        ) : (
                                          friend.username.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-500 border-2 border-[#0b2046]"></div>
                                    </div>
                                    <div>
                                      <p className="font-medium text-white/70">{friend.username}</p>
                                      <p className="text-xs text-gray-400">Hors ligne</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="hover:bg-[#0056d3]/30 text-white/50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openChat(friend);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        {friends.length === 0 && (
                          <div className="text-center text-gray-400 py-8">
                            Aucun ami pour le moment
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Game Options */}
            <div className="lg:col-span-2">
              <Card className="bg-[#0b2046]/80 border-white/10 backdrop-blur-sm p-6 h-full flex flex-col">
                {selectedFriend ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="p-6 rounded-full bg-[#0056d3]/20 mb-6">
                      <div className="h-16 w-16 rounded-full bg-[#0056d3] flex items-center justify-center">
                        {selectedFriend.avatar_url ? (
                          <img 
                            src={selectedFriend.avatar_url} 
                            alt={selectedFriend.username} 
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          selectedFriend.username.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-2">{selectedFriend.username}</h2>
                    <p className="text-gray-300 mb-6">
                      {selectedFriend.status === 'online' 
                        ? 'En ligne - Prêt à jouer' 
                        : selectedFriend.status === 'in-game' 
                          ? 'Actuellement en partie' 
                          : 'Hors ligne'}
                    </p>
                    
                    <div className="grid gap-4 w-full max-w-md">
                      <Button 
                        className="bg-[#0056d3] hover:bg-[#0048b3] gap-2"
                        onClick={sendGameInvitation}
                        disabled={selectedFriend.status === 'offline'}
                      >
                        <GamepadIcon className="h-4 w-4" /> Inviter à jouer
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-white/20 hover:bg-white/10 gap-2"
                        onClick={() => openChat(selectedFriend)}
                      >
                        <MessageSquare className="h-4 w-4" /> Envoyer un message
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-gray-300 hover:bg-white/10"
                        onClick={() => setSelectedFriend(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="p-6 rounded-full bg-[#0056d3]/20 mb-6">
                      <Users className="h-16 w-16 text-[#0056d3]" />
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-3">Options de jeu</h2>
                    <p className="text-gray-300 max-w-md mb-8">
                      Défiez vos amis à une partie de Pong ! Sélectionnez un ami dans la liste pour l'inviter directement.
                    </p>
                    
                    <div className="space-y-6 w-full max-w-md">
                      <div className="bg-[#071835] rounded-lg p-6">
                        <h3 className="font-medium text-lg mb-4">Inviter un ami</h3>
                        <p className="text-sm text-gray-300 mb-4">
                          Sélectionnez un ami dans la liste pour l'inviter à jouer. L'invitation sera envoyée via le système de messagerie.
                        </p>
                        <div className="flex justify-center">
                          <Badge className="bg-blue-500 px-3 py-1 text-xs">
                            {onlineFriends.length} ami{onlineFriends.length !== 1 ? 's' : ''} en ligne
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-[#071835] rounded-lg p-6">
                        <h3 className="font-medium text-lg mb-4">Créer une partie</h3>
                        <p className="text-sm text-gray-300 mb-4">
                          Vous pouvez également créer une salle de jeu et inviter plusieurs amis pour un tournoi.
                        </p>
                        <Button 
                          className="w-full bg-[#0056d3] hover:bg-[#0048b3] gap-2"
                          onClick={createGameRoom}
                        >
                          <GamepadIcon className="h-4 w-4" /> Créer une salle de jeu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#0b2046]/80 backdrop-blur-sm py-6 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-sm text-gray-300">© {new Date().getFullYear()} Transcendence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default FriendsGamePage; 