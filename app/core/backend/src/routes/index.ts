import { FastifyInstance } from 'fastify';
import { registerUserRoutes } from './user.routes';
import { registerAuthRoutes } from './auth.routes';
import { registerFriendshipRoutes } from './friendship.routes';
import { registerMatchRoutes } from './match.routes';
import { registerTournamentRoutes } from './tournament.routes';
import { registerMatchTournamentRoutes } from './match_tournament.routes';
import { registerGoogleAuthRoutes } from './google-auth.routes';
import { registerChatRoutes } from './chat.routes';

import { registerTwoFactorRoutes } from './two-factor.routes';

export function configureRoutes(server: FastifyInstance) {
  // Health check route
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  registerUserRoutes(server);
  registerAuthRoutes(server);
  registerFriendshipRoutes(server);
  registerChatRoutes(server);
  registerMatchRoutes(server);
  registerTournamentRoutes(server);
  registerMatchTournamentRoutes(server);
  registerGoogleAuthRoutes(server);
  registerTwoFactorRoutes(server);
} 