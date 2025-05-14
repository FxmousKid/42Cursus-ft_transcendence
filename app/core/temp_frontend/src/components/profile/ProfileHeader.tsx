import { Mail, Calendar, Trophy, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { UserProfileData } from '@/services/api';
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  profile: UserProfileData;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  // Calculate number of wins safely
  const calculateWins = () => {
    if (profile.winRate === undefined || profile.totalGames === undefined) return 0;
    return Math.round((profile.winRate * profile.totalGames) / 100);
  };
  
  // Calculate number of losses safely
  const calculateLosses = () => {
    if (profile.totalGames === undefined || profile.winRate === undefined) return 0;
    return profile.totalGames - Math.round((profile.winRate * profile.totalGames) / 100);
  };

  return (
    <div className="rounded-xl bg-black/20 border border-white/10 overflow-hidden shadow-xl max-w-6xl mx-auto">
      {/* Main Content */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Avatar with online status */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-blue-500/30 shadow-lg">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-700 to-gray-900">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-[#0f172a]"></div>
          </div>
          
          {/* User information */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              
              {/* Performance badge */}
              {profile.winRate !== undefined && profile.winRate > 0 && (
                <div className="mt-2 md:mt-0 mx-auto md:mx-0 px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 inline-flex items-center gap-2">
                  <div className="p-1.5 bg-gray-700/50 rounded-md">
                    <Trophy className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-400">Performance</span>
                    <p className="text-sm font-bold text-white">{profile.winRate}%</p>
                  </div>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${profile.winRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-black/30 hover:bg-black/40 text-gray-300 px-2 py-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {profile.email}
              </Badge>
              
              {profile.joinDate && (
                <Badge className="bg-black/30 hover:bg-black/40 text-gray-300 px-2 py-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(profile.joinDate).toLocaleDateString()}
                </Badge>
              )}
              
              {profile.totalGames !== undefined && profile.totalGames > 0 && (
                <Badge className="bg-black/30 hover:bg-black/40 text-gray-300 px-2 py-1 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-gray-400" />
                  {profile.totalGames} {profile.totalGames > 1 ? 'parties' : 'partie'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar (only on larger screens) */}
      {profile.totalGames !== undefined && profile.totalGames > 0 && (
        <div className="hidden md:flex items-center justify-between bg-black/30 border-t border-white/10 px-8 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium text-white/50">Parties</p>
              <p className="text-lg font-bold">{profile.totalGames}</p>
            </div>
            
            <div className="h-10 w-px bg-white/10"></div>
            
            <div>
              <p className="text-xs font-medium text-white/50">Victoires</p>
              <p className="text-lg font-bold text-blue-400">
                {calculateWins()}
              </p>
            </div>
            
            <div className="h-10 w-px bg-white/10"></div>
            
            <div>
              <p className="text-xs font-medium text-white/50">Défaites</p>
              <p className="text-lg font-bold text-rose-400">
                {calculateLosses()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader; 