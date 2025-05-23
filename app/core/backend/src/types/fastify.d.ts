import { FastifyRequest } from 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
  
  interface FastifyRequest {
    sessionUser?: {
      id: number;
      username: string;
    };
  }
} 