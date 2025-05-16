import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';

interface UserUpdateBody {
  username?: string;
  email?: string;
  avatar_url?: string;
}

interface StatusUpdateBody {
  status: string;
}

// Define the route handler
export function registerUserRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get('/users', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string' },
                  avatar_url: { type: ['string', 'null'] },
                }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await fastify.db.models.User.findAll({
          attributes: ['id', 'username', 'email', 'status', 'avatar_url']
        });
        return { success: true, data: users };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get online users
  fastify.get('/users/online', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string' },
                  avatar_url: { type: ['string', 'null'] },
                }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await fastify.db.models.User.findAll({
          where: { status: 'online' },
          attributes: ['id', 'username', 'email', 'status', 'avatar_url']
        });
        return { success: true, data: users };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get user profile
  fastify.get('/users/profile', {
    schema: {
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
                status: { type: 'string' },
                avatar_url: { type: ['string', 'null'] },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.user!.id, {
          attributes: ['id', 'username', 'email', 'status', 'avatar_url']
        });
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        
        return { success: true, data: user };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Update user status
  fastify.patch<{ Body: StatusUpdateBody }>('/users/status', {
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['online', 'offline', 'in_game', 'away'] }
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
                status: { type: 'string' },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: StatusUpdateBody }>, reply: FastifyReply) => {
      try {
        const { status } = request.body;
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        
        user.status = status;
        await user.save();
        
        return { 
          success: true, 
          data: { 
            id: user.id,
            username: user.username,
            status: user.status
          } 
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Update user profile
  fastify.put<{ Body: UserUpdateBody }>('/users/profile', {
    schema: {
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          avatar_url: { type: 'string' }
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
                status: { type: 'string' },
                avatar_url: { type: ['string', 'null'] },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: UserUpdateBody }>, reply: FastifyReply) => {
      try {
        const updateData = request.body;
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        
        // Update only provided fields
        if (updateData.username) user.username = updateData.username;
        if (updateData.email) user.email = updateData.email;
        if (updateData.avatar_url) user.avatar_url = updateData.avatar_url;
        
        await user.save();
        
        return { success: true, data: user };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Delete user account
  fastify.delete('/users/profile', {
    schema: {
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
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        
        await user.destroy();
        
        return { success: true, message: 'Account deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
} 