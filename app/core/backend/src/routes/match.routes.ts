import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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
  // Get all matches for the authenticated user
  fastify.get('/api/matches', {
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
                  player1_id: { type: 'number' },
                  player2_id: { type: 'number' },
                  player1_score: { type: 'number' },
                  player2_score: { type: 'number' },
                  winner_id: { type: ['number', 'null'] },
                  status: { type: 'string' },
                  match_date: { type: 'string', format: 'date-time' },
                  player1: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      username: { type: 'string' },
                      avatar_url: { type: ['string', 'null'] }
                    }
                  },
                  player2: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      username: { type: 'string' },
                      avatar_url: { type: ['string', 'null'] }
                    }
                  }
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
        const { Match, User } = fastify.db.models;
        const userId = request.user.id;
        
        // Find all matches where the user is a player
        const matches = await Match.findAll({
          where: {
            [fastify.db.sequelize.Op.or]: [
              { player1_id: userId },
              { player2_id: userId }
            ]
          },
          include: [
            {
              model: User,
              as: 'player1',
              attributes: ['id', 'username', 'avatar_url']
            },
            {
              model: User,
              as: 'player2',
              attributes: ['id', 'username', 'avatar_url']
            }
          ],
          order: [['match_date', 'DESC']]
        });
        
        return { success: true, data: matches };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Create a new match
  fastify.post<{ Body: CreateMatchBody }>('/api/matches', {
    schema: {
      body: {
        type: 'object',
        required: ['player2_id'],
        properties: {
          player2_id: { type: 'number' }
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
                match_date: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: CreateMatchBody }>, reply: FastifyReply) => {
      try {
        const { Match } = fastify.db.models;
        const userId = request.user.id;
        const { player2_id } = request.body;
        
        if (userId === player2_id) {
          return reply.status(400).send({ 
            success: false, 
            message: 'You cannot create a match against yourself' 
          });
        }
        
        // Create new match
        const newMatch = await Match.create({
          player1_id: userId,
          player2_id,
          player1_score: 0,
          player2_score: 0,
          status: 'scheduled',
          match_date: new Date()
        });
        
        return reply.status(201).send({ success: true, data: newMatch });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get match details
  fastify.get<{ Params: MatchParams }>('/api/matches/:match_id', {
    schema: {
      params: {
        type: 'object',
        required: ['match_id'],
        properties: {
          match_id: { type: 'number' }
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
                winner_id: { type: ['number', 'null'] },
                status: { type: 'string' },
                match_date: { type: 'string', format: 'date-time' },
                player1: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    username: { type: 'string' },
                    avatar_url: { type: ['string', 'null'] }
                  }
                },
                player2: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    username: { type: 'string' },
                    avatar_url: { type: ['string', 'null'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: MatchParams }>, reply: FastifyReply) => {
      try {
        const { Match, User } = fastify.db.models;
        const { match_id } = request.params;
        
        // Find the match with related users
        const match = await Match.findByPk(match_id, {
          include: [
            {
              model: User,
              as: 'player1',
              attributes: ['id', 'username', 'avatar_url']
            },
            {
              model: User,
              as: 'player2',
              attributes: ['id', 'username', 'avatar_url']
            }
          ]
        });
        
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

  // Update match details
  fastify.put<{ Params: MatchParams, Body: UpdateMatchBody }>('/api/matches/:match_id', {
    schema: {
      params: {
        type: 'object',
        required: ['match_id'],
        properties: {
          match_id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          player1_score: { type: 'number' },
          player2_score: { type: 'number' },
          winner_id: { type: 'number' },
          status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] }
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
                winner_id: { type: ['number', 'null'] },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: MatchParams, Body: UpdateMatchBody }>, reply: FastifyReply) => {
      try {
        const { Match } = fastify.db.models;
        const userId = request.user.id;
        const { match_id } = request.params;
        const updateData = request.body;
        
        // Find the match
        const match = await Match.findByPk(match_id);
        
        if (!match) {
          return reply.status(404).send({ success: false, message: 'Match not found' });
        }
        
        // Verify user is a participant in the match
        if (match.player1_id !== userId && match.player2_id !== userId) {
          return reply.status(403).send({ 
            success: false, 
            message: 'You are not authorized to update this match' 
          });
        }
        
        // Update match fields
        if (updateData.player1_score !== undefined) match.player1_score = updateData.player1_score;
        if (updateData.player2_score !== undefined) match.player2_score = updateData.player2_score;
        if (updateData.winner_id !== undefined) {
          // Validate winner is a participant
          if (updateData.winner_id !== match.player1_id && updateData.winner_id !== match.player2_id) {
            return reply.status(400).send({ 
              success: false, 
              message: 'Winner must be a participant in the match' 
            });
          }
          match.winner_id = updateData.winner_id;
        }
        if (updateData.status !== undefined) match.status = updateData.status;
        
        await match.save();
        
        return { success: true, data: match };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Cancel a match
  fastify.delete<{ Params: MatchParams }>('/api/matches/:match_id', {
    schema: {
      params: {
        type: 'object',
        required: ['match_id'],
        properties: {
          match_id: { type: 'number' }
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
    handler: async (request: FastifyRequest<{ Params: MatchParams }>, reply: FastifyReply) => {
      try {
        const { Match } = fastify.db.models;
        const userId = request.user.id;
        const { match_id } = request.params;
        
        // Find the match
        const match = await Match.findByPk(match_id);
        
        if (!match) {
          return reply.status(404).send({ success: false, message: 'Match not found' });
        }
        
        // Verify user is a participant in the match
        if (match.player1_id !== userId && match.player2_id !== userId) {
          return reply.status(403).send({ 
            success: false, 
            message: 'You are not authorized to cancel this match' 
          });
        }
        
        // Check if match can be cancelled
        if (match.status === 'completed') {
          return reply.status(400).send({ 
            success: false, 
            message: 'Completed matches cannot be cancelled' 
          });
        }
        
        // Update match status to cancelled
        match.status = 'cancelled';
        await match.save();
        
        return { 
          success: true, 
          message: 'Match cancelled successfully' 
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
} 