import { FastifyInstance } from 'fastify';

export function registerTestRoutes(fastify: FastifyInstance) {
  // Simple test route
  fastify.get('/test', async (request, reply) => {
    return { success: true, message: 'Test route working' };
  });

  // Test route for Google auth
  fastify.get('/test-google-auth', async (request, reply) => {
    return { 
      success: true, 
      message: 'Google auth test route working',
      env: {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL
      }
    };
  });
} 