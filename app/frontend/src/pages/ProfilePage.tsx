import { useState } from 'react';
import { Trophy, Settings, History, User, Edit, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock data - replace with real data from your backend
const userStats = {
  username: "Player123",
  email: "player123@example.com",
  totalGames: 156,
  recentMatches: [
    { opponent: "Player456", result: "Win", score: "10-8", date: "2024-03-15" },
    { opponent: "Player789", result: "Win", score: "10-6", date: "2024-03-14" },
    { opponent: "Player234", result: "Loss", score: "8-10", date: "2024-03-14" },
    { opponent: "Player567", result: "Win", score: "10-4", date: "2024-03-13" },
    { opponent: "Player890", result: "Win", score: "10-7", date: "2024-03-13" },
  ]
};

const MatchResult = ({ match }: any) => (
  <div className={`elegant-card flex items-center justify-between group hover:scale-[1.02] transition-all ${
    match.result === 'Win' ? 'border-primary/30' : 'border-destructive/30'
  }`}>
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${
        match.result === 'Win' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
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
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="blob blob-primary w-[600px] h-[600px] -top-[300px] -left-[300px]" />
        <div className="blob blob-secondary w-[500px] h-[500px] -bottom-[250px] -right-[250px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <span className="text-3xl font-bold elegant-text-primary">
                    {userStats.username[0].toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{userStats.username}</h1>
                <p className="text-muted-foreground">
                  Total Games: {userStats.totalGames}
                </p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setIsEditing(!isEditing)}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          <Tabs defaultValue="matches">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="matches">Recent Matches</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4">
              {userStats.recentMatches.map((match, index) => (
                <MatchResult key={index} match={match} />
              ))}
            </TabsContent>

            <TabsContent value="settings">
              <div className="elegant-card space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    defaultValue={userStats.username}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={userStats.email}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    className="max-w-md"
                  />
                </div>
                <div className="pt-4 flex flex-wrap gap-4">
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="destructive" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 