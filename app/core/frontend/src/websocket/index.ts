import { Socket } from 'socket.io-client';
import { FastifyInstance } from 'fastify';

interface User {
  id: number;
  username: string;
  email: string;
  status: string;
  avatar_url?: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: 'text' | 'game_invite' | 'tournament_notification';
  read: boolean;
  createdAt: Date;
}

interface UserBlock {
  id: number;
  blocker_id: number;
  blocked_id: number;
  createdAt: Date;
}

interface FastifyInstanceWithDB extends FastifyInstance {
  db: {
    models: {
      User: any;
      ChatMessage: any;
      UserBlock: any;
    };
  };
}

interface UserSocket extends Socket {
  userId?: number;
  username?: string;
}

interface ChatMessageData {
  id?: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: 'text' | 'game_invite' | 'tournament_notification';
  read: boolean;
  createdAt?: Date;
}

export function setupWebSocket(io: any, fastify: FastifyInstanceWithDB) {
  const connectedUsers = new Map<number, UserSocket>();

  io.on('connection', (socket: UserSocket) => {
    console.log('Client connected');

    socket.on('authenticate', async (userId: number) => {
      try {
        const user = await fastify.db.models.User.findByPk(userId);
        if (user) {
          socket.userId = userId;
          socket.username = user.username;
          connectedUsers.set(userId, socket);
          console.log(`User ${userId} authenticated`);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    });

    socket.on('sendMessage', async (data: ChatMessageData) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Vérifier si l'utilisateur est bloqué
        const isBlocked = await fastify.db.models.UserBlock.findOne({
          where: {
            blocker_id: data.receiver_id,
            blocked_id: socket.userId
          }
        });

        if (isBlocked) {
          socket.emit('error', { message: 'You are blocked by this user' });
          return;
        }

        const message = await fastify.db.models.ChatMessage.create({
          sender_id: socket.userId,
          receiver_id: data.receiver_id,
          content: data.content,
          type: data.type,
          read: false
        });

        // Envoyer au destinataire s'il est connecté
        const receiverSocket = connectedUsers.get(data.receiver_id);
        if (receiverSocket) {
          receiverSocket.emit('chatMessage', {
            id: message.id,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            content: message.content,
            type: message.type,
            read: message.read,
            createdAt: message.createdAt
          });
        }

        // Confirmer l'envoi à l'expéditeur
        socket.emit('messageSent', {
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          type: message.type,
          read: message.read,
          createdAt: message.createdAt
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markAsRead', async (messageId: number) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const message = await fastify.db.models.ChatMessage.findByPk(messageId);
        if (message && message.receiver_id === socket.userId) {
          await message.update({ read: true });

          // Notifier l'expéditeur que le message a été lu
          const senderSocket = connectedUsers.get(message.sender_id);
          if (senderSocket) {
            senderSocket.emit('messageRead', {
              id: message.id,
              sender_id: message.sender_id,
              receiver_id: message.receiver_id,
              content: message.content,
              type: message.type,
              read: true,
              createdAt: message.createdAt
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('sendGameInvite', async (data: { receiver_id: number, game_id?: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const message = await fastify.db.models.ChatMessage.create({
          sender_id: socket.userId,
          receiver_id: data.receiver_id,
          content: JSON.stringify({ game_id: data.game_id }),
          type: 'game_invite',
          read: false
        });

        const receiverSocket = connectedUsers.get(data.receiver_id);
        if (receiverSocket) {
          receiverSocket.emit('gameInvite', {
            id: message.id,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            content: message.content,
            type: message.type,
            read: message.read,
            createdAt: message.createdAt
          });
        }
      } catch (error) {
        console.error('Error sending game invite:', error);
      }
    });

    socket.on('sendTournamentNotification', async (data: { receiver_id: number, tournament_id: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const notification = await fastify.db.models.ChatMessage.create({
          sender_id: socket.userId,
          receiver_id: data.receiver_id,
          content: JSON.stringify({ tournament_id: data.tournament_id }),
          type: 'tournament_notification',
          read: false
        });

        const receiverSocket = connectedUsers.get(data.receiver_id);
        if (receiverSocket) {
          receiverSocket.emit('tournamentNotification', {
            id: notification.id,
            sender_id: notification.sender_id,
            receiver_id: notification.receiver_id,
            content: notification.content,
            type: notification.type,
            read: notification.read,
            createdAt: notification.createdAt
          });
        }
      } catch (error) {
        console.error('Error sending tournament notification:', error);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log('Client disconnected');
    });
  });
} 