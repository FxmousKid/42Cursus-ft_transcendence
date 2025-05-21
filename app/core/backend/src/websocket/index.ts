import { Server, Socket } from 'socket.io';
import { User } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import * as jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface UserSocket extends Socket {
  userId?: number;
  username?: string;
}

interface DB {
  sequelize: Sequelize;
  models: {
    User: typeof User;
    Friendship: typeof Friendship;
    Match: any;
  };
  Sequelize?: typeof Sequelize;
}

// Map of online users: userId -> socketId
const onlineUsers = new Map<number, string>();
// Map of socketId -> userId
const socketUserMap = new Map<string, number>();

export function setupWebSocket(io: Server, db: DB) {
  // Authentication middleware for Socket.IO
  io.use(async (socket: UserSocket, next) => {
    try {
      // Get token either from auth object or query param for flexibility
      const rawToken = socket.handshake.auth.token || socket.handshake.query.token;
      
      console.log('[WebSocket] Connection attempt with token:', !!rawToken);
      
      if (!rawToken) {
        console.warn('[WebSocket] No token provided');
        return next(new Error('Authentication error: Token required'));
      }
      
      // Strip "Bearer " prefix if present
      const token = typeof rawToken === 'string' && rawToken.startsWith('Bearer ') 
        ? rawToken.substring(7) // Remove "Bearer " prefix
        : rawToken;
      
      // Verify JWT token
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        console.warn('[WebSocket] Invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Find user
      const user = await db.models.User.findByPk(decoded.id);
      
      if (!user) {
        console.warn('[WebSocket] User not found:', decoded.id);
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user info to socket
      socket.userId = user.id;
      socket.username = user.username;
      
      console.log(`[WebSocket] User authenticated: ${user.username} (${user.id})`);
      next();
    } catch (error) {
      console.error('[WebSocket] Auth error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Handle connections
  io.on('connection', async (socket: UserSocket) => {
    const userId = socket.userId;
    const username = socket.username;
    
    console.log(`[WebSocket] User connected: ${username} (${userId})`);
    
    // Also handle auth messages for clients that prefer to auth after connection
    socket.on('auth', async (data: { token: string }) => {
      try {
        const { token: rawToken } = data;
        console.log('[WebSocket] Auth message received');
        
        if (!rawToken) {
          socket.emit('error', { type: 'error', message: 'Token required' });
          return;
        }
        
        // Strip "Bearer " prefix if present
        const token = rawToken.startsWith('Bearer ') 
          ? rawToken.substring(7) 
          : rawToken;
        
        // Verify JWT token
        const decoded: any = jwt.verify(token, JWT_SECRET);
        
        if (!decoded || !decoded.id) {
          socket.emit('error', { type: 'error', message: 'Invalid token' });
          return;
        }
        
        // Find user
        const user = await db.models.User.findByPk(decoded.id);
        
        if (!user) {
          socket.emit('error', { type: 'error', message: 'User not found' });
          return;
        }
        
        // Attach user info to socket
        socket.userId = user.id;
        socket.username = user.username;
        
        console.log(`[WebSocket] User authenticated via message: ${user.username} (${user.id})`);
        
        // Process as normal connection
        onlineUsers.set(user.id, socket.id);
        socketUserMap.set(socket.id, user.id);
        
        // Update user status to online
        user.status = 'online';
        await user.save();
        
        // Notify friends that user is online
        notifyFriendsStatusChange(user.id, 'online');
        
        // Send acknowledgement
        socket.emit('auth-success', {
          type: 'auth-success',
          user_id: user.id,
          username: user.username
        });
      } catch (error) {
        console.error('[WebSocket] Auth message error:', error);
        socket.emit('error', { type: 'error', message: 'Authentication failed: ' + error.message });
      }
    });
    
    if (userId) {
      // Store user's socket id
      onlineUsers.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);
      
      // Update user status to online
      try {
        const user = await db.models.User.findByPk(userId);
        if (user) {
          user.status = 'online';
          await user.save();
          
          // Notify friends that user is online
          notifyFriendsStatusChange(userId, 'online');
        }
      } catch (error) {
        console.error('[WebSocket] Error updating user status:', error);
      }
      
      // Send current online users to the newly connected user
      socket.emit('online-users', Array.from(onlineUsers.keys()));
    }
    
    // Handle friend request events
    socket.on('friend-request', async (data: { friendId: number }) => {
      try {
        console.log('[WebSocket] Friend request received:', data);
        const { friendId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        if (userId === friendId) {
          socket.emit('error', { type: 'error', message: 'Cannot send friend request to yourself' });
          return;
        }
        
        // Check if friend exists
        const friend = await db.models.User.findByPk(friendId);
        if (!friend) {
          socket.emit('error', { type: 'error', message: 'User not found' });
          return;
        }
        
        // Check if friendship already exists
        const existingFriendship = await db.models.Friendship.findOne({
          where: {
            [Op.or]: [
              { user_id: userId, friend_id: friendId },
              { user_id: friendId, friend_id: userId }
            ]
          }
        });
        
        if (existingFriendship) {
          socket.emit('error', { type: 'error', message: 'Friendship already exists' });
          return;
        }
        
        // Create friendship request
        if (userId !== undefined) {
          const user = await db.models.User.findByPk(userId);
          if (!user) {
            throw new Error('User not found');
          }
          
          const friendship = await db.models.Friendship.create({
            user_id: userId,
            friend_id: friendId,
            status: 'pending'
          });
          
          // Notify the friend if they're online
          notifyFriendRequest(friendId, {
            id: userId,
            username: user.username
          });
          
          console.log(`[WebSocket] Emitting friend-request-sent to ${userId}`);
          socket.emit('friend-request-sent', {
            type: 'friend-request-sent',
            id: friendship.id,
            friend_id: friendId,
            friend_username: friend.username,
            status: 'pending'
          });
        } else {
          socket.emit('error', { type: 'error', message: 'User ID is undefined' });
        }
      } catch (error) {
        console.error('[WebSocket] Error sending friend request:', error);
        socket.emit('error', { type: 'error', message: 'Failed to send friend request: ' + error.message });
      }
    });
    
    // Handle friend request response
    socket.on('friend-request-response', async (data: { friendId: number, accept: boolean }) => {
      try {
        console.log('[WebSocket] Friend request response received:', data);
        const { friendId, accept } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        // Find the friendship request
        const friendship = await db.models.Friendship.findOne({
          where: {
            user_id: friendId,
            friend_id: userId,
            status: 'pending'
          }
        });
        
        if (!friendship) {
          socket.emit('error', { type: 'error', message: 'Friend request not found' });
          return;
        }
        
        if (accept) {
          // Accept the friend request
          friendship.status = 'accepted';
          await friendship.save();
          
          // Get user who accepted the request
          const acceptingUser = await db.models.User.findByPk(userId);
          
          if (!acceptingUser) {
            throw new Error('User not found');
          }
          
          // Notify the sender that their request was accepted
          notifyFriendRequestAccepted(friendId, {
            id: userId,
            username: acceptingUser.username,
            avatar_url: acceptingUser.avatar_url || null,
            status: acceptingUser.status
          });
          
          socket.emit('friend-request-accepted', {
            type: 'friend-request-accepted',
            id: friendship.id,
            friend_id: friendId,
            status: 'accepted'
          });
        } else {
          // Reject the friend request
          await friendship.destroy();
          
          socket.emit('friend-request-rejected', {
            type: 'friend-request-rejected',
            friend_id: friendId
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error responding to friend request:', error);
        socket.emit('error', { type: 'error', message: 'Failed to respond to friend request: ' + error.message });
      }
    });
    
    // Handle friend removal
    socket.on('friend-remove', async (data: { friendId: number }) => {
      try {
        console.log('[WebSocket] Friend removal request received:', data);
        const { friendId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        // Find the friendship
        const friendship = await db.models.Friendship.findOne({
          where: {
            [Op.or]: [
              { user_id: userId, friend_id: friendId },
              { user_id: friendId, friend_id: userId }
            ],
            status: 'accepted'
          }
        });
        
        if (!friendship) {
          socket.emit('error', { type: 'error', message: 'Friendship not found' });
          return;
        }
        
        // Remove the friendship
        await friendship.destroy();
        
        // Notify the friend if they're online
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend-removed', {
            type: 'friend-removed',
            friend_id: userId
          });
        }
        
        socket.emit('friend-removed', {
          type: 'friend-removed',
          friend_id: friendId
        });
      } catch (error) {
        console.error('[WebSocket] Error removing friend:', error);
        socket.emit('error', { type: 'error', message: 'Failed to remove friend: ' + error.message });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`[WebSocket] User disconnected: ${username} (${userId})`);
      
      if (userId) {
        // Remove user from online users
        onlineUsers.delete(userId);
        socketUserMap.delete(socket.id);
        
        // Update user status to offline
        try {
          const user = await db.models.User.findByPk(userId);
          if (user) {
            user.status = 'offline';
            await user.save();
            
            // Notify friends that user is offline
            notifyFriendsStatusChange(userId, 'offline');
          }
        } catch (error) {
          console.error('[WebSocket] Error updating user status:', error);
        }
      }
    });
  });

  // Function to notify a user about a friend request
  function notifyFriendRequest(toUserId: number, fromUser: { id: number; username: string }) {
    const socketId = onlineUsers.get(toUserId);
    if (socketId) {
      console.log(`[WebSocket] Notifying user ${toUserId} about friend request from ${fromUser.username}`);
      console.log(`[WebSocket] Notification data:`, {
        type: 'friend-request-received',
        from: fromUser
      });
      io.to(socketId).emit('friend-request-received', {
        type: 'friend-request-received',
        from: fromUser
      });
    } else {
      console.log(`[WebSocket] User ${toUserId} is not online, can't notify about friend request`);
    }
  }

  // Function to notify a user that their friend request was accepted
  function notifyFriendRequestAccepted(toUserId: number, acceptedBy: { id: number; username: string; avatar_url: string | null; status: string }) {
    const socketId = onlineUsers.get(toUserId);
    if (socketId) {
      console.log(`[WebSocket] Notifying user ${toUserId} that ${acceptedBy.username} accepted their friend request`);
      io.to(socketId).emit('friend-request-accepted', {
        type: 'friend-request-accepted',
        friend: acceptedBy
      });
    }
  }

  // Function to notify friends about a user's status change
  async function notifyFriendsStatusChange(userId: number, status: string) {
    try {
      // Find all friends
      const friendships = await db.models.Friendship.findAll({
        where: {
          [Op.or]: [
            { user_id: userId },
            { friend_id: userId }
          ],
          status: 'accepted'
        }
      });
      
      // Get friend IDs
      const friendIds = friendships.map(friendship => 
        friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      );
      
      // Notify each online friend
      for (const friendId of friendIds) {
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend-status-change', {
            type: 'friend-status-change',
            friend_id: userId,
            status
          });
        }
      }
    } catch (error) {
      console.error('[WebSocket] Error notifying friends about status change:', error);
    }
  }
} 