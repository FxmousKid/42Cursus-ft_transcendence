import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';
import { MatchTournament } from '../models/match_tournament.model';

interface MatchsTournamentRequest {
	tournament_id: number;
}

interface MatchTournamentRequest {
	id: number;
	tournament_id: number;
}

interface MatchTournamentBody {
	tournament_id: number;
	player1_name: string;
	player2_name: string;
}

interface StatusUpdateBody {
	id: number;
	status: string;
}

export function registerTournamentRoutes(fastify: FastifyInstance) {
	// Get all tounaments
	fastify.get('/match_tournaments', {
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
									tournament_id: { type: 'number'},
									player1_name: { type: 'string'},
									player2_name: { type: 'string'},
									player1_score: { type: 'number'},
									player2_score: { type: 'number'},
									winner_name: { type: 'string'},
									status: { type: 'string'},
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
				const matchs = await fastify.db.models.MatchTournament.findAll({
					attributes: ['id', 'tournament_id', 'player1_name', 'player2_name', 'player1_score', 'player2_score', 'winner_name', 'status']
				});
				return { success: true, data: matchs };
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.get<{ Querystring: MatchsTournamentRequest }>('/match_tournaments/matchs', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					tournament_id: { type: 'number' },
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
									tournament_id: { type: 'number'},
									player1_name: { type: 'string'},
									player2_name: { type: 'string'},
									player1_score: { type: 'number'},
									player2_score: { type: 'number'},
									winner_name: { type: 'string'},
									status: { type: 'string'},
								}
							}
						}
					}
				}
			}
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest<{ Querystring: MatchsTournamentRequest }>, reply: FastifyReply) => {
			try {
				const matchs = await MatchTournament.findAll({
					where: {
						tournament_id: request.query.tournament_id
					}
				})

				if (!matchs) {
					return reply.status(404).send({ success: false, message: 'No tournament found' });
				}

				return {success: true, matchs};
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.patch<{ Body: StatusUpdateBody }>('/match_tournaments/status', {
		schema: {
			body: {
				type: 'object',
				required: ['status'],
				properties: {
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
								tournament_id: { type: 'number'},
								player1_name: { type: 'string'},
								player2_name: { type: 'string'},
								player1_score: { type: 'number'},
								player2_score: { type: 'number'},
								winner_name: { type: 'string'},
								status: { type: 'string'},
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
				const match = await MatchTournament.findByPk(request.body.id)

				if (!match) {
					return reply.status(404).send({ success: false, message: 'MatchTournament not found' });
				}

				match.status = status;
				await match.save();

				return {
					success: true,
					data: {
						id: match.id,
						tournament_id: match.tournament_id,
						player1_name: match.player1_name,
						player2_name: match.player2_name,
						player1_score: match.player1_score,
						player2_score: match.player2_score,
						winner_name: match.winner_name,
						status: match.status,
					}
				};
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.post<{ Body: MatchTournamentBody}>('/match_tournaments', {
		schema: {
			  body: {
				type: 'object',
				required: ['tournament_id', 'player1_name', 'player2_name'],
				properties: {
				  host_id: { type: 'number' },
				  users: { type: 'array', items: { type: 'string'} },
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
						host_id: { type: 'number' },
						users: { type: 'array', items: { type: 'string'} },
						status: { type: 'string' }
					  }
					}
				  }
				}
			  }
			},
			handler: async (request: FastifyRequest<{ Body: MatchTournamentBody }>, reply: FastifyReply) => {
			  try {
				const { tournament_id, player1_name, player2_name } = request.body;
		
				// Check if user exists
				//const existingUser = await fastify.db.models.User.findOne({
				//  where: {
				//	id: host_id
				//  }
				//});
				
				//if (!existingUser) {
				 // return reply.status(400).send({ 
				//	success: false, 
				//	message: 'user dont exit' 
				 // });
				//}

				// Create new tournament
				const newMatch = await fastify.db.models.MatchTournament.create({
					tournament_id: tournament_id,
					player1_name: player1_name,
					player2_name: player2_name,
					player1_score: 0,
					player2_score: 0,
					winner_name: '',
					status: 'scheduled',
				});
		

				// Return user info and token
				return reply.status(201).send({
				  success: true,
				  data: {newMatch}
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
} 