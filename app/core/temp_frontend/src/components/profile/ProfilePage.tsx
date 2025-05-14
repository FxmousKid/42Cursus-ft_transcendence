import { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileNavigation from './ProfileNavigation';
import MatchHistory from './MatchHistory';
import FriendsSection from './FriendsSection';
import ProfileSettings from './ProfileSettings';
import ProfileOverview from './ProfileOverview';
import { useAuth } from '@/context/AuthContext';

// Mock data
const mockUser = {
  id: 1,
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  bio: 'Passionné de jeux vidéo et de technologie.',
  profilePicture: null,
  joinDate: '2023-04-15T10:30:00.000Z',
  totalGames: 70,
  winRate: 60,
  status: 'online'
};

const mockMatches = [
  { id: 1, date: '2023-06-15', opponent: 'AliceGamer', result: 'Win', score: '10-8' },
  { id: 2, date: '2023-06-12', opponent: 'BobPlayer', result: 'Loss', score: '5-10' },
  { id: 3, date: '2023-06-10', opponent: 'CharliePro', result: 'Win', score: '10-3' },
  { id: 4, date: '2023-06-08', opponent: 'DanielKing', result: 'Win', score: '10-7' },
  { id: 5, date: '2023-06-05', opponent: 'EveChampion', result: 'Loss', score: '9-10' },
  { id: 6, date: '2023-06-02', opponent: 'FrankMaster', result: 'Loss', score: '4-10' },
];

const mockFriends = [
  { id: 1, username: 'AliceGamer', email: 'alice@example.com' },
  { id: 2, username: 'BobPlayer', email: 'bob@example.com' },
  { id: 3, username: 'CharliePro', email: 'charlie@example.com' },
];

const mockPendingRequests = [
  { 
    id: 1, 
    sender: { 
      id: 4, 
      username: 'DanielKing', 
      email: 'daniel@example.com' 
    },
    created_at: '2023-06-15T14:30:00.000Z' 
  },
  { 
    id: 2, 
    sender: { 
      id: 5, 
      username: 'EveChampion', 
      email: 'eve@example.com' 
    },
    created_at: '2023-06-14T11:45:00.000Z' 
  },
];

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { logout } = useAuth();

  // Handle sending a friend request
  const handleSendFriendRequest = (username: string) => {
    console.log(`Sending friend request to: ${username}`);
    // Implement API call to send friend request
  };

  // Handle accepting a friend request
  const handleAcceptFriendRequest = (requestId: number) => {
    console.log(`Accepting friend request with ID: ${requestId}`);
    // Implement API call to accept friend request
  };

  // Handle rejecting a friend request
  const handleRejectFriendRequest = (requestId: number) => {
    console.log(`Rejecting friend request with ID: ${requestId}`);
    // Implement API call to reject friend request
  };

  // Handle removing a friend
  const handleRemoveFriend = (friendId: number) => {
    console.log(`Removing friend with ID: ${friendId}`);
    // Implement API call to remove friend
  };

  // Handle saving profile data
  const handleSaveProfile = async (data: { username?: string; email?: string; password?: string }) => {
    console.log('Saving profile data:', data);
    // Implement API call to save profile data
    return Promise.resolve();
  };

  // Handle logout
  const handleLogout = () => {
    console.log('Logging out');
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Profile Header with User Information */}
        <ProfileHeader profile={mockUser} />
        
        {/* Navigation between sections */}
        <div className="my-6">
          <ProfileNavigation 
            activeSection={activeSection}
            pendingRequestsCount={mockPendingRequests.length}
            onChange={setActiveSection}
          />
        </div>
        
        {/* Main Content based on active section */}
        <div className="py-8">
          {activeSection === 'overview' && (
            <ProfileOverview profile={{...mockUser, matches: mockMatches}} />
          )}
          
          {activeSection === 'matches' && (
            <MatchHistory matches={mockMatches} />
          )}
          
          {activeSection === 'friends' && (
            <FriendsSection 
              friends={mockFriends}
              pendingRequests={mockPendingRequests}
              onSendRequest={handleSendFriendRequest}
              onAcceptRequest={handleAcceptFriendRequest}
              onRejectRequest={handleRejectFriendRequest}
              onRemoveFriend={handleRemoveFriend}
            />
          )}
          
          {activeSection === 'settings' && (
            <ProfileSettings
              profile={mockUser}
              onSaveProfile={handleSaveProfile}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 