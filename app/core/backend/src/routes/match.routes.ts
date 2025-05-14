import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Match } from '../models/match.model';

interface CreateMatchBody {
  player2_id: number;
}

interface UpdateMatchBody {
  player1_score?: number;
  player2_score?: number;
  winner_id?: number;
  status?: string;
}

interface MatchParams {
  match_id: number;
}

export function registerMatchRoutes(fastify: FastifyInstance) {
  // Get all matches
  fastify.get('/matches', {
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
                  user1_id: { type: 'number' },
                  user2_id: { type: 'number' },
                  user1_score: { type: 'number' },
                  user2_score: { type: 'number' },
                  status: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
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
        const matches = await fastify.db.models.Match.findAll({
          order: [['created_at', 'DESC']]
        });
        return { success: true, data: matches };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get user matches
  fastify.get('/matches/user', {
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
                  user1_id: { type: 'number' },
                  user2_id: { type: 'number' },
                  user1_score: { type: 'number' },
                  user2_score: { type: 'number' },
                  status: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
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
        const userId = request.user.id;
        const matches = await fastify.db.models.Match.findAll({
          where: {
            [fastify.db.Sequelize.Op.or]: [
              { user1_id: userId },
              { user2_id: userId }
            ]
          },
          order: [['created_at', 'DESC']]
        });
        return { success: true, data: matches };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get match by ID
  fastify.get('/matches/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
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
                user1_id: { type: 'number' },
                user2_id: { type: 'number' },
                user1_score: { type: 'number' },
                user2_score: { type: 'number' },
                status: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
      try {
        const match = await fastify.db.models.Match.findByPk(request.params.id);
        
        if (!match) {
          return reply.status(404).send({ success: false, message: 'Match not found' });
        }
        
        return { success: true, data: match };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Create a new match
  fastify.post<{
    Body: {
      user1_id: number;
      user2_id: number;
      user1_score?: number;
      user2_score?: number;
      status?: string;
    }
  }>('/matches', {
    schema: {
      body: {
        type: 'object',
        required: ['user1_id', 'user2_id'],
        properties: {
          user1_id: { type: 'number' },
          user2_id: { type: 'number' },
          user1_score: { type: 'number', default: 0 },
          user2_score: { type: 'number', default: 0 },
          status: { type: 'string', default: 'ongoing' }
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
                user1_id: { type: 'number' },
                user2_id: { type: 'number' },
                user1_score: { type: 'number' },
                user2_score: { type: 'number' },
                status: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{
      Body: {
        user1_id: number;
        user2_id: number;
        user1_score?: number;
        user2_score?: number;
        status?: string;
      }
    }>, reply: FastifyReply) => {
      try {
        // Set default values for optional fields
        const matchData = {
          user1_id: request.body.user1_id,
          user2_id: request.body.user2_id,
          user1_score: request.body.user1_score || 0,
          user2_score: request.body.user2_score || 0,
          status: request.body.status || 'ongoing'
        };
        
        const match = await fastify.db.models.Match.create(matchData);
        
        return reply.status(201).send({ success: true, data: match });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Update a match
  fastify.put<{
    Params: { id: number };
    Body: {
      user1_score?: number;
      user2_score?: number;
      status?: string;
    }
  }>('/matches/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          user1_score: { type: 'number' },
          user2_score: { type: 'number' },
          status: { type: 'string', enum: ['ongoing', 'completed', 'cancelled'] }
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
                user1_id: { type: 'number' },
                user2_id: { type: 'number' },
                user1_score: { type: 'number' },
                user2_score: { type: 'number' },
                status: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{
      Params: { id: number };
      Body: {
        user1_score?: number;
        user2_score?: number;
        status?: string;
      }
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updateData = request.body;
        
        const match = await fastify.db.models.Match.findByPk(id);
        
        if (!match) {
          return reply.status(404).send({ success: false, message: 'Match not found' });
        }
        
        // Update only provided fields
        if (updateData.user1_score !== undefined) match.user1_score = updateData.user1_score;
        if (updateData.user2_score !== undefined) match.user2_score = updateData.user2_score;
        if (updateData.status) match.status = updateData.status;
        
        await match.save();
        
        return { success: true, data: match };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Delete a match
  fastify.delete('/matches/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
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
    handler: async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const match = await fastify.db.models.Match.findByPk(id);
        
        if (!match) {
          return reply.status(404).send({ success: false, message: 'Match not found' });
        }
        
        await match.destroy();
        
        return { success: true, message: 'Match deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
} 