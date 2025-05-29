import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';

interface FriendshipRequest {
  friend_id: number;
}

export function registerFriendshipRoutes(fastify: FastifyInstance) {
  // Get all friends
  fastify.get('/friendships', {
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
                  status: { type: 'string' },
                  avatar_url: { type: ['string', 'null'] },
                  has_avatar_data: { type: 'boolean' },
                  friendship_status: { type: 'string' }
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
        const { User, Friendship } = fastify.db.models;
        const userId = request.user!.id;
        
        // Find all friendships where the current user is involved
        const friendships = await Friendship.findAll({
          where: {
            [Op.or]: [
              { user_id: userId },
              { friend_id: userId }
            ],
            status: 'accepted'
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'status', 'avatar_url', 'avatar_data']
            },
            {
              model: User,
              as: 'friend',
              attributes: ['id', 'username', 'status', 'avatar_url', 'avatar_data']
            }
          ]
        });

        // Format the response
        const friends = friendships.map(friendship => {
          // Determine which user is the friend (not the current user)
          const friend = friendship.user_id === userId
            ? friendship.friend
            : friendship.user;

          return {
            id: friend.id,
            username: friend.username,
            status: friend.status,
            avatar_url: friend.avatar_url,
            has_avatar_data: !!friend.avatar_data,
            friendship_status: friendship.status
          };
        });

        return { success: true, data: friends };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Send friend request
  fastify.post<{ Body: FriendshipRequest }>('/friendships/request', {
    schema: {
      body: {
        type: 'object',
        required: ['friend_id'],
        properties: {
          friend_id: { type: 'number' }
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
                user_id: { type: 'number' },
                friend_id: { type: 'number' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: FriendshipRequest }>, reply: FastifyReply) => {
      try {
        const { Friendship, User } = fastify.db.models;
        const userId = request.user!.id;
        const { friend_id } = request.body;

        if (userId === friend_id) {
          return reply.status(400).send({
            success: false,
            message: 'You cannot send a friend request to yourself'
          });
        }

        // Check if friendship already exists
        const existingFriendship = await Friendship.findOne({
          where: {
            [Op.or]: [
              { user_id: userId, friend_id },
              { user_id: friend_id, friend_id: userId }
            ]
          }
        });

        if (existingFriendship) {
          return reply.status(400).send({
            success: false,
            message: 'Friendship request already exists'
          });
        }

        // Create new friendship request
        const newFriendship = await Friendship.create({
          user_id: userId,
          friend_id,
          status: 'pending'
        });
        
        // Notification via WebSocket is handled separately by the WebSocket server

        return { success: true, data: newFriendship };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Get pending friend requests
  fastify.get('/friendships/requests', {
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
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      username: { type: 'string' },
                      status: { type: 'string' },
                      avatar_url: { type: ['string', 'null'] },
                      has_avatar_data: { type: 'boolean' }
                    }
                  },
                  status: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
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
        const { User, Friendship } = fastify.db.models;
        const userId = request.user!.id;
        
        fastify.log.info(`Getting pending friend requests for user ${userId}`);
        
        // Find pending friend requests
        const pendingRequests = await Friendship.findAll({
          where: {
            friend_id: userId,
            status: 'pending'
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'status', 'avatar_url', 'avatar_data']
            }
          ]
        });
        
        fastify.log.info(`Found ${pendingRequests.length} pending requests for user ${userId}`);
        
        // Format the response to include has_avatar_data
        const formattedRequests = pendingRequests.map(request => {
          const requestData = request.toJSON() as any;
          return {
            id: requestData.id,
            user: {
              id: requestData.user.id,
              username: requestData.user.username,
              status: requestData.user.status,
              avatar_url: requestData.user.avatar_url,
              has_avatar_data: !!requestData.user.avatar_data
            },
            status: requestData.status,
            created_at: requestData.created_at
          };
        });
        
        // Log de debugging - visualiser la structure des données formatées
        if (formattedRequests.length > 0) {
          fastify.log.info(`Sample formatted request structure: ${JSON.stringify(formattedRequests[0])}`);
        }
        
        return { success: true, data: formattedRequests };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Accept friend request
  fastify.post<{ Params: { request_id: number } }>('/friendships/accept/:request_id', {
    schema: {
      params: {
        type: 'object',
        required: ['request_id'],
        properties: {
          request_id: { type: 'number' }
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
                user_id: { type: 'number' },
                friend_id: { type: 'number' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { request_id: number } }>, reply: FastifyReply) => {
      try {
        const { Friendship } = fastify.db.models;
        const userId = request.user!.id;
        const { request_id } = request.params;
        
        // Find the friendship request
        const friendship = await Friendship.findOne({
          where: {
            id: request_id,
            friend_id: userId,
            status: 'pending'
          }
        });

        if (!friendship) {
          return reply.status(404).send({
            success: false,
            message: 'Friend request not found'
          });
        }

        // Update friendship status
        friendship.status = 'accepted';
        await friendship.save();
        
        // Notification via WebSocket is handled separately by the WebSocket server
        
        return { success: true, data: friendship };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
  
  // Reject friend request
  fastify.post<{ Params: { request_id: number } }>('/friendships/reject/:request_id', {
    schema: {
      params: {
        type: 'object',
        required: ['request_id'],
        properties: {
          request_id: { type: 'number' }
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
    handler: async (request: FastifyRequest<{ Params: { request_id: number } }>, reply: FastifyReply) => {
      try {
        const { Friendship } = fastify.db.models;
        const userId = request.user!.id;
        const { request_id } = request.params;
        
        // Find the friendship request
        const friendship = await Friendship.findOne({
          where: {
            id: request_id,
            friend_id: userId,
            status: 'pending'
          }
        });

        if (!friendship) {
          return reply.status(404).send({
            success: false,
            message: 'Friend request not found'
          });
        }

        // Delete the friendship
        await friendship.destroy();
        
        // Notification via WebSocket is handled separately by the WebSocket server
        
        return { 
          success: true, 
          message: 'Friend request rejected successfully' 
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });

  // Remove friend
  fastify.delete<{ Params: { friend_id: number } }>('/friendships/:friend_id', {
    schema: {
      params: {
        type: 'object',
        required: ['friend_id'],
        properties: {
          friend_id: { type: 'number' }
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
    handler: async (request: FastifyRequest<{ Params: { friend_id: number } }>, reply: FastifyReply) => {
      try {
        const { Friendship } = fastify.db.models;
        const userId = request.user!.id;
        const { friend_id } = request.params;

        // Find the friendship
        const friendship = await Friendship.findOne({
          where: {
            [Op.or]: [
              { user_id: userId, friend_id },
              { user_id: friend_id, friend_id: userId }
            ],
            status: 'accepted'
          }
        });

        if (!friendship) {
          return reply.status(404).send({
            success: false,
            message: 'Friendship not found'
          });
        }

        // Delete the friendship
        await friendship.destroy();
        
        // Notification via WebSocket is handled separately by the WebSocket server
        
        return { 
          success: true, 
          message: 'Friend removed successfully' 
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({ success: false, message: error.message });
      }
    }
  });
} 