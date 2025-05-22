import { FastifyInstance } from 'fastify';

export function registerTestRoutes(fastify: FastifyInstance) {
  // Simple test route
  fastify.get('/test', async (request, reply) => {
    return { success: true, message: 'Test route working' };
  });
} 