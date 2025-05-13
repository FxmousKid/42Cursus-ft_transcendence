import { Server, Socket } from 'socket.io';
import { User } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface UserSocket extends Socket {
  userId?: number;
  username?: string;
}

export function setupWebSocket(io: Server, db: any) {
  // Store online users
  const onlineUsers = new Map<number, string>(); // userId -> socketId

  // Authentication middleware for Socket.IO
  io.use(async (socket: UserSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify JWT token
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Find user
      const user = await db.models.User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user info to socket
      socket.userId = user.id;
      socket.username = user.username;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Handle connections
  io.on('connection', async (socket: UserSocket) => {
    const userId = socket.userId;
    const username = socket.username;
    
    console.log(`User connected: ${username} (${userId})`);
    
    if (userId) {
      // Store user's socket id
      onlineUsers.set(userId, socket.id);
      
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
        console.error('Error updating user status:', error);
      }
      
      // Send current online users to the newly connected user
      socket.emit('online-users', Array.from(onlineUsers.keys()));
    }
    
    // Handle friend request events
    socket.on('friend-request', async (data: { friendId: number }) => {
      try {
        const { friendId } = data;
        
        if (userId === friendId) {
          socket.emit('error', { message: 'Cannot send friend request to yourself' });
          return;
        }
        
        // Check if friend exists
        const friend = await db.models.User.findByPk(friendId);
        if (!friend) {
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        // Check if friendship already exists
        const existingFriendship = await db.models.Friendship.findOne({
          where: {
            [db.sequelize.Op.or]: [
              { user_id: userId, friend_id: friendId },
              { user_id: friendId, friend_id: userId }
            ]
          }
        });
        
        if (existingFriendship) {
          socket.emit('error', { message: 'Friendship already exists' });
          return;
        }
        
        // Create friendship request
        const friendship = await db.models.Friendship.create({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        });
        
        // Notify the friend if they're online
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend-request-received', {
            id: friendship.id,
            user_id: userId,
            username: username,
            status: 'pending'
          });
        }
        
        socket.emit('friend-request-sent', {
          id: friendship.id,
          friend_id: friendId,
          friend_username: friend.username,
          status: 'pending'
        });
      } catch (error) {
        console.error('Error sending friend request:', error);
        socket.emit('error', { message: 'Failed to send friend request' });
      }
    });
    
    // Handle friend request response
    socket.on('friend-request-response', async (data: { friendId: number, accept: boolean }) => {
      try {
        const { friendId, accept } = data;
        
        // Find the friendship request
        const friendship = await db.models.Friendship.findOne({
          where: {
            user_id: friendId,
            friend_id: userId,
            status: 'pending'
          }
        });
        
        if (!friendship) {
          socket.emit('error', { message: 'Friend request not found' });
          return;
        }
        
        if (accept) {
          // Accept friend request
          friendship.status = 'accepted';
          await friendship.save();
          
          // Notify the requester if they're online
          const requesterSocketId = onlineUsers.get(friendId);
          if (requesterSocketId) {
            io.to(requesterSocketId).emit('friend-request-accepted', {
              id: friendship.id,
              friend_id: userId,
              friend_username: username
            });
          }
          
          socket.emit('friend-request-response-sent', {
            id: friendship.id,
            friend_id: friendId,
            accepted: true
          });
        } else {
          // Reject friend request
          await friendship.destroy();
          
          socket.emit('friend-request-response-sent', {
            friend_id: friendId,
            accepted: false
          });
        }
      } catch (error) {
        console.error('Error responding to friend request:', error);
        socket.emit('error', { message: 'Failed to respond to friend request' });
      }
    });
    
    // Handle game invitations
    socket.on('game-invitation', async (data: { friendId: number }) => {
      try {
        const { friendId } = data;
        
        // Check if users are friends
        const friendship = await db.models.Friendship.findOne({
          where: {
            [db.sequelize.Op.or]: [
              { user_id: userId, friend_id: friendId },
              { user_id: friendId, friend_id: userId }
            ],
            status: 'accepted'
          }
        });
        
        if (!friendship) {
          socket.emit('error', { message: 'You are not friends with this user' });
          return;
        }
        
        // Send game invitation to friend if online
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('game-invitation-received', {
            from_id: userId,
            from_username: username
          });
          
          socket.emit('game-invitation-sent', {
            to_id: friendId
          });
        } else {
          socket.emit('error', { message: 'User is not online' });
        }
      } catch (error) {
        console.error('Error sending game invitation:', error);
        socket.emit('error', { message: 'Failed to send game invitation' });
      }
    });
    
    // Handle game invitation response
    socket.on('game-invitation-response', async (data: { friendId: number, accept: boolean }) => {
      try {
        const { friendId, accept } = data;
        
        // Notify the inviter of the response
        const inviterSocketId = onlineUsers.get(friendId);
        if (inviterSocketId) {
          io.to(inviterSocketId).emit('game-invitation-response', {
            from_id: userId,
            from_username: username,
            accepted: accept
          });
          
          if (accept) {
            // Create a game room ID
            const roomId = `game_${userId}_${friendId}`;
            
            // Join both users to the game room
            io.sockets.sockets.get(socket.id)?.join(roomId);
            io.sockets.sockets.get(inviterSocketId)?.join(roomId);
            
            // Notify both users about the game start
            io.to(roomId).emit('game-started', {
              room_id: roomId,
              player1_id: friendId,
              player2_id: userId
            });
          }
        }
      } catch (error) {
        console.error('Error responding to game invitation:', error);
        socket.emit('error', { message: 'Failed to respond to game invitation' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${username} (${userId})`);
      
      if (userId) {
        // Remove user from online users
        onlineUsers.delete(userId);
        
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
          console.error('Error updating user status:', error);
        }
      }
    });
  });

  // Helper function to notify friends about status change
  async function notifyFriendsStatusChange(userId: number, status: string) {
    try {
      // Find all friends
      const friendships = await db.models.Friendship.findAll({
        where: {
          [db.sequelize.Op.or]: [
            { user_id: userId },
            { friend_id: userId }
          ],
          status: 'accepted'
        }
      });
      
      // Get user details
      const user = await db.models.User.findByPk(userId, {
        attributes: ['id', 'username', 'avatar_url']
      });
      
      if (!user) return;
      
      // Notify each friend
      for (const friendship of friendships) {
        const friendId = friendship.user_id === userId 
          ? friendship.friend_id 
          : friendship.user_id;
        
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend-status-changed', {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            status: status
          });
        }
      }
    } catch (error) {
      console.error('Error notifying friends about status change:', error);
    }
  }
} 