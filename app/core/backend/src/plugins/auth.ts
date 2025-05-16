import fp from 'fastify-plugin';
import * as jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Define the custom request interface with user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      username: string;
    };
  }
  
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateToken: (payload: any) => string;
    verifyToken: (token: string) => any;
  }
}

// Auth plugin that adds JWT capabilities to Fastify
export const configureAuthPlugin = fp(async (fastify, options) => {
  // Generate JWT token
  const generateToken = (payload: any): string => {
    return jwt.sign(payload, JWT_SECRET);
  };

  // Verify JWT token
  const verifyToken = (token: string): any => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  // Authentication middleware
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader) {
        reply.status(401).send({ message: 'Authentication required' });
        return;
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        reply.status(401).send({ message: 'Bearer token missing' });
        return;
      }

      const decoded = verifyToken(token);
      request.user = {
        id: decoded.id,
        username: decoded.username
      };
    } catch (error) {
      reply.status(401).send({ message: 'Invalid or expired token' });
    }
  };

  // Add authentication utilities to Fastify instance
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('verifyToken', verifyToken);
}); 