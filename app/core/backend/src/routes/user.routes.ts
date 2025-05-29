import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { Op } from 'sequelize';

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

  // Get user matches
  fastify.get('/users/matches', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.id;
        
        // Query matches where the user is either player1 or player2
        const matches = await fastify.db.models.Match.findAll({
          where: {
            [Op.or]: [
              { player1_id: userId },
              { player2_id: userId }
            ]
          },
          include: [
            { 
              model: fastify.db.models.User, 
              as: 'player1',
              attributes: ['username']
            },
            { 
              model: fastify.db.models.User, 
              as: 'player2',
              attributes: ['username']
            }
          ],
          order: [['created_at', 'DESC']]
        });
        
        // Transform matches to include player usernames
        const transformedMatches = matches.map((match: any) => {
          const m = match.toJSON();
          return {
            id: m.id,
            player1_id: m.player1_id,
            player2_id: m.player2_id,
            player1_score: m.player1_score,
            player2_score: m.player2_score,
            player1_username: m.player1?.username || 'Unknown',
            player2_username: m.player2?.username || 'Unknown',
            winner_id: m.winner_id,
            status: m.status,
            created_at: m.created_at,
            updated_at: m.updated_at
          };
        });
        
        return { success: true, data: transformedMatches };
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

  // Search users by username
  fastify.get('/users/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 1 }
        }
      },
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
    handler: async (request: FastifyRequest<{ Querystring: { username: string } }>, reply: FastifyReply) => {
      try {
        const { username } = request.query;
        const currentUserId = request.user!.id;
        
        if (!username || username.trim() === '') {
          return { success: true, data: [] };
        }
        
        // Exact match first
        const exactMatch = await fastify.db.models.User.findOne({
          where: {
            username: username,
            id: {
              [Op.ne]: currentUserId // Exclude the current user
            }
          },
          attributes: ['id', 'username', 'email', 'status', 'avatar_url']
        });
        
        // Then similar usernames
        const similarUsers = await fastify.db.models.User.findAll({
          where: {
            username: {
              [Op.like]: `%${username}%`,
              [Op.ne]: username // Exclude exact match to avoid duplication
            },
            id: {
              [Op.ne]: currentUserId // Exclude the current user
            }
          },
          attributes: ['id', 'username', 'email', 'status', 'avatar_url'],
          limit: 9 // Limit to 9 similar users (total 10 with exact match)
        });
        
        // Combine exact match with similar users, exact match first
        const users = exactMatch ? [exactMatch, ...similarUsers] : similarUsers;
        
        return { success: true, data: users };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get user profile by ID with statistics
  fastify.get<{ Params: { id: string } }>('/users/:id/profile', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                created_at: { type: 'string' },
                statistics: {
                  type: 'object',
                  properties: {
                    games_played: { type: 'number' },
                    wins: { type: 'number' },
                    losses: { type: 'number' },
                    win_rate: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = parseInt(request.params.id);
        
        if (isNaN(userId)) {
          return reply.status(400).send({ success: false, message: 'Invalid user ID' });
        }

        // Get user basic info
        const user = await fastify.db.models.User.findByPk(userId, {
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'createdAt']
        });

        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }

        // Calculate user statistics from matches
        const matches = await fastify.db.models.Match.findAll({
          where: {
            [Op.or]: [
              { player1_id: userId },
              { player2_id: userId }
            ],
            status: 'completed' // Only count completed matches
          }
        });

        let wins = 0;
        let losses = 0;
        const gamesPlayed = matches.length;

        matches.forEach((match: any) => {
          if (match.winner_id === userId) {
            wins++;
          } else if (match.winner_id !== null) {
            // Only count as loss if there's a winner and it's not this user
            losses++;
          }
        });

        const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          avatar_url: user.avatar_url,
          created_at: user.createdAt,
          statistics: {
            games_played: gamesPlayed,
            wins: wins,
            losses: losses,
            win_rate: winRate
          }
        };

        return { success: true, data: userData };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Check if username exists
  fastify.get('/users/check-username', {
    schema: {
      querystring: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            exists: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Querystring: { username: string } }>, reply: FastifyReply) => {
      try {
        const { username } = request.query;
        const currentUserId = request.user!.id;
        
        if (!username || username.trim() === '') {
          return { success: true, exists: false };
        }
        
        // Check if user exists
        const user = await fastify.db.models.User.findOne({
          where: {
            username: username,
            id: {
              [Op.ne]: currentUserId // Exclude the current user
            }
          }
        });
        
        return { 
          success: true, 
          exists: !!user,
          user: user ? {
            id: user.id,
            username: user.username,
            status: user.status,
            avatar_url: user.avatar_url
          } : null
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
} 