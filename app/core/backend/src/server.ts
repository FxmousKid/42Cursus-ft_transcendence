import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Server } from 'socket.io';
import { configureRoutes } from './routes';
import { configureDatabasePlugin } from './plugins/database';
import { configureAuthPlugin } from './plugins/auth';
import { setupWebSocket } from './websocket';

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
    // Register plugins
    await server.register(cors, {
      origin: [
        'http://localhost:5173',  // Frontend port
        'http://localhost:37505', // Alternative frontend port
        'http://localhost:45477', // Another alternative frontend port
        'http://localhost:35331', // Another alternative frontend port
        'http://localhost:46593', // Another potential port from your logs
        'http://127.0.0.1:5173',  // Using IP instead of localhost
        'http://127.0.0.1:3000',  // In case the frontend is on the same port
        'http://localhost',       // Simple localhost without port
        // Add these new origins
        'http://0.0.0.0:5173',    // Using 0.0.0.0 address
        true,                     // Allow all origins temporarily for debugging
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Access-Control-Allow-Origin'],
    });

    // Swagger documentation
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

    // Register database plugin
    await server.register(configureDatabasePlugin);

    // Register auth plugin
    await server.register(configureAuthPlugin);

    // Configure routes
    configureRoutes(server);

    // Start server
    const address = await server.listen({ port: Number(PORT), host: HOST });
    server.log.info(`Server listening at ${address}`);

    // Setup Socket.IO
    const io = new Server(server.server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://frontend:5173',
          'http://127.0.0.1:5173',
          // Add these new origins
          'http://0.0.0.0:5173',    
          true,                    // Allow all origins temporarily for debugging
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