import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { Op } from 'sequelize';
import multipart from '@fastify/multipart';

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
  // Register multipart support for this plugin
  fastify.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    }
  });

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
                  has_avatar_data: { type: 'boolean' },
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data']
        });
        
        // Add has_avatar_data flag without sending the actual data
        const usersWithAvatarFlag = users.map(user => ({
          ...user.toJSON(),
          has_avatar_data: !!user.avatar_data
        }));
        
        return { success: true, data: usersWithAvatarFlag };
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
                  has_avatar_data: { type: 'boolean' },
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data']
        });
        
        const usersWithAvatarFlag = users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          avatar_url: user.avatar_url,
          has_avatar_data: !!user.avatar_data
        }));
        
        return { success: true, data: usersWithAvatarFlag };
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
                has_avatar_data: { type: 'boolean' },
                two_factor_enabled: { type: 'boolean' },
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data', 'two_factor_enabled']
        });

        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          avatar_url: user.avatar_url,
          has_avatar_data: !!user.avatar_data,
          two_factor_enabled: user.two_factor_enabled
        };
        
        return { success: true, data: userData };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Upload avatar image
  fastify.post('/users/profile/avatar', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({ success: false, message: 'No file uploaded' });
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({ 
            success: false, 
            message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
          });
        }

        // Check file size (2MB limit already enforced by multipart config, but double-check)
        const buffer = await data.toBuffer();
        if (buffer.length > 2 * 1024 * 1024) {
          return reply.status(400).send({ 
            success: false, 
            message: 'File too large. Maximum size is 2MB.' 
          });
        }

        // Find user and update avatar data
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }

        // Store the image as-is without processing
        user.avatar_data = buffer;
        user.avatar_mime_type = data.mimetype; // Keep original mime type
        await user.save();

        return { 
          success: true, 
          message: 'Avatar uploaded successfully',
          data: {
            has_avatar_data: true
          }
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
          success: false, 
          message: 'Failed to upload avatar' 
        });
      }
    }
  });

  // Serve avatar image
  fastify.get('/users/avatar/:userId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.params.userId, {
          attributes: ['avatar_data', 'avatar_mime_type']
        });

        if (!user || !user.avatar_data) {
          // Return default avatar placeholder
          return reply.status(404).send({ success: false, message: 'Avatar not found' });
        }

        // Set proper content type and caching headers
        reply
          .header('Content-Type', user.avatar_mime_type || 'image/jpeg')
          .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
          .send(user.avatar_data);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to load avatar' });
      }
    }
  });

  // Delete uploaded avatar
  fastify.delete('/users/profile/avatar', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.user!.id);
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }

        // Clear avatar data but keep avatar_url if it exists
        user.avatar_data = null;
        user.avatar_mime_type = null;
        await user.save();

        return { 
          success: true, 
          message: 'Avatar removed successfully',
          data: {
            has_avatar_data: false,
            avatar_url: user.avatar_url
          }
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to remove avatar' });
      }
    }
  });

  //get user matches
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
              attributes: ['username'],
              required: false // LEFT JOIN to handle null player1_id
            },
            { 
              model: fastify.db.models.User, 
              as: 'player2',
              attributes: ['username'],
              required: false // LEFT JOIN to handle null player2_id
            }
          ],
          order: [['createdAt', 'DESC']]
        });
        
        // Transform matches to include player usernames AND timestamps
        const transformedMatches = matches.map((match: any) => {
          const m = match.toJSON();
          return {
            id: m.id,
            player1_id: m.player1_id,
            player2_id: m.player2_id,
            player1_score: m.player1_score,
            player2_score: m.player2_score,
            player1_username: m.player1?.username || '[Utilisateur supprimé]',
            player2_username: m.player2?.username || '[Utilisateur supprimé]',
            winner_id: m.winner_id,
            status: m.status,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          };
        });
        
        return { success: true, data: transformedMatches };
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
                has_avatar_data: { type: 'boolean' },
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
        if (updateData.avatar_url !== undefined) user.avatar_url = updateData.avatar_url;
        
        await user.save();
        
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          avatar_url: user.avatar_url,
          has_avatar_data: !!user.avatar_data,
          two_factor_enabled: user.two_factor_enabled
        };
        
        return { success: true, data: userData };
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
        const userId = request.user!.id;
        const user = await fastify.db.models.User.findByPk(userId);
        
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }

        // Start a transaction to ensure data consistency
        const transaction = await fastify.db.sequelize.transaction();

        try {
          // 1. Delete user blocks (where user is blocker or blocked)
          await fastify.db.models.UserBlock.destroy({
            where: {
              [Op.or]: [
                { blocker_id: userId },
                { blocked_id: userId }
              ]
            },
            transaction
          });

          // 2. Delete chat messages (where user is sender or receiver)
          await fastify.db.models.ChatMessage.destroy({
            where: {
              [Op.or]: [
                { sender_id: userId },
                { receiver_id: userId }
              ]
            },
            transaction
          });

          // 3. Delete friendships (where user is user_id or friend_id)
          await fastify.db.models.Friendship.destroy({
            where: {
              [Op.or]: [
                { user_id: userId },
                { friend_id: userId }
              ]
            },
            transaction
          });

          // 4. Handle tournaments created by user - DELETE COMPLETELY
          // First, get tournaments hosted by user
          const userTournaments = await fastify.db.models.Tournament.findAll({
            where: { host_id: userId },
            attributes: ['id'],
            transaction
          });

          // Delete all match_tournaments for tournaments hosted by this user
          if (userTournaments.length > 0) {
            const tournamentIds = userTournaments.map(t => t.id);
            await fastify.db.models.MatchTournament.destroy({
              where: { tournament_id: { [Op.in]: tournamentIds } },
              transaction
            });
          }

          // Delete tournaments hosted by user
          await fastify.db.models.Tournament.destroy({
            where: { host_id: userId },
            transaction
          });

          // 5. Anonymize user in match_tournaments (for tournaments NOT created by this user)
          // These are tournaments where user participated but didn't host
          await fastify.db.models.MatchTournament.update(
            { player1_name: '[deleted]' },
            {
              where: { 
                player1_name: user.username,
                tournament_id: { 
                  [Op.notIn]: userTournaments.length > 0 ? userTournaments.map(t => t.id) : [0] 
                }
              },
              transaction
            }
          );
          
          await fastify.db.models.MatchTournament.update(
            { player2_name: '[deleted]' },
            {
              where: { 
                player2_name: user.username,
                tournament_id: { 
                  [Op.notIn]: userTournaments.length > 0 ? userTournaments.map(t => t.id) : [0] 
                }
              },
              transaction
            }
          );
          
          await fastify.db.models.MatchTournament.update(
            { winner_name: '[deleted]' },
            {
              where: { 
                winner_name: user.username,
                tournament_id: { 
                  [Op.notIn]: userTournaments.length > 0 ? userTournaments.map(t => t.id) : [0] 
                }
              },
              transaction
            }
          );

          // 6. Remove user from tournaments participants lists (where they are not host)
          const allTournaments = await fastify.db.models.Tournament.findAll({
            where: { host_id: { [Op.ne]: userId } }, // Exclude tournaments hosted by user (already deleted)
            transaction
          });

          for (const tournament of allTournaments) {
            const users = tournament.users as string[];
            const updatedUsers = users.filter(username => username !== user.username);
            
            if (users.length !== updatedUsers.length) {
              tournament.users = updatedUsers;
              await tournament.save({ transaction });
            }
          }

          // 7. Anonymize user in normal matches - REPLACE USER IDs WITH NULL
          // This preserves matches for other users' statistics while anonymizing the deleted user
          await fastify.db.models.Match.update(
            { player1_id: null },
            {
              where: { player1_id: userId },
              transaction
            }
          );

          await fastify.db.models.Match.update(
            { player2_id: null },
            {
              where: { player2_id: userId },
              transaction
            }
          );

          await fastify.db.models.Match.update(
            { winner_id: null },
            {
              where: { winner_id: userId },
              transaction
            }
          );

          // 8. Finally, delete the user account completely
          await user.destroy({ transaction });

          // Commit the transaction
          await transaction.commit();

          return { success: true, message: 'Account anonymized and deleted successfully' };
        } catch (error) {
          // Rollback the transaction on error
          await transaction.rollback();
          throw error;
        }
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
                  has_avatar_data: { type: 'boolean' },
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data']
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data'],
          limit: 9 // Limit to 9 similar users (total 10 with exact match)
        });
        
        // Combine exact match with similar users, exact match first
        const users = exactMatch ? [exactMatch, ...similarUsers] : similarUsers;
        
        // Add has_avatar_data flag to each user
        const usersWithAvatarFlag = users.map(user => ({
          ...user.toJSON(),
          has_avatar_data: !!user.avatar_data
        }));
        
        return { success: true, data: usersWithAvatarFlag };
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
                has_avatar_data: { type: 'boolean' },
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
          attributes: ['id', 'username', 'email', 'status', 'avatar_url', 'avatar_data', 'createdAt', 'two_factor_enabled']
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
          has_avatar_data: !!user.avatar_data,
          created_at: user.createdAt,
          two_factor_enabled: user.two_factor_enabled,
          statistics: {
            games_played: gamesPlayed,
            wins: wins,
            losses: losses,
            win_rate: winRate
          },
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

  // Get a user's status
  fastify.get('/users/:id/status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = await fastify.db.models.User.findByPk(request.params.id, {
          attributes: ['status']
        });
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        return { success: true, status: user.status };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Set a user's status (only self or admin)
  fastify.post('/users/:id/status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['online', 'offline'] }
        },
        required: ['status']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { id: string }, Body: StatusUpdateBody }>, reply: FastifyReply) => {
      try {
        const userId = parseInt(request.params.id, 10);
        if (request.user!.id !== userId /* && !request.user!.isAdmin */) {
          return reply.status(403).send({ success: false, message: 'Forbidden' });
        }
        const user = await fastify.db.models.User.findByPk(userId);
        if (!user) {
          return reply.status(404).send({ success: false, message: 'User not found' });
        }
        const status = request.body.status === 'online' ? 'online' : 'offline';
        user.status = status;
        await user.save();
        return { success: true, status };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
}