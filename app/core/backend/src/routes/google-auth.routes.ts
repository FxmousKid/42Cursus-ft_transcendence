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
        console.log('Starting OAuth token exchange with code:', code.substring(0, 10) + '...');
        
        const tokenResult = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        
        // Make sure we have an access token
        if (!tokenResult || !tokenResult.token || !tokenResult.token.access_token) {
          fastify.log.error('Missing access token in OAuth response', tokenResult);
          return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=missing_token`);
        }
        
        console.log('Successfully obtained access token');
        const accessToken = tokenResult.token.access_token;
        
        // Fetch user info from Google using axios instead of node-fetch
        console.log('Fetching user info from Google API');
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000 // Add timeout
        });
        
        const googleUser = userInfoResponse.data as GoogleUserInfo;
        console.log('Google user info retrieved:', JSON.stringify(googleUser, null, 2));
        
        if (!googleUser || !googleUser.email) {
          fastify.log.error('Missing email in Google user info', googleUser);
          return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=missing_email`);
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
            fastify.log.info(`Google user logged in: ${user.username}`);
          }
        } catch (dbError) {
          console.error('Database error during user creation/update:', dbError);
          return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=database_error`);
        }
        
        try {
          // Generate JWT token for the user
          const token = fastify.generateToken({ 
            id: user.id, 
            username: user.username 
          });
          
          // Redirect to frontend with token
          const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?token=${token}`;
          console.log('Redirecting to:', redirectUrl);
          return reply.redirect(redirectUrl);
        } catch (tokenError) {
          console.error('Token generation error:', tokenError);
          return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=token_error`);
        }
      } catch (oauthError) {
        console.error('OAuth token exchange detailed error:', oauthError);
        fastify.log.error('OAuth token exchange error details:', oauthError);
        return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=oauth_error`);
      }
    } catch (error) {
      fastify.log.error('Google auth error:', error);
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed&reason=general_error`);
    }
  });
} 