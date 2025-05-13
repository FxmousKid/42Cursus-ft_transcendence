import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        this.logger.warn('No token provided in WebSocket connection');
        client.disconnect();
        return;
      }

      // Log token information (première partie seulement pour la sécurité)
      const tokenParts = token.split('.');
      this.logger.debug(`Token header: ${tokenParts[0]}`);
      
      // Log la clé JWT utilisée (masquée pour la sécurité)
      const jwtSecret = this.configService.get('JWT_SECRET');
      this.logger.debug(`JWT Secret being used (first 4 chars): ${jwtSecret?.substring(0, 4)}...`);
      
      try {
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;

        this.userSocketMap.set(userId, client.id);
        this.socketUserMap.set(client.id, userId);

        this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
      } catch (jwtError) {
        // Analyse avancée de l'erreur JWT
        this.logger.error(`JWT verification error: ${jwtError.message}`);
        if (jwtError.name === 'JsonWebTokenError' && jwtError.message === 'invalid signature') {
          this.logger.error('Token signature invalid - check if JWT_SECRET values match between token generation and verification');
        }
        throw jwtError;
      }
    } catch (error) {
      this.logger.error(`WebSocket connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id}, User ID: ${userId}`);
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

  // Méthode pour notifier l'acceptation d'une demande d'ami | Quand B accepte la demande d'ami de A
  notifyFriendRequestAccepted(toUserId: number, acceptedBy: any) {
    const socketId = this.userSocketMap.get(toUserId); // Récupérer l'ID du socket de B
    if (socketId) {
      this.server.to(socketId).emit('friendRequestAccepted', {
        type: 'friendRequestAccepted',
        friend: {
          id: acceptedBy.id,
          username: acceptedBy.username,
        },
      }); // Envoyer la notification à B
    }
  }
} 