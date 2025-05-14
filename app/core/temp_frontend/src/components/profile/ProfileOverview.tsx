import { UserCircle, Trophy, Calendar, Activity, Clock, ChevronRight, BarChart2 } from 'lucide-react';
import type { UserProfileData, MatchData } from '@/services/api';

interface ProfileOverviewProps {
  profile: UserProfileData;
}

const ProfileOverview = ({ profile }: ProfileOverviewProps) => {
  // Calculate stats
  const totalMatches = profile.matches?.length || 0;
  const wins = profile.matches?.filter(match => match.result === 'Win').length || 0;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Get most recent match
  const lastMatch = profile.matches && profile.matches.length > 0 
    ? profile.matches[0] 
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vue d'ensemble</h2>
          <p className="text-white/50 mt-1">Statistiques et activités récentes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Games Played */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Parties jouées</p>
              <p className="text-2xl font-bold">{totalMatches}</p>
            </div>
            <div className="bg-black/30 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Taux de victoire</p>
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
            <div className="bg-black/30 p-2 rounded-lg">
              <BarChart2 className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Wins */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Victoires</p>
              <p className="text-2xl font-bold text-blue-400">{wins}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Losses */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Défaites</p>
              <p className="text-2xl font-bold text-rose-400">{losses}</p>
            </div>
            <div className="bg-rose-500/10 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="flex items-center text-lg font-medium">
              <Clock className="h-5 w-5 mr-2 text-gray-400" />
              Activité récente
            </h3>
          </div>
          
          <div className="p-5">
            {lastMatch ? (
              <div>
                <div className="relative border-l-2 border-blue-500 pl-4 pb-6">
                  <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm text-white/50 mb-1">{lastMatch.date}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      lastMatch.result === 'Win' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {lastMatch.result === 'Win' ? 'Victoire' : 'Défaite'}
                    </span>
                    <p className="font-medium">contre {lastMatch.opponent}</p>
                  </div>
                  <p className="text-white/70 mt-1">{lastMatch.score}</p>
                </div>
                
                <div className="border-l-2 border-dotted border-white/10 pl-4 mt-2">
                  <div className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                    <span>Voir l'historique complet</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/50">Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Account section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="flex items-center text-lg font-medium">
              <UserCircle className="h-5 w-5 mr-2 text-gray-400" />
              Informations du compte
            </h3>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-white/50 mb-1">Nom d'utilisateur</p>
              <p className="font-medium">{profile.username}</p>
            </div>
            
            <div>
              <p className="text-sm text-white/50 mb-1">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            
            {profile.joinDate && (
              <div>
                <p className="text-sm text-white/50 mb-1">Date d'inscription</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{new Date(profile.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview; 