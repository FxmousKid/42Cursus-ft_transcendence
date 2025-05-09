import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Friend {
  id: number;
  username: string;
  avatar_url: string | null;
  status: string;
}

export interface PendingRequest {
  id: number;
  user: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
}

class FriendshipService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async sendFriendRequest(userId: number, friendId: number) {
    try {
      const response = await axios.post(
        `${API_URL}/friendships/request/${friendId}`, 
        { userId },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('Authentication error: Token may be invalid or expired');
        } else if (error.response?.status === 409) {
          console.error('Friendship request already exists');
        }
      }
      throw error;
    }
  }

  async acceptFriendRequest(userId: number, friendId: number) {
    try {
      const response = await axios.post(
        `${API_URL}/friendships/accept/${friendId}`, 
        { userId },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      }
      throw error;
    }
  }

  async rejectFriendRequest(userId: number, friendId: number) {
    try {
      const response = await axios.post(
        `${API_URL}/friendships/reject/${friendId}`, 
        { userId },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      }
      throw error;
    }
  }

  async getFriends(userId: number): Promise<Friend[]> {
    try {
      const response = await axios.get(
        `${API_URL}/friendships/list/${userId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error(`Error fetching friends for user ${userId}:`, error);
      }
      return [];
    }
  }

  async getPendingRequests(userId: number): Promise<PendingRequest[]> {
    try {
      const response = await axios.get(
        `${API_URL}/friendships/pending/${userId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error(`Error fetching pending requests for user ${userId}:`, error);
      }
      return [];
    }
  }

  async removeFriend(userId: number, friendId: number) {
    try {
      const response = await axios.delete(
        `${API_URL}/friendships/${friendId}`, 
        { 
          data: { userId },
          headers: this.getAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      }
      throw error;
    }
  }
}

export const friendshipService = new FriendshipService(); 