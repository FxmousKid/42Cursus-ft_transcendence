import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',  // Local development
      'http://localhost:3000',  // Alternative local port
      'http://frontend:5173',   // Docker container name
      'http://127.0.0.1:5173',  // Docker host
    ],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<number, string> = new Map();
  private socketUserMap: Map<string, number> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);

      console.log(`Client connected: ${client.id}, User ID: ${userId}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      console.log(`Client disconnected: ${client.id}, User ID: ${userId}`);
    }
  }

  // Méthode pour envoyer une notification de demande d'ami
  notifyFriendRequest(toUserId: number, fromUser: any) {
    const socketId = this.userSocketMap.get(toUserId);
    if (socketId) {
      this.server.to(socketId).emit('friendRequest', {
        type: 'newFriendRequest',
        from: {
          id: fromUser.id,
          username: fromUser.username,
        },
      });
    }
  }

  // Méthode pour notifier l'acceptation d'une demande d'ami
  notifyFriendRequestAccepted(toUserId: number, acceptedBy: any) {
    const socketId = this.userSocketMap.get(toUserId);
    if (socketId) {
      this.server.to(socketId).emit('friendRequestAccepted', {
        type: 'friendRequestAccepted',
        friend: {
          id: acceptedBy.id,
          username: acceptedBy.username,
        },
      });
    }
  }
} 