import { useState } from 'react';
import { Trophy, Medal, Star, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data - replace with real data from your backend
const leaderboardData = [
  { rank: 1, username: "ProGamer", rating: 2150, wins: 245, losses: 82, winStreak: 12 },
  { rank: 2, username: "PongMaster", rating: 2080, wins: 198, losses: 75, winStreak: 8 },
  { rank: 3, username: "GameWizard", rating: 2045, wins: 185, losses: 90, winStreak: 5 },
  { rank: 4, username: "PixelHero", rating: 1980, wins: 165, losses: 88, winStreak: 3 },
  { rank: 5, username: "SpeedKing", rating: 1920, wins: 150, losses: 85, winStreak: 4 },
  { rank: 6, username: "PaddlePro", rating: 1890, wins: 142, losses: 89, winStreak: 2 },
  { rank: 7, username: "BallMaster", rating: 1850, wins: 138, losses: 92, winStreak: 1 },
  { rank: 8, username: "GameLord", rating: 1820, wins: 130, losses: 88, winStreak: 3 },
  { rank: 9, username: "ArcadeKing", rating: 1790, wins: 125, losses: 90, winStreak: 2 },
  { rank: 10, username: "PixelMaster", rating: 1760, wins: 120, losses: 89, winStreak: 1 },
];

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
  return <span className="text-lg font-mono font-bold text-muted-foreground">{rank}</span>;
};

const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlayers = leaderboardData.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="blob blob-primary w-[800px] h-[800px] -top-[400px] -right-[400px]" />
        <div className="blob blob-secondary w-[600px] h-[600px] -bottom-[300px] -left-[300px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Global <span className="elegant-text-primary">Leaderboard</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compete with the best players and climb the ranks to become the ultimate Pong champion.
          </p>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          {/* Search */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <TrendingUp className="mr-2 h-4 w-4" />
              Top Players
            </Button>
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              <Star className="mr-2 h-4 w-4" />
              Your Rank
            </Button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="elegant-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Player</th>
                  <th className="px-6 py-4 text-right">Rating</th>
                  <th className="px-6 py-4 text-right hidden md:table-cell">Win Rate</th>
                  <th className="px-6 py-4 text-right hidden md:table-cell">Streak</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr
                    key={player.rank}
                    className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RankIcon rank={player.rank} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-background font-bold">
                          {player.username[0]}
                        </div>
                        <span className="font-medium">{player.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                      {player.rating}
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      {((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-accent">
                        <TrendingUp className="h-4 w-4" />
                        {player.winStreak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 