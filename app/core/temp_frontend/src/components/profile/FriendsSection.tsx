import { useState } from 'react';
import { UserPlus, Check, X, UserMinus, MessageCircle, Users, Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Types definitions
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

interface FriendsSectionProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onSendRequest: (username: string) => void;
  onAcceptRequest: (requestId: number) => void;
  onRejectRequest: (requestId: number) => void;
  onRemoveFriend: (friendId: number) => void;
}

const FriendsSection = ({
  friends,
  pendingRequests,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend
}: FriendsSectionProps) => {
  const [newFriendUsername, setNewFriendUsername] = useState('');

  const handleSendRequest = () => {
    if (newFriendUsername.trim()) {
      onSendRequest(newFriendUsername);
      setNewFriendUsername('');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Communauté</h2>
        <p className="text-white/50">Retrouvez vos amis et jouez ensemble</p>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Add Friend Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <h3 className="flex items-center text-lg font-medium">
                <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                Ajouter un ami
              </h3>
            </div>
            
            <div className="p-5">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Rechercher un joueur"
                    value={newFriendUsername}
                    onChange={(e) => setNewFriendUsername(e.target.value)}
                    className="bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/30" />
                </div>
                
                <Button 
                  onClick={handleSendRequest} 
                  className="w-full bg-gradient-to-r from-blue-600 to-gray-700 hover:from-blue-700 hover:to-gray-800 border-0"
                  disabled={!newFriendUsername.trim()}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Envoyer une demande
                </Button>
                
                <p className="text-xs text-white/40 text-center">
                  Les demandes d'amis permettent de retrouver facilement vos amis pour jouer ensemble.
                </p>
              </div>
            </div>
          </div>
          
          {/* Friend Requests Box */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-medium">
                <Clock className="h-5 w-5 mr-2 text-gray-400" />
                Demandes reçues
              </h3>
              {pendingRequests.length > 0 && (
                <span className="bg-amber-500/30 text-amber-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            
            <div className="p-3">
              {pendingRequests.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-amber-500/20">
                          <AvatarFallback className="bg-amber-600/20 text-amber-300 text-xs">
                            {request.sender.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm" 
                          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                          onClick={() => onAcceptRequest(request.id)}
                          title="Accepter"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRejectRequest(request.id)}
                          className="h-8 w-8 p-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          title="Refuser"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/40 text-sm">Aucune demande en attente</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Friends List Column */}
        <div className="md:col-span-2">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 h-full overflow-hidden">
            <div className="border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-medium">
                <Users className="h-5 w-5 mr-2 text-gray-400" />
                Mes amis
              </h3>
              <span className="bg-blue-500/30 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                {friends.length} {friends.length <= 1 ? 'ami' : 'amis'}
              </span>
            </div>
            
            <div className="p-4">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-white/20" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Votre liste d'amis est vide</h4>
                  <p className="text-white/50 max-w-md mb-6">
                    Ajoutez des amis pour les retrouver facilement et jouer ensemble
                  </p>
                  <div className="inline-flex items-center bg-white/5 px-4 py-2 rounded-lg text-white/60">
                    <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                    <span>Recherchez un joueur et envoyez une demande d'ami</span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {friends.map((friend) => (
                    <div 
                      key={friend.id} 
                      className="flex items-center justify-between p-3 bg-black/30 hover:bg-black/40 transition-colors rounded-lg border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-blue-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-gray-700/50 to-blue-600/30 text-white">
                            {friend.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.username}</p>
                          <p className="text-xs text-white/50">{friend.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveFriend(friend.id)}
                          className="h-9 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsSection; 