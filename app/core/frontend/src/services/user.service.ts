import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  status: string;
}

class UserService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get(
        `${API_URL}/users`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error('Error fetching all users:', error);
      }
      return [];
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    try {
      const response = await axios.get(
        `${API_URL}/users/online`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error('Error fetching online users:', error);
      }
      return [];
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const response = await axios.get(
        `${API_URL}/users/${userId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error(`Error fetching user ${userId}:`, error);
      }
      return null;
    }
  }

  async updateUserStatus(userId: number, status: 'online' | 'offline' | 'in-game'): Promise<User | null> {
    try {
      const response = await axios.put(
        `${API_URL}/users/${userId}/status`,
        { status },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication error: Token may be invalid or expired');
      } else {
        console.error(`Error updating user ${userId} status:`, error);
      }
      return null;
    }
  }
}

export const userService = new UserService(); 