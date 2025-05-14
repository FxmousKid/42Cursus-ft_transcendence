// User types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'in_game';
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'in_game';
  display_name?: string;
  created_at: string;
  updated_at: string;
  stats: UserStats;
  achievements: Achievement[];
  recent_matches: Match[];
  friends_count?: number;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type LoginResponse = AuthResponse;

// Game types
export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id?: number;
  created_at: string;
  ended_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  player1?: User;
  player2?: User;
}

export interface GameState {
  player1Y: number;
  player2Y: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  player1Score: number;
  player2Score: number;
  paddleWidth: number;
  paddleHeight: number;
  ballSize: number;
  gameOver: boolean;
  winnerId?: number;
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished';
}

// Stats types
export interface UserStats {
  wins: number;
  losses: number;
  rank: number;
  total_games: number;
  win_rate: number;
}

// Achievement types
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  unlocked_at?: string;
}

// Friendship types
export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  friend?: User;
}

// Route types
export interface Route {
  path: string;
  callback: (params?: any) => void;
  requiresAuth: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types pour les paramètres du jeu
export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  ballSpeed: number;
  paddleSize: number;
  scoreLimit: number;
  theme: 'classic' | 'modern' | 'retro';
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// Types pour les événements WebSocket
export interface SocketEvent {
  type: string;
  payload: any;
}

// Types pour les invitations de jeu
export interface GameInvitation {
  id: number;
  from_user_id: number;
  to_user_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_user?: User;
} 