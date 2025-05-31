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

// Utility function to get current time in Paris timezone
function getParisTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Paris"}));
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
                  player1_id: { type: 'number' },
                  player2_id: { type: 'number' },
                  player1_score: { type: 'number' },
                  player2_score: { type: 'number' },
                  status: { type: 'string' },
                  match_date: { type: 'string' },
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
          order: [['match_date', 'DESC']]
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
                                player1_id: { type: 'number' },
                                player2_id: { type: 'number' },
                                player1_score: { type: 'number' },
                                player2_score: { type: 'number' },
                                player1_username: { type: 'string' },
                                player2_username: { type: 'string' },
                                status: { type: 'string' },
                                match_date: { type: 'string' },
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
                order: [['match_date', 'DESC']]
            });

            // Transform matches to include usernames and proper date formatting
            const transformedMatches = matches.map(match => {
                const m = match.toJSON() as any;
                return {
                    id: m.id,
                    player1_id: m.player1_id,
                    player2_id: m.player2_id,
                    player1_score: m.player1_score,
                    player2_score: m.player2_score,
                    player1_username: m.player1?.username || 'Unknown',
                    player2_username: m.player2?.username || 'Unknown',
                    status: m.status,
                    match_date: m.match_date, // This will be the Paris time when match was completed
                    created_at: m.createdAt,
                    updated_at: m.updatedAt
                };
            });

            return { success: true, data: transformedMatches };
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
                player1_id: { type: 'number' },
                player2_id: { type: 'number' },
                player1_score: { type: 'number' },
                player2_score: { type: 'number' },
                status: { type: 'string' },
                match_date: { type: 'string' },
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
                match_date: { type: 'string' },
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
          match_date: getParisTime() // Set match_date to Paris time when created
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
                match_date: { type: 'string' },
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

        // Set winner_id based on scores
        if (updateData.player1_score !== undefined && updateData.player2_score !== undefined) {
          match.winner_id = (match.player1_score >= match.player2_score) ? match.player1_id : match.player2_id;
        }

        // IMPORTANT: Update match_date to Paris time when match is completed
        if (updateData.status === 'completed') {
          match.match_date = getParisTime();
          console.log(`Match ${id} completed at Paris time: ${match.match_date}`);
        }

        await match.save();
        
        return { success: true, 
          data: {
            id: match.id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_score: match.player1_score,
            player2_score: match.player2_score,
            status: match.status,
            match_date: match.match_date,
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