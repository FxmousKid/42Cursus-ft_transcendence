import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, User, Mail, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const FriendsGamePage = () => {
  const navigate = useNavigate();
  const [friendCode, setFriendCode] = useState('');
  const [yourCode, setYourCode] = useState('F7BC2D'); // Generated code example
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10"></div>
      
      {/* Back button */}
      <div className="pt-16 pb-2 px-6">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/game')}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Game Modes
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto bg-[#0b2046]/60 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Play With Friends</h1>
          
          {/* your code begins here */}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Friends List */}
            <div className="lg:col-span-1">
              <Card className="bg-[#0b2046]/80 border-white/10 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Friends</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search friends..."
                      className="pl-8 bg-[#071835] border-white/10 focus-visible:ring-[#0056d3]"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Online ({onlineFriends.length})</h3>
                    <div className="space-y-2">
                      {onlineFriends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0056d3]/20 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-[#0056d3] flex items-center justify-center">
                                {friend.avatar}
                              </div>
                              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${friend.status === "In Game" ? "bg-yellow-500" : "bg-green-500"} border-2 border-[#0b2046]`}></div>
                            </div>
                            <div>
                              <p className="font-medium">{friend.name}</p>
                              <p className="text-xs text-gray-300">{friend.status}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="hover:bg-[#0056d3]/30">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Offline ({offlineFriends.length})</h3>
                    <div className="space-y-2">
                      {offlineFriends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0056d3]/20 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-[#0056d3]/50 flex items-center justify-center text-white/70">
                                {friend.avatar}
                              </div>
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-500 border-2 border-[#0b2046]"></div>
                            </div>
                            <div>
                              <p className="font-medium text-white/70">{friend.name}</p>
                              <p className="text-xs text-gray-400">{friend.status}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="hover:bg-[#0056d3]/30 text-white/50">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button variant="outline" className="w-full border-white/20 gap-2">
                    <UserPlus className="h-4 w-4" /> Add Friend
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Right Column - Invite & Start */}
            <div className="lg:col-span-2">
              <Card className="bg-[#0b2046]/80 border-white/10 backdrop-blur-sm p-8 h-full flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="p-6 rounded-full bg-[#0056d3]/20 mb-6">
                    <User className="h-16 w-16 text-[#0056d3]" />
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-3">Invite a Friend</h2>
                  <p className="text-gray-300 max-w-md mb-8">
                    Challenge your friends to a game of Pong! Send them an invite link or 
                    select a friend from your friends list.
                  </p>
                  
                  <div className="w-full max-w-md bg-[#071835] rounded-lg p-4 flex items-center mb-8">
                    <div className="flex-1 truncate text-sm text-gray-300">
                      https://pong-transcendence.com/game/invite/{yourCode}
                    </div>
                    <Button size="sm" variant="ghost" className="ml-2" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                    <Button className="flex-1 bg-[#0056d3] hover:bg-[#0048b3] gap-2">
                      <Mail className="h-4 w-4" /> Send Invite
                    </Button>
                    <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10">
                      Create Game Room
                    </Button>
                  </div>
                </div>
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