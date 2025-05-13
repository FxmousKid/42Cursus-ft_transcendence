import { FastifyInstance } from 'fastify';
import { registerUserRoutes } from './user.routes';
import { registerAuthRoutes } from './auth.routes';
import { registerFriendshipRoutes } from './friendship.routes';
import { registerMatchRoutes } from './match.routes';

export function configureRoutes(server: FastifyInstance) {
  // Health check route
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  registerUserRoutes(server);
  registerAuthRoutes(server);
  registerFriendshipRoutes(server);
  registerMatchRoutes(server);
} 