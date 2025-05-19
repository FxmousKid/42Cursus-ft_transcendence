import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export function registerAuthRoutes(fastify: FastifyInstance) {
  // User registration
  fastify.post<{ Body: RegisterBody }>('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        201: {
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
    handler: async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      try {
        const { username, email, password } = request.body;

        // Check if user already exists with same email or username
        const existingUser = await fastify.db.models.User.findOne({
          where: {
            [Op.or]: [
              { email },
              { username }
            ]
          }
        });

        if (existingUser) {
          // Provide more specific error message
          const field = existingUser.email === email ? 'email' : 'username';
          return reply.status(400).send({ 
            success: false, 
            message: `User with this ${field} already exists` 
          });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = await fastify.db.models.User.create({
          username,
          email,
          password: hashedPassword,
          status: 'online'
        });

        // Generate JWT token
        const token = fastify.generateToken({ 
          id: newUser.id, 
          username: newUser.username 
        });

        // Return user info and token
        return reply.status(201).send({
          success: true,
          data: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            token
          }
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ 
          success: false, 
          message: error.message 
        });
      }
    }
  });

  // User login
  fastify.post<{ Body: LoginBody }>('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
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
    handler: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      try {
        const { email, password } = request.body;

        // Find user by email
        const user = await fastify.db.models.User.findOne({
          where: { email }
        });

        if (!user) {
          return reply.status(401).send({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return reply.status(401).send({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Update user status to online
        user.status = 'online';
        await user.save();

        // Generate JWT token
        const token = fastify.generateToken({ 
          id: user.id, 
          username: user.username 
        });

        // Return user info and token
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

  // Logout
  fastify.post('/auth/logout', {
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
        // Update user status to offline
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (user) {
          user.status = 'offline';
          await user.save();
        }

        return { 
          success: true, 
          message: 'Logged out successfully' 
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