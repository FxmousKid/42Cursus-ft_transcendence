import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Op } from 'sequelize';
import { ChatMessage } from '../models/chat_message.model';
import { UserBlock } from '../models/user_block.model';
import { Tournament } from '../models/tournament.model';
import { MatchTournament } from '../models/match_tournament.model';
import { User } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import * as jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize-typescript';
import { Match } from '../models/match.model';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Map of userId -> socketId
const onlineUsers = new Map<number, string>();

// Map of socketId -> userId
const socketUserMap = new Map<string, number>();

interface UserSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  userId?: number;
  username?: string;
}

interface ChatMessageData {
  receiver_id: number;
  content: string;
  type?: 'text' | 'game_invite' | 'tournament_notification';
}

interface DB {
  sequelize: Sequelize;
  models: {
    User: typeof User;
    Friendship: typeof Friendship;
    Tournament: typeof Tournament;
    MatchTournament: typeof MatchTournament;
    Match: typeof Match;
    ChatMessage: typeof ChatMessage;
    UserBlock: typeof UserBlock;
  };
  Sequelize?: typeof Sequelize;
}

async function isUserBlocked(db: DB, userId: number, otherUserId: number): Promise<boolean> {
  const block = await db.models.UserBlock.findOne({
    where: {
      [Op.or]: [
        { blocker_id: userId, blocked_id: otherUserId },
        { blocker_id: otherUserId, blocked_id: userId }
      ]
    }
  });
  return !!block;
}

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
    
    // Also add support for searching by username
    socket.on('friend-request-by-username', async (data: { username: string }) => {
      try {
        console.log('[WebSocket] Friend request by username received:', data);
        const { username } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        // Find the user by username
        const friend = await db.models.User.findOne({
          where: { username: username }
        });
        
        if (!friend) {
          socket.emit('error', { type: 'error', message: 'Username not found' });
          return;
        }
        
        const friendId = friend.id;
        
        if (userId === friendId) {
          socket.emit('error', { type: 'error', message: 'Cannot send friend request to yourself' });
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
        console.error('[WebSocket] Error sending friend request by username:', error);
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
    
    // Handle user blocking
    socket.on('user-block', async (data: { blockedUserId: number }) => {
      try {
        console.log('[WebSocket] User block request received:', data);
        const { blockedUserId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        if (userId === blockedUserId) {
          socket.emit('error', { type: 'error', message: 'Cannot block yourself' });
          return;
        }
        
        // Check if user exists
        const userToBlock = await db.models.User.findByPk(blockedUserId);
        if (!userToBlock) {
          socket.emit('error', { type: 'error', message: 'User not found' });
          return;
        }
        
        // Create or find existing block
        const [block, created] = await db.models.UserBlock.findOrCreate({
          where: {
            blocker_id: userId,
            blocked_id: blockedUserId
          }
        });
        
        if (created) {
          console.log(`[WebSocket] User ${userId} blocked user ${blockedUserId}`);
          
          // Get blocker user info
          const blockerUser = await db.models.User.findByPk(userId);
          if (!blockerUser) {
            throw new Error('Blocker user not found');
          }
          
          // Notify the blocked user if they're online (no message, just status update)
          const blockedUserSocketId = onlineUsers.get(blockedUserId);
          if (blockedUserSocketId) {
            io.to(blockedUserSocketId).emit('user-blocked-by', {
              type: 'user-blocked-by',
              blocker_id: userId,
              blocker_username: blockerUser.username
            });
          }
          
          // Confirm block to the blocker (no message)
          socket.emit('user-block-success', {
            type: 'user-block-success',
            blocked_id: blockedUserId,
            blocked_username: userToBlock.username
          });
        } else {
          // User was already blocked
          socket.emit('user-block-success', {
            type: 'user-block-success',
            blocked_id: blockedUserId,
            blocked_username: userToBlock.username
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error blocking user:', error);
        socket.emit('error', { type: 'error', message: 'Failed to block user: ' + error.message });
      }
    });

    // Handle user unblocking
    socket.on('user-unblock', async (data: { unblockedUserId: number }) => {
      try {
        console.log('[WebSocket] User unblock request received:', data);
        const { unblockedUserId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }
        
        // Find the block
        const block = await db.models.UserBlock.findOne({
          where: {
            blocker_id: userId,
            blocked_id: unblockedUserId
          }
        });
        
        if (!block) {
          socket.emit('error', { type: 'error', message: 'Block not found' });
          return;
        }
        
        // Get user info before removing block
        const unblockedUser = await db.models.User.findByPk(unblockedUserId);
        const unblockerUser = await db.models.User.findByPk(userId);
        
        if (!unblockedUser || !unblockerUser) {
          socket.emit('error', { type: 'error', message: 'User not found' });
          return;
        }
        
        // Remove the block
        await block.destroy();
        
        console.log(`[WebSocket] User ${userId} unblocked user ${unblockedUserId}`);
        
        // Notify the unblocked user if they're online (no message, just status update)
        const unblockedUserSocketId = onlineUsers.get(unblockedUserId);
        if (unblockedUserSocketId) {
          io.to(unblockedUserSocketId).emit('user-unblocked-by', {
            type: 'user-unblocked-by',
            unblocker_id: userId,
            unblocker_username: unblockerUser.username
          });
        }
        
        // Confirm unblock to the unblocker (no message)
        socket.emit('user-unblock-success', {
          type: 'user-unblock-success',
          unblocked_id: unblockedUserId,
          unblocked_username: unblockedUser.username
        });
      } catch (error) {
        console.error('[WebSocket] Error unblocking user:', error);
        socket.emit('error', { type: 'error', message: 'Failed to unblock user: ' + error.message });
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

    socket.on('chat-message', async (data: ChatMessageData) => {
      try {
        const { receiver_id, content, type = 'text' } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Check if either user has blocked the other
        const isBlocked = await isUserBlocked(db, userId, receiver_id);
        if (isBlocked) {
          socket.emit('error', { type: 'error', message: 'Cannot send message due to user block' });
          return;
        }

        // Create and save the message
        const message = await db.models.ChatMessage.create({
          sender_id: userId,
          receiver_id,
          content,
          type,
          read: false
        });

        // Send the message to the receiver if they're online
        const receiverSocketId = onlineUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('chat-message-received', {
            id: message.id,
            sender_id: userId,
            content,
            type,
            created_at: message.createdAt
          });
        }

        // Confirm message sent to sender
        socket.emit('chat-message-sent', {
          id: message.id,
          receiver_id,
          content,
          type,
          created_at: message.createdAt
        });
      } catch (error) {
        console.error('[WebSocket] Error sending chat message:', error);
        socket.emit('error', { type: 'error', message: 'Failed to send message: ' + error.message });
      }
    });

    socket.on('game-invite', async (data: { friendId: number }) => {
      try {
        const { friendId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Check if either user has blocked the other
        const isBlocked = await isUserBlocked(db, userId, friendId);
        if (isBlocked) {
          socket.emit('error', { type: 'error', message: 'Cannot send game invitation due to user block' });
          return;
        }

        // Create game invitation message
        const message = await db.models.ChatMessage.create({
          sender_id: userId,
          receiver_id: friendId,
          content: 'Game invitation',
          type: 'game_invite',
          read: false,
          status: 'pending'
        });

        // Send invitation to friend if online
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('game-invite-received', {
            id: message.id,
            sender_id: userId,
            created_at: message.createdAt
          });
        }

        // Confirm invitation sent to sender
        socket.emit('game-invite-sent', {
          id: message.id,
          receiver_id: friendId,
          created_at: message.createdAt
        });
      } catch (error) {
        console.error('[WebSocket] Error sending game invitation:', error);
        socket.emit('error', { type: 'error', message: 'Failed to send game invitation: ' + error.message });
      }
    });

    socket.on('game-invite-accept', async (data: { inviteId: number }) => {
      try {
        const { inviteId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Update invitation status
        const invitation = await db.models.ChatMessage.findByPk(inviteId);
        if (!invitation || invitation.type !== 'game_invite') {
          socket.emit('error', { type: 'error', message: 'Invitation not found' });
          return;
        }

        // Verify the user is the receiver
        if (invitation.receiver_id !== userId) {
          socket.emit('error', { type: 'error', message: 'Not authorized to accept this invitation' });
          return;
        }

        // Update status
        await invitation.update({ status: 'accepted' });

        // Notify sender if online
        const senderSocketId = onlineUsers.get(invitation.sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit('game-invite-accepted', {
            id: invitation.id,
            acceptedBy: userId,
            created_at: invitation.createdAt
          });
        }

        // Confirm to accepter
        socket.emit('game-invite-accept-confirmed', {
          id: invitation.id,
          status: 'accepted'
        });
      } catch (error) {
        console.error('[WebSocket] Error accepting game invitation:', error);
        socket.emit('error', { type: 'error', message: 'Failed to accept invitation: ' + error.message });
      }
    });

    socket.on('game-invite-reject', async (data: { inviteId: number }) => {
      try {
        const { inviteId } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Update invitation status
        const invitation = await db.models.ChatMessage.findByPk(inviteId);
        if (!invitation || invitation.type !== 'game_invite') {
          socket.emit('error', { type: 'error', message: 'Invitation not found' });
          return;
        }

        // Verify the user is the receiver
        if (invitation.receiver_id !== userId) {
          socket.emit('error', { type: 'error', message: 'Not authorized to reject this invitation' });
          return;
        }

        // Update status
        await invitation.update({ status: 'rejected' });

        // Notify sender if online
        const senderSocketId = onlineUsers.get(invitation.sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit('game-invite-rejected', {
            id: invitation.id,
            rejectedBy: userId,
            created_at: invitation.createdAt
          });
        }

        // Confirm to rejector
        socket.emit('game-invite-reject-confirmed', {
          id: invitation.id,
          status: 'rejected'
        });
      } catch (error) {
        console.error('[WebSocket] Error rejecting game invitation:', error);
        socket.emit('error', { type: 'error', message: 'Failed to reject invitation: ' + error.message });
      }
    });

    // Add tournament notification handler
    socket.on('tournament-notification', async (data: { user_ids: number[], message: string }) => {
      try {
        const { user_ids, message } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Send notification to each user
        for (const receiverId of user_ids) {
          // Skip if user has blocked or is blocked
          const isBlocked = await isUserBlocked(db, userId, receiverId);
          if (isBlocked) continue;

          // Create notification message
          const notification = await db.models.ChatMessage.create({
            sender_id: userId,
            receiver_id: receiverId,
            content: message,
            type: 'tournament_notification',
            read: false
          });

          // Send to user if online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('tournament-notification-received', {
              id: notification.id,
              sender_id: userId,
              content: message,
              created_at: notification.createdAt
            });
          }
        }

        socket.emit('tournament-notifications-sent', {
          success: true,
          message: 'Tournament notifications sent successfully'
        });
      } catch (error) {
        console.error('[WebSocket] Error sending tournament notifications:', error);
        socket.emit('error', { type: 'error', message: 'Failed to send tournament notifications: ' + error.message });
      }
    });

    // Add message read receipt handler
    socket.on('mark-messages-read', async (data: { sender_id: number }) => {
      try {
        const { sender_id } = data;
        
        if (!userId) {
          socket.emit('error', { type: 'error', message: 'You are not authenticated' });
          return;
        }

        // Mark messages as read
        await db.models.ChatMessage.update(
          { read: true },
          {
            where: {
              sender_id,
              receiver_id: userId,
              read: false
            }
          }
        );

        // Notify sender that messages were read if they're online
        const senderSocketId = onlineUsers.get(sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages-read', {
            reader_id: userId
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error marking messages as read:', error);
        socket.emit('error', { type: 'error', message: 'Failed to mark messages as read: ' + error.message });
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
