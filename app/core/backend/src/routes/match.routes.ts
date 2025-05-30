import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Match } from '../models/match.model';
import { Op } from 'sequelize';

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
            const userId = request.user!.id;
            const matches = await fastify.db.models.Match.findAll({
                where: {
                    [Op.or]: [
                        { player1_id: userId },
                        { player2_id: userId }
                    ]
                },
                order: [['createdAt', 'DESC']]  // Changed from 'created_at' to 'createdAt'
            });
            return { success: true, data: matches };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(400).send({ success: false, message: error.message });
        }
    }
  }),

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
      player1_id: number;
      player2_id: number;
      player1_score?: number;
      player2_score?: number;
      status?: string;
    }
  }>('/matches', {
    schema: {
      body: {
        type: 'object',
        required: ['player1_id', 'player2_id'],
        properties: {
          player1_id: { type: 'number' },
          player2_id: { type: 'number' },
          player1_score: { type: 'number', default: 0 },
          player2_score: { type: 'number', default: 0 },
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
                player1_id: { type: 'number' },
                player2_id: { type: 'number' },
                player1_score: { type: 'number' },
                player2_score: { type: 'number' },
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
        player1_id: number;
        player2_id: number;
        player1_score?: number;
        player2_score?: number;
        status?: string;
      }
    }>, reply: FastifyReply) => {
      try {
        // Set default values for optional fields
        const matchData = {
          player1_id: request.body.player1_id,
          player2_id: request.body.player2_id,
          player1_score: request.body.player1_score || 0,
          player2_score: request.body.player2_score || 0,
          status: request.body.status || 'ongoing',
          match_date: new Date()
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
      player1_score?: number;
      player2_score?: number;
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
          player1_score: { type: 'number' },
          player2_score: { type: 'number' },
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
                player1_id: { type: 'number' },
                player2_id: { type: 'number' },
                player1_score: { type: 'number' },
                player2_score: { type: 'number' },
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
        player1_score?: number;
        player2_score?: number;
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
        if (updateData.player1_score !== undefined) match.player1_score = updateData.player1_score;
        if (updateData.player2_score !== undefined) match.player2_score = updateData.player2_score;
        if (updateData.status) match.status = updateData.status;

        if (updateData.player1_score !== undefined && updateData.player2_score !== undefined) match.winner_id = (match.player1_score >= match.player2_score) ? match.player1_id : match.player2_id;
        
        if (updateData.player1_score !== undefined && updateData.player2_score !== undefined) match.winner_id = ( match.player1_score >= match.player2_score ) ? match.player1_id : match.player2_id;


        await match.save();
        
        return { success: true, 
          data: {
            id: match.id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_score: match.player1_score,
            player2_score: match.player2_score,
            status: match.status,
            created_at: match.createdAt,
            updated_at: match.updatedAt,
          } 
        };
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