import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Server } from 'socket.io';
import { configureRoutes } from './routes';
import { configureDatabasePlugin } from './plugins/database';
import { configureAuthPlugin } from './plugins/auth';
import { configureGoogleOAuthPlugin } from './plugins/google-oauth';
import blockchainPlugin from './plugins/blockchain.plugin';
import { setupWebSocket } from './websocket';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify server instance
const server: FastifyInstance = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024, // 10MB limit for request body size
});

// Setup function
async function setup() {
  try {
    // Register CORS first

	const allowedOrigins =
	process.env.NODE_ENV === 'production'
	? ['https://localhost']
	: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://frontend:5173',
        'http://0.0.0.0:5173',
		'https://localhost',
        true
	  ];
	
    await server.register(cors, {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Access-Control-Allow-Origin'],
    });

    // Register database plugin first (needed by auth and others)
    await server.register(configureDatabasePlugin);

    // Register JWT auth plugin
    await server.register(configureAuthPlugin);
    
    // Register Google OAuth plugin after JWT auth
    await server.register(configureGoogleOAuthPlugin);

    // Register blockchain plugin
    await server.register(blockchainPlugin);

    // Register Swagger documentation
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'Transcendence API',
          description: 'API documentation for the Transcendence application',
          version: '0.1.0',
        },
        tags: [
          { name: 'auth', description: 'Authentication related endpoints' },
          { name: 'users', description: 'User management endpoints' },
          { name: 'friends', description: 'Friend relationship endpoints' },
          { name: 'matches', description: 'Game matches endpoints' },
          { name: 'tournaments', description: 'Tournament in local endpoints' },
          { name: 'match_tournaments', description: 'Match in the Tournaments endpoints' }
        ],
      },
    });

    await server.register(swaggerUI, {
      routePrefix: '/api-docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      }
    });

    // Configure routes
    configureRoutes(server);

    // Start server
    const address = await server.listen({ port: Number(PORT), host: HOST });
    server.log.info(`Server listening at ${address}`);

    // Setup Socket.IO
    const io = new Server(server.server, {
      cors: {
		origin:
			process.env.NODE_ENV === 'production'
			? ['https://localhost']
			: [
				'http://localhost:5173',
				'https://localhost',
            	'http://127.0.0.1:5173',
            	'http://frontend:5173',
            	true,
			],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Initialize WebSocket handling
    setupWebSocket(io, server.db);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`${signal} signal received, shutting down...`);
    await server.close();
    process.exit(0);
  });
});

// Run the application
setup(); 
