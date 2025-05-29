import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';
import { MatchTournament } from '../models/match_tournament.model';

interface MatchsTournamentRequest {
	tournament_id: number;
}

interface MatchTournamentRequest {
	id: number;
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

interface ScoreUpdateBody {
	id: number;
	player1_score: number;
	player2_score: number;
	winner_name: string;
}

export function registerMatchTournamentRoutes(fastify: FastifyInstance) {
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
									tournament_id: { type: 'number' },
									player1_name: { type: 'string' },
									player2_name: { type: 'string' },
									player1_score: { type: 'number' },
									player2_score: { type: 'number' },
									winner_name: { type: 'string' },
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
									tournament_id: { type: 'number' },
									player1_name: { type: 'string' },
									player2_name: { type: 'string' },
									player1_score: { type: 'number' },
									player2_score: { type: 'number' },
									winner_name: { type: 'string' },
									status: { type: 'string' },
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

				return { success: true, matchs };
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});


	fastify.get<{ Querystring: MatchTournamentRequest }>('/match_tournaments/match', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					id: { type: 'number' },
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
								tournament_id: { type: 'number' },
								player1_name: { type: 'string' },
								player2_name: { type: 'string' },
								player1_score: { type: 'number' },
								player2_score: { type: 'number' },
								winner_name: { type: 'string' },
								status: { type: 'string' },
							}
						}
					}
				}
			}
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest<{ Querystring: MatchTournamentRequest }>, reply: FastifyReply) => {
			try {
				const match = await MatchTournament.findByPk(request.query.id);

				if (!match) {
					return reply.status(404).send({ success: false, message: 'No Match found' });
				}

				return { success: true, match };
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
								tournament_id: { type: 'number' },
								player1_name: { type: 'string' },
								player2_name: { type: 'string' },
								player1_score: { type: 'number' },
								player2_score: { type: 'number' },
								winner_name: { type: 'string' },
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


	fastify.patch<{ Body: ScoreUpdateBody }>('/match_tournaments/scores', {
		schema: {
			body: {
				type: 'object',
				required: ['id', 'player1_score', 'player2_score', 'winner_name'],
				properties: {
					id: { type: 'number' },
					player1_score: { type: 'number' },
					player2_score: { type: 'number' },
					winner_name: { type: 'string' },
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
								tournament_id: { type: 'number' },
								player1_name: { type: 'string' },
								player2_name: { type: 'string' },
								player1_score: { type: 'number' },
								player2_score: { type: 'number' },
								winner_name: { type: 'string' },
								status: { type: 'string' },
								blockchain_tx: { type: 'string' }
							}
						}
					}
				}
			}
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest<{ Body: ScoreUpdateBody }>, reply: FastifyReply) => {
			try {
				const { id, player1_score, player2_score, winner_name } = request.body;
				const match = await MatchTournament.findByPk(request.body.id)

				if (!match) {
					return reply.status(404).send({ success: false, message: 'MatchTournament not found' });
				}

				// Sauvegarder le match en SQLite IMMÉDIATEMENT
				match.player1_score = player1_score;
				match.player2_score = player2_score;
				match.winner_name = winner_name;
				match.status = 'completed';
				await match.save();

				// 🚀 ENREGISTREMENT BLOCKCHAIN ASYNCHRONE (ne pas attendre)
				if (fastify.blockchain && fastify.blockchain.isAvailable()) {
					fastify.log.info(`Starting async blockchain recording for match ${match.id}`);
					
					// Lancer l'enregistrement blockchain en arrière-plan
					fastify.blockchain.recordMatch({
						id: match.id,
						tournament_id: match.tournament_id,
						player1_name: match.player1_name,
						player2_name: match.player2_name,
						player1_score: match.player1_score,
						player2_score: match.player2_score,
						winner_name: match.winner_name
					}).catch(error => {
						fastify.log.error(`Async blockchain recording failed for match ${match.id}:`, error);
					});
				} else {
					fastify.log.warn('Blockchain service not available, skipping blockchain recording');
				}

				// 📤 RÉPONSE IMMÉDIATE AU FRONTEND
				const responseData = {
					id: match.id,
					tournament_id: match.tournament_id,
					player1_name: match.player1_name,
					player2_name: match.player2_name,
					player1_score: match.player1_score,
					player2_score: match.player2_score,
					winner_name: match.winner_name,
					status: match.status,
					blockchain_verified: match.blockchain_verified || false,
					blockchain_status: 'pending' // Indique que l'enregistrement blockchain est en cours
				};

				return {
					success: true,
					data: responseData
				};
			} catch (error) {
				fastify.log.error(error);
				return reply.status(400).send({ success: false, message: error.message });
			}
		}
	});

	fastify.post<{ Body: MatchTournamentBody }>('/match_tournaments', {
		schema: {
			body: {
				type: 'object',
				required: ['tournament_id', 'player1_name', 'player2_name'],
				properties: {
					tournament_id: { type: 'number' },
					player1_name: { type: 'string' },
					player2_name: { type: 'string' },
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
								tournament_id: { type: 'number' },
								player1_name: { type: 'string' },
								player2_name: { type: 'string' },
								player1_score: { type: 'number' },
								player2_score: { type: 'number' },
								winner_name: { type: 'string' },
								status: { type: 'string' },
							}
						}
					}
				}
			}
		},
		handler: async (request: FastifyRequest<{ Body: MatchTournamentBody }>, reply: FastifyReply) => {
			try {
				const { tournament_id, player1_name, player2_name } = request.body;

				// Create new match
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
					data: { id: newMatch.id,
							tournament_id: newMatch.tournament_id,
							player1_name: newMatch.player1_name,
							player2_name: newMatch.player2_name,
							player1_score: newMatch.player1_score,
							player2_score: newMatch.player2_score,
							winner_name: newMatch.winner_name,
							status: newMatch.status, 
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

	// 🔍 ROUTE DE VÉRIFICATION BLOCKCHAIN SIMPLIFIÉE
	fastify.get<{ Params: { tournamentId: string } }>('/tournaments/:tournamentId/blockchain-proof', {
		preHandler: [fastify.authenticate],
		schema: {
			params: {
				type: 'object',
				properties: {
					tournamentId: { type: 'string' }
				},
				required: ['tournamentId']
			}
		},
		handler: async (request: FastifyRequest<{ Params: { tournamentId: string } }>, reply: FastifyReply) => {
			try {
				const tournamentId = parseInt(request.params.tournamentId);

				// Récupérer tous les matches du tournoi depuis la DB
				const matches = await MatchTournament.findAll({
					where: { tournament_id: tournamentId, status: 'completed' }
				});

				if (matches.length === 0) {
					return reply.status(404).send({ 
						success: false, 
						message: 'No completed matches found for this tournament' 
					});
				}

				// Statistiques des preuves blockchain
				const totalMatches = matches.length;
				const verifiedMatches = matches.filter(m => m.blockchain_verified).length;
				const withTxHash = matches.filter(m => m.blockchain_tx_hash).length;

				const proofSummary = {
					tournament_id: tournamentId,
					total_matches: totalMatches,
					verified_matches: verifiedMatches,
					matches_with_tx_hash: withTxHash,
					verification_rate: totalMatches > 0 ? (verifiedMatches / totalMatches * 100).toFixed(2) + '%' : '0%',
					blockchain_available: fastify.blockchain?.isAvailable() || false,
					wallet_address: fastify.blockchain?.getWalletAddress() || null
				};

				const matchProofs = matches.map(match => ({
					match_id: match.id,
					player1_name: match.player1_name,
					player2_name: match.player2_name,
					winner_name: match.winner_name,
					blockchain_verified: match.blockchain_verified || false,
					blockchain_tx_hash: match.blockchain_tx_hash || null,
					blockchain_recorded_at: match.blockchain_recorded_at || null,
					status: match.status
				}));

				return {
					success: true,
					data: {
						summary: proofSummary,
						match_proofs: matchProofs
					}
				};

			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({
					success: false,
					message: 'Failed to retrieve blockchain proofs'
				});
			}
		}
	});

	// 📋 ROUTE POUR RÉCUPÉRER LES MATCHES D'UN TOURNOI
	fastify.get<{ Params: { tournamentId: string } }>('/tournaments/:tournamentId/matches', {
		schema: {
			params: {
				type: 'object',
				properties: {
					tournamentId: { type: 'string' }
				},
				required: ['tournamentId']
			}
		},
		handler: async (request: FastifyRequest<{ Params: { tournamentId: string } }>, reply: FastifyReply) => {
			try {
				const tournamentId = parseInt(request.params.tournamentId);

				const matches = await MatchTournament.findAll({
					where: { tournament_id: tournamentId },
					order: [['createdAt', 'ASC']]
				});

				return matches.map(match => ({
					id: match.id,
					tournament_id: match.tournament_id,
					player1_name: match.player1_name,
					player2_name: match.player2_name,
					player1_score: match.player1_score || 0,
					player2_score: match.player2_score || 0,
					winner_name: match.winner_name || null,
					status: match.status,
					blockchain_verified: match.blockchain_verified || false,
					blockchain_tx_hash: match.blockchain_tx_hash || null,
					blockchain_recorded_at: match.blockchain_recorded_at || null,
					createdAt: match.createdAt,
					updatedAt: match.updatedAt
				}));

			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({
					success: false,
					message: 'Failed to retrieve tournament matches'
				});
			}
		}
	});

	// 🌐 ROUTE DE SANTÉ BLOCKCHAIN
	fastify.get('/health/blockchain', {
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				if (!fastify.blockchain || !fastify.blockchain.isAvailable()) {
					return {
						status: 'unavailable',
						message: 'Blockchain service not initialized'
					};
				}

				// Récupérer les informations blockchain
				const walletAddress = fastify.blockchain.getWalletAddress();
				const balance = await fastify.blockchain.getBalance();
				const network = await fastify.blockchain.getNetworkInfo();
				
				// Compter les matches sur la blockchain
				let blockchainMatches = 0;
				try {
					const matches = await fastify.blockchain.getTournamentMatches(1); // Tournoi par défaut
					blockchainMatches = matches.length;
				} catch (error) {
					fastify.log.warn('Could not retrieve blockchain matches count:', error.message);
				}

				return {
					status: 'available',
					network: network.name || `Chain ID: ${network.chainId}`,
					wallet_address: walletAddress,
					balance: balance,
					blockchain_matches: blockchainMatches,
					timestamp: new Date().toISOString()
				};

			} catch (error) {
				fastify.log.error('Blockchain health check failed:', error);
				return reply.status(500).send({
					status: 'error',
					message: 'Blockchain health check failed',
					error: error.message
				});
			}
		}
	});
} 