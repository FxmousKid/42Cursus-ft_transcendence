import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

interface QueryWithCode {
  code: string;
}

// Helper function to redirect to frontend with error
const redirectWithError = (reply: FastifyReply, reason: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return reply.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=${reason}`);
};

export function registerGoogleAuthRoutes(fastify: FastifyInstance) {
  // Simple test route to verify Google auth is accessible
  fastify.get('/auth/google/test', async (request, reply) => {
    return {
      success: true,
      message: 'Google auth endpoint is working',
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL
      }
    };
  });

  // Google OAuth callback route
  fastify.get<{ Querystring: QueryWithCode }>('/auth/google/callback', async (request, reply) => {
    try {
      const { code } = request.query;
      
      if (!code) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Authorization code is missing' 
        });
      }
      
      // Exchange authorization code for tokens
      try {
        const tokenResult = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        
        // Make sure we have an access token
        if (!tokenResult?.token?.access_token) {
          fastify.log.error('Missing access token in OAuth response');
          return redirectWithError(reply, 'missing_token');
        }
        
        const accessToken = tokenResult.token.access_token;
        
        // Fetch user info from Google using axios
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000
        });
        
        const googleUser = userInfoResponse.data as GoogleUserInfo;
        
        if (!googleUser?.email) {
          fastify.log.error('Missing email in Google user info');
          return redirectWithError(reply, 'missing_email');
        }
        
        // Check if user already exists in our database
        let user = await fastify.db.models.User.findOne({ 
          where: { email: googleUser.email }
        });
        
        try {
          if (!user) {
            // Create a new user
            user = await fastify.db.models.User.create({
              email: googleUser.email,
              username: googleUser.name || `user_${Date.now()}`,
              google_id: googleUser.sub,
              avatar_url: googleUser.picture,
              status: 'online'
            });
            fastify.log.info(`Created new user from Google auth: ${user.username}`);
          } else if (!user.google_id) {
            // Link existing account with Google
            user.google_id = googleUser.sub;
            
            // Update avatar if user doesn't have one
            if (!user.avatar_url && googleUser.picture) {
              user.avatar_url = googleUser.picture;
            }
            
            // Update user status
            user.status = 'online';
            await user.save();
            fastify.log.info(`Linked existing user with Google: ${user.username}`);
          } else {
            // Set user as online
            user.status = 'online';
            await user.save();
          }
        } catch (dbError) {
          fastify.log.error('Database error:', dbError);
          return redirectWithError(reply, 'database_error');
        }
        
        try {
          // Generate JWT token for the user
          const token = fastify.generateToken({ 
            id: user.id, 
            username: user.username 
          });
          
          // Redirect to frontend with token
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          return reply.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
        } catch (tokenError) {
          fastify.log.error('Token generation error:', tokenError);
          return redirectWithError(reply, 'token_error');
        }
      } catch (oauthError) {
        fastify.log.error('OAuth token exchange error:', oauthError);
        return redirectWithError(reply, 'oauth_error');
      }
    } catch (error) {
      fastify.log.error('Google auth error:', error);
      return redirectWithError(reply, 'general_error');
    }
  });
} 