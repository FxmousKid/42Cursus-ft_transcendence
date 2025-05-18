import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';
import { Tournament } from '../models/tournament.model';

interface TournamentRequest {
	host_id: number;
}

interface TournamentBody {
	host_id: number;
	users: string[];
}

interface StatusUpdateBody {
	id: number;
	status: string;
}

export function registerTournamentRoutes(fastify: FastifyInstance) {
	// Get all tounaments
	fastify.get('/tournaments', {
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
									host_id: { type: 'number' },
									users: { type: 'array', items: { type: 'string'} },
									status: { type: 'string' },
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
				const tournaments = await fastify.db.models.Tournament.findAll({
					attributes: ['id', 'host_id', 'users', 'status']
				});
				return { success: true, data: tournaments };
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.get<{ Querystring: TournamentRequest }>('/tournaments/user', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					host_id: { type: 'number' },
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
									host_id: { type: 'number' },
									users: { type: 'array', items: { type: 'string'} },
									status: { type: 'string' },
								}
							}
						}
					}
				}
			}
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest<{ Querystring: TournamentRequest }>, reply: FastifyReply) => {
			try {
				const tournaments = await Tournament.findAll({
					where: {
						host_id: request.query.host_id
					}
				})

				if (!tournaments) {
					return reply.status(404).send({ success: false, message: 'No tournament found' });
				}

				return {success: true, tournaments};
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.patch<{ Body: StatusUpdateBody }>('/tournaments/status', {
		schema: {
			body: {
				type: 'object',
				required: ['status'],
				properties: {
					status: { type: 'string', enum: ['on-going', 'finished'] }
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
								host_id: { type: 'number' },
								users: { type: 'array', items: { type: 'string'} },
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
				const tournament = await Tournament.findByPk(request.body.id)

				if (!tournament) {
					return reply.status(404).send({ success: false, message: 'Tournament not found' });
				}

				tournament.status = status;
				await tournament.save();

				return {
					success: true,
					data: {
						id: tournament.id,
						host_id: tournament.host_id,
						users: tournament.users,
						status: tournament.status
					}
				};
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.post<{ Body: TournamentBody}>('/tournaments', {
		schema: {
			  body: {
				type: 'object',
				required: ['host_id', 'users'],
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
			handler: async (request: FastifyRequest<{ Body: TournamentBody }>, reply: FastifyReply) => {
			  try {
				const { host_id, users } = request.body;
		
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
				const newTournament = await fastify.db.models.Tournament.create({
					host_id: host_id,
					users: users,
					status: 'on-going',
				});
		

				// Return user info and token
				return reply.status(201).send({
				  success: true,
				  data: {newTournament}
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