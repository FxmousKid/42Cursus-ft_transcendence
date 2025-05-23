import fp from 'fastify-plugin';
import oauth2 from '@fastify/oauth2';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
<<<<<<< HEAD
import { FastifyRequest } from 'fastify';
=======
>>>>>>> google-sign-in

// Explicitly load environment variables
dotenv.config();

// Define environment variables needed for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

// Ensure session secret is at least 32 characters
const SESSION_SECRET = process.env.SESSION_SECRET || 'this_is_a_default_secret_that_is_at_least_32_chars_long_for_session_security';

// In-memory state store for simplicity (in production you'd use Redis or another store)
const stateStore = new Map<string, { createdAt: number }>();

// Ensure we have required credentials
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials are not set. Google authentication will not work properly.');
}

export const configureGoogleOAuthPlugin = fp(async (fastify, options) => {
  // Register cookie plugin
  await fastify.register(cookie);
  
  // Register session plugin
  await fastify.register(session, {
    cookieName: 'session',
    secret: SESSION_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  });
  
  // Register OAuth2 plugin for Google
  await fastify.register(oauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: GOOGLE_CLIENT_ID,
        secret: GOOGLE_CLIENT_SECRET
      },
      auth: oauth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/auth/google',
    callbackUri: GOOGLE_CALLBACK_URL,
    // Using simple in-memory state store instead of session
    generateStateFunction: (request: FastifyRequest) => {
      const state = crypto.randomBytes(20).toString('hex');
      stateStore.set(state, { createdAt: Date.now() });
      
      // Clean up old states (older than 10 minutes)
      const now = Date.now();
      for (const [key, value] of stateStore.entries()) {
        if (now - value.createdAt > 10 * 60 * 1000) {
          stateStore.delete(key);
        }
      }
      
      return state;
    },
    checkStateFunction: (request: FastifyRequest, callback: (error: Error | null, result: boolean) => void) => {
      // @ts-ignore - We know it's there
      const state = request.query.state;
      
      if (!state || !stateStore.has(state)) {
        return callback(new Error('Invalid state'), false);
      }
      
      // Clean up used state
      stateStore.delete(state);
      return callback(null, true);
    }
  });
  
  // Add a session user decorator to the request object
  fastify.decorateRequest('sessionUser', null);
}); 