import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, User, Mail, Copy } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const FriendsGamePage = () => {
  const navigate = useNavigate();
  const [friendCode, setFriendCode] = useState('');
  const [yourCode] = useState('F7BC2D'); // Generated code example
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(yourCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const onlineFriends = [
    { id: 1, name: "AlexGamer", status: "Online", avatar: "A" },
    { id: 2, name: "PongMaster", status: "In Game", avatar: "P" },
    { id: 3, name: "ChampionPlayer", status: "Online", avatar: "C" },
  ];
  
  const offlineFriends = [
    { id: 4, name: "GameWizard", status: "Offline", avatar: "G" },
    { id: 5, name: "PaddlePro", status: "Last seen 2h ago", avatar: "P" },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background effects - simplified */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary-20 opacity-50"></div>
      
      {/* Back button */}
      <div className="pt-16 pb-2 px-6">
        <div className="simple-container">
          <Button 
            className="simple-btn-outline"
            onClick={() => navigate('/game')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Modes
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 py-8 px-4">
        <div className="simple-container">
          <div className="simple-card max-w-3xl simple-mx-auto">
            <h2 className="simple-text-center text-2xl font-bold mb-6">Play With Friends</h2>
            
            <div className="simple-grid simple-grid-3">
              {/* Left Column - Friends List */}
              <div>
                <Card className="simple-card h-full">
                  <CardHeader>
                    <CardTitle>Friends</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search friends..."
                        className="simple-input pl-8"
                      />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Online ({onlineFriends.length})</h3>
                      <div className="simple-flex simple-flex-col gap-2">
                        {onlineFriends.map(friend => (
                          <div key={friend.id} className="simple-flex simple-flex-between p-2 rounded-lg hover:bg-primary-10 cursor-pointer">
                            <div className="simple-flex items-center gap-3">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-primary simple-flex simple-flex-center">
                                  {friend.avatar}
                                </div>
                                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${friend.status === "In Game" ? "bg-warning" : "bg-success"}`}></div>
                              </div>
                              <div>
                                <p className="font-medium">{friend.name}</p>
                                <p className="text-xs text-muted-foreground">{friend.status}</p>
                              </div>
                            </div>
                            <Button className="simple-btn-ghost p-2 h-8 w-8 rounded-full">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Offline ({offlineFriends.length})</h3>
                      <div className="simple-flex simple-flex-col gap-2">
                        {offlineFriends.map(friend => (
                          <div key={friend.id} className="simple-flex simple-flex-between p-2 rounded-lg hover:bg-primary-10 cursor-pointer">
                            <div className="simple-flex items-center gap-3">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-primary-50 simple-flex simple-flex-center">
                                  {friend.avatar}
                                </div>
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-500"></div>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">{friend.name}</p>
                                <p className="text-xs text-muted-foreground">{friend.status}</p>
                              </div>
                            </div>
                            <Button className="simple-btn-ghost p-2 h-8 w-8 rounded-full">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button className="simple-btn w-full">
                      <UserPlus className="mr-2 h-4 w-4" /> Add Friend
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Right Column - Invite & Start */}
              <div className="col-span-2">
                <Card className="simple-card h-full">
                  <div className="simple-flex simple-flex-col simple-flex-center simple-text-center p-8">
                    <div className="simple-feature-icon mb-6">
                      <User className="h-16 w-16" />
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-3">Invite a Friend</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                      Challenge your friends to a game of Pong! Send them an invite link or 
                      select a friend from your friends list.
                    </p>
                    
                    <div className="w-full max-w-md bg-card rounded-lg p-4 simple-flex items-center mb-8 border border-border">
                      <div className="flex-1 truncate text-sm text-muted-foreground">
                        https://pong-transcendence.com/game/invite/{yourCode}
                      </div>
                      <Button className="simple-btn-ghost ml-2" onClick={copyToClipboard}>
                        {copied ? "Copied!" : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="simple-flex gap-4 w-full max-w-md">
                      <Button className="simple-btn flex-1">
                        <Mail className="mr-2 h-4 w-4" /> Send Invite
                      </Button>
                      <Button className="simple-btn-secondary flex-1">
                        Create Game Room
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border-10 bg-card-30">
        <div className="simple-container simple-text-center">
          <div className="simple-flex items-center justify-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-lg font-bold simple-text-primary">PONG</span>
          </div>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Transcendence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default FriendsGamePage; 