import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';
import { MatchTournament } from '../models/match_tournament.model';

interface MatchsTournamentRequest {
	tournament_id: number;
}

interface MatchTournamentRequest {
	id: string; // UUID
}

interface MatchTournamentBody {
	tournament_id: number;
	player1_name: string;
	player2_name: string;
}

interface StatusUpdateBody {
	id: string; // UUID
	status: string;
}

interface ScoreUpdateBody {
	id: string; // UUID
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
									id: { type: 'string' },
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
									id: { type: 'string' },
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
					id: { type: 'string' },
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
								id: { type: 'string' },
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
								id: { type: 'string' },
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
					id: { type: 'string' },
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
								id: { type: 'string' },
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

				// Save instantanément le match dans la DB
				match.player1_score = player1_score;
				match.player2_score = player2_score;
				match.winner_name = winner_name;
				match.status = 'completed';
				await match.save(); // Sauvegarde du match dans la DB

				// ENREGISTREMENT BLOCKCHAIN ASYNCHRONE (ne pas attendre)
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
								id: { type: 'string' },
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

				// Create new match dans la DB avec UUID
				const newMatch = await fastify.db.models.MatchTournament.create({
					tournament_id: tournament_id,
					player1_name: player1_name,
					player2_name: player2_name,
					player1_score: 0,
					player2_score: 0,
					winner_name: '',
					status: 'scheduled', // <- status par defaut
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

	// ROUTE POUR RÉCUPÉRER LES MATCHES D'UN TOURNOI
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

	// ROUTE DE SANTÉ BLOCKCHAIN
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

				return {
					status: 'available',
					network: network.name || `Chain ID: ${network.chainId}`,
					wallet_address: walletAddress,
					balance: balance,
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

	// ROUTE POUR DÉCRYPTER UNE TRANSACTION BLOCKCHAIN
	fastify.get<{ Params: { txHash: string } }>('/blockchain/verify/:txHash', {
		schema: {
			params: {
				type: 'object',
				properties: {
					txHash: { type: 'string' }
				},
				required: ['txHash']
			}
		},
		handler: async (request: FastifyRequest<{ Params: { txHash: string } }>, reply: FastifyReply) => {
			try {
				if (!fastify.blockchain || !fastify.blockchain.isAvailable()) {
					return reply.status(503).send({
						success: false,
						message: 'Blockchain service not available'
					});
				}

				const txHash = request.params.txHash;

				// Récupérer les détails de la transaction
				const provider = new (await import('ethers')).ethers.JsonRpcProvider(
					process.env.AVALANCHE_RPC_URL || 'http://localhost:8545'
				);

				// 1️⃣ Récupérer la transaction
				const tx = await provider.getTransaction(txHash);
				if (!tx) {
					return reply.status(404).send({
						success: false,
						message: 'Transaction not found'
					});
				}

				// 2️⃣ Récupérer le reçu de transaction (pour les événements)
				const receipt = await provider.getTransactionReceipt(txHash);
				if (!receipt) {
					return reply.status(404).send({
						success: false,
						message: 'Transaction receipt not found'
					});
				}

				// 3️⃣ Décoder les événements MatchRecorded
				const contractInterface = new (await import('ethers')).ethers.Interface([
					"event MatchRecorded(uint256 indexed tournamentId, uint256 indexed matchId, string player1Name, string player2Name, uint256 player1Score, uint256 player2Score, string winnerName, address recordedBy)"
				]);

				const matchEvents = receipt.logs
					.filter(log => log.topics[0] === contractInterface.getEvent('MatchRecorded')?.topicHash)
					.map(log => {
						const decoded = contractInterface.parseLog(log);
						return {
							tournamentId: Number(decoded?.args.tournamentId),
							matchId: Number(decoded?.args.matchId),
							player1Name: decoded?.args.player1Name,
							player2Name: decoded?.args.player2Name,
							player1Score: Number(decoded?.args.player1Score),
							player2Score: Number(decoded?.args.player2Score),
							winnerName: decoded?.args.winnerName,
							recordedBy: decoded?.args.recordedBy
						};
					});

				// 4️⃣ Informations de la transaction
				const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber) : null;
				const transactionInfo = {
					hash: tx.hash,
					blockNumber: receipt.blockNumber,
					blockHash: receipt.blockHash,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'Success' : 'Failed',
					timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
					from: tx.from,
					to: tx.to,
					value: (await import('ethers')).ethers.formatEther(tx.value || 0)
				};

				// 5️⃣ Lien vers l'explorateur
				const network = await provider.getNetwork();
				const explorerUrl = network.chainId === 43113n 
					? `https://testnet.snowtrace.io/tx/${txHash}`
					: `https://snowtrace.io/tx/${txHash}`;

				// 6️⃣ AFFICHAGE FORMATÉ ET ORDONNÉ
				return {
					success: true,
					message: "Transaction decoded successfully",
					data: {
						// MATCH DETAILS
						match: matchEvents.length > 0 ? {
							tournament_id: matchEvents[0].tournamentId,
							match_id: matchEvents[0].matchId,
							players: {
								player1: {
									name: matchEvents[0].player1Name,
									score: matchEvents[0].player1Score
								},
								player2: {
									name: matchEvents[0].player2Name,
									score: matchEvents[0].player2Score
								}
							},
							winner: matchEvents[0].winnerName,
							recorded_at: transactionInfo.timestamp ? new Date(transactionInfo.timestamp).toLocaleString('fr-FR') : null
						} : null,

						// BLOCKCHAIN PROOF
						blockchain: {
							transaction_hash: transactionInfo.hash,
							block_number: transactionInfo.blockNumber,
							status: transactionInfo.status,
							network: network.chainId === 43113n ? "Avalanche Fuji Testnet" : "Avalanche Mainnet",
							gas_used: parseInt(transactionInfo.gasUsed).toLocaleString(),
							recorded_by: transactionInfo.from,
							contract_address: transactionInfo.to
						},

						// VERIFICATION STATUS
						verification: {
							verified: receipt.status === 1,
							immutable: true,
							decentralized: true,
							events_count: matchEvents.length,
							description: "Data permanently stored on Avalanche blockchain"
						},

						// USEFUL LINKS
						explorer: {
							transaction: explorerUrl,
							contract: network.chainId === 43113n 
								? `https://testnet.snowtrace.io/address/${transactionInfo.to}`
								: `https://snowtrace.io/address/${transactionInfo.to}`,
							wallet: network.chainId === 43113n
								? `https://testnet.snowtrace.io/address/${transactionInfo.from}`
								: `https://snowtrace.io/address/${transactionInfo.from}`
						},

						// RAW DATA (for developers)
						raw: {
							transaction: transactionInfo,
							events: matchEvents
						}
					}
				};

			} catch (error) {
				fastify.log.error('Failed to verify blockchain transaction:', error);
				return reply.status(500).send({
					success: false,
					message: 'Failed to verify transaction',
					error: error.message
				});
			}
		}
	});

	// ROUTE POUR VÉRIFIER UN MATCH DIRECTEMENT SUR LE SMART CONTRACT
	fastify.get<{ Params: { tournamentId: string; matchId: string } }>('/blockchain/match/:tournamentId/:matchId', {
		schema: {
			params: {
				type: 'object',
				properties: {
					tournamentId: { type: 'string' },
					matchId: { type: 'string' }
				},
				required: ['tournamentId', 'matchId']
			}
		},
		handler: async (request: FastifyRequest<{ Params: { tournamentId: string; matchId: string } }>, reply: FastifyReply) => {
			try {
				if (!fastify.blockchain || !fastify.blockchain.isAvailable()) {
					return reply.status(503).send({
						success: false,
						message: 'Blockchain service not available'
					});
				}

				const tournamentId = parseInt(request.params.tournamentId);
				const matchId = parseInt(request.params.matchId);

				// Récupérer tous les matchs du tournoi depuis la blockchain
				const blockchainMatches = await fastify.blockchain.getTournamentMatches(tournamentId);
				
				// Trouver le match spécifique
				const match = blockchainMatches.find((m: any) => Number(m.matchId) === matchId);

				if (!match) {
					return reply.status(404).send({
						success: false,
						message: `Match ${matchId} not found in tournament ${tournamentId} on blockchain`
					});
				}

				// Vérifier si le match existe aussi en base de données
				let sqliteMatch = null;
				try {
					// Convertir l'ID blockchain en UUID (recherche inverse)
					const allMatches = await MatchTournament.findAll({
						where: { tournament_id: tournamentId }
					});
					
					// Trouver le match correspondant par conversion UUID -> blockchain ID
					const crypto = await import('crypto');
					sqliteMatch = allMatches.find(m => {
						const hash = crypto.createHash('sha256').update(m.id).digest('hex');
						const blockchainId = parseInt(hash.substring(0, 8), 16);
						return blockchainId === matchId;
					});
				} catch (error) {
					fastify.log.warn('Could not find corresponding SQLite match:', error);
				}

				// Informations réseau
				const network = await fastify.blockchain.getNetworkInfo();
				const explorerUrl = network.chainId === 43113n 
					? `https://testnet.snowtrace.io/address/${process.env.TOURNAMENT_CONTRACT_ADDRESS}`
					: `https://snowtrace.io/address/${process.env.TOURNAMENT_CONTRACT_ADDRESS}`;

				return {
					success: true,
					data: {
						blockchain_match: {
							matchId: Number(match.matchId),
							tournamentId: Number(match.tournamentId),
							player1Name: match.player1Name,
							player2Name: match.player2Name,
							player1Score: Number(match.player1Score),
							player2Score: Number(match.player2Score),
							winnerName: match.winnerName,
							timestamp: new Date(Number(match.timestamp) * 1000).toISOString(),
							recordedBy: match.recordedBy
						},
						sqlite_match: sqliteMatch ? {
							id: sqliteMatch.id,
							tournament_id: sqliteMatch.tournament_id,
							player1_name: sqliteMatch.player1_name,
							player2_name: sqliteMatch.player2_name,
							player1_score: sqliteMatch.player1_score,
							player2_score: sqliteMatch.player2_score,
							winner_name: sqliteMatch.winner_name,
							status: sqliteMatch.status,
							blockchain_verified: sqliteMatch.blockchain_verified,
							blockchain_tx_hash: sqliteMatch.blockchain_tx_hash
						} : null,
						verification: {
							data_matches: sqliteMatch ? (
								sqliteMatch.player1_name === match.player1Name &&
								sqliteMatch.player2_name === match.player2Name &&
								sqliteMatch.player1_score === Number(match.player1Score) &&
								sqliteMatch.player2_score === Number(match.player2Score) &&
								sqliteMatch.winner_name === match.winnerName
							) : null,
							immutable: true,
							decentralized: true,
							message: "Ces données sont vérifiables et immutables sur la blockchain"
						},
						contract_address: process.env.TOURNAMENT_CONTRACT_ADDRESS,
						explorer_url: explorerUrl
					}
				};

			} catch (error) {
				fastify.log.error('Failed to verify match on blockchain:', error);
				return reply.status(500).send({
					success: false,
					message: 'Failed to verify match',
					error: error.message
				});
			}
		}
	});
} 