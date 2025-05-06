import { useState } from 'react';
import { Trophy, Settings, History, User, Edit, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Match {
  opponent: string;
  result: 'Win' | 'Loss';
  score: string;
  date: string;
}

interface UserStats {
  username: string;
  email: string;
  totalGames: number;
  recentMatches: Match[];
}

// Mock data - replace with real data from your backend
const userStats: UserStats = {
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

const MatchResult = ({ match }: { match: Match }) => (
  <div className={`simple-card simple-flex simple-flex-between hover:shadow-md transition-all ${
    match.result === 'Win' ? 'border-primary' : 'border-destructive'
  }`}>
    <div className="simple-flex items-center gap-4">
      <div className={`p-2 rounded-lg ${
        match.result === 'Win' ? 'bg-primary-10 simple-text-primary' : 'bg-destructive/10 text-destructive'
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
    <div className="min-h-screen py-8">
      <div className="simple-container">
        <div className="max-w-4xl simple-mx-auto">
          {/* Profile Header */}
          <div className="simple-flex simple-flex-between mb-8">
            <div className="simple-flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary-20 simple-flex simple-flex-center">
                <span className="text-3xl font-bold simple-text-primary">
                  {userStats.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{userStats.username}</h1>
                <p className="text-muted-foreground">
                  Total Games: {userStats.totalGames}
                </p>
              </div>
            </div>
            <Button className="simple-btn-outline" onClick={() => setIsEditing(!isEditing)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <Tabs defaultValue="matches">
            <TabsList className="simple-tabs-list grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="matches" className="simple-tab-trigger">Recent Matches</TabsTrigger>
              <TabsTrigger value="settings" className="simple-tab-trigger">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="simple-flex simple-flex-col gap-4">
              {userStats.recentMatches.map((match, index) => (
                <MatchResult key={index} match={match} />
              ))}
            </TabsContent>

            <TabsContent value="settings">
              <div className="simple-card">
                <div className="simple-form-group">
                  <Label htmlFor="username" className="simple-label">Username</Label>
                  <Input
                    id="username"
                    defaultValue={userStats.username}
                    className="simple-input"
                  />
                </div>
                <div className="simple-form-group">
                  <Label htmlFor="email" className="simple-label">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={userStats.email}
                    className="simple-input"
                  />
                </div>
                <div className="simple-form-group">
                  <Label htmlFor="new-password" className="simple-label">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    className="simple-input"
                  />
                </div>
                <div className="simple-flex gap-4 mt-8">
                  <Button className="simple-btn">
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="destructive" className="simple-btn simple-btn-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
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