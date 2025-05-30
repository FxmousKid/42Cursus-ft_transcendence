import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

interface Enable2FABody {
  code: string;
}

interface Verify2FABody {
  code: string;
}

export function registerTwoFactorRoutes(fastify: FastifyInstance) {
  // Generate 2FA setup
  fastify.get('/auth/2fa/setup', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                secret: { type: 'string' },
                qrCode: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ 
            success: false, 
            message: 'User not found' 
          });
        }

        // Generate a new secret
        const secret = authenticator.generateSecret();
        
        // Store the temporary secret
        user.two_factor_temp_secret = secret;
        await user.save();

        // Generate QR code
        const otpauth = authenticator.keyuri(
          user.email,
          '42Transcendence',
          secret
        );
        
        const qrCode = await QRCode.toDataURL(otpauth);

        return {
          success: true,
          data: {
            secret,
            qrCode
          }
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ 
          success: false, 
          message: error.message 
        });
      }
    }
  });

  // Enable 2FA
  fastify.post<{ Body: Enable2FABody }>('/auth/2fa/enable', {
    schema: {
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: Enable2FABody }>, reply: FastifyReply) => {
      try {
        const { code } = request.body;
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ 
            success: false, 
            message: 'User not found' 
          });
        }

        if (!user.two_factor_temp_secret) {
          return reply.status(400).send({ 
            success: false, 
            message: 'No temporary secret found. Please generate a new setup first.' 
          });
        }

        // Verify the code
        const isValid = authenticator.verify({
          token: code,
          secret: user.two_factor_temp_secret
        });

        if (!isValid) {
          return reply.status(400).send({ 
            success: false, 
            message: 'Invalid verification code' 
          });
        }

        // Enable 2FA and store the secret
        user.two_factor_enabled = true;
        user.two_factor_secret = user.two_factor_temp_secret;
        user.two_factor_temp_secret = null;
        await user.save();

        return {
          success: true,
          message: '2FA enabled successfully'
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ 
          success: false, 
          message: error.message 
        });
      }
    }
  });

  // Disable 2FA
  fastify.post<{ Body: {userID: number} }>('/auth/2fa/disable', {
    schema: {
      body: {
        type: 'object',
        required: ['userID'],
        properties: {
          userID: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: {userID: number} }>, reply: FastifyReply) => {
      try {
        const { userID } = request.body;
        const user = await fastify.db.models.User.findByPk(userID);
        
        if (!user) {
          return reply.status(404).send({ 
            success: false, 
            message: 'User not found' 
          });
        }

        if (!user.two_factor_enabled || !user.two_factor_secret) {
          return reply.status(400).send({ 
            success: false, 
            message: '2FA is not enabled' 
          });
        }

        // Disable 2FA
        user.two_factor_enabled = false;
        user.two_factor_secret = null;
        await user.save();

        return {
          success: true,
          message: '2FA disabled successfully'
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ 
          success: false, 
          message: error.message 
        });
      }
    }
  });

  // Verify 2FA code during login
  fastify.post<{ Body: { userId: number; code: string } }>('/auth/2fa/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'code'],
        properties: {
          userId: { type: 'number' },
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                username: { type: 'string' },
                email: { type: 'string' },
                token: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: { userId: number; code: string } }>, reply: FastifyReply) => {
      try {
        const { userId, code } = request.body;
        const user = await fastify.db.models.User.findByPk(userId);
        
        if (!user) {
          return reply.status(404).send({ 
            success: false, 
            message: 'User not found' 
          });
        }

        if (!user.two_factor_enabled || !user.two_factor_secret) {
          return reply.status(400).send({ 
            success: false, 
            message: '2FA is not enabled' 
          });
        }

        // Verify the code
        const isValid = authenticator.verify({
          token: code,
          secret: user.two_factor_secret
        });

        if (!isValid) {
          return reply.status(400).send({ 
            success: false, 
            message: 'Invalid verification code' 
          });
        }

        // Generate JWT token
        const token = fastify.generateToken({ 
          id: user.id, 
          username: user.username 
        });

        // Update user status to online
        user.status = 'online';
        await user.save();

        return {
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token
          }
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ 
          success: false, 
          message: error.message 
        });
      }
    }
  });
} 
