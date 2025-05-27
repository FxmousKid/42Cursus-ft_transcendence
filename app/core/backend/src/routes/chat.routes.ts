import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Op } from 'sequelize';

interface ChatMessageRequest {
  receiver_id: number;
  content: string;
  type?: 'text' | 'game_invite' | 'tournament_notification';
}

interface BlockUserRequest {
  blocked_id: number;
}

export function registerChatRoutes(fastify: FastifyInstance) {
  // Get chat messages with a specific user
  fastify.get<{ Params: { user_id: number } }>('/chat/messages/:user_id', {
    schema: {
      params: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'number' },
        },
      },
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { user_id: number } }>, reply: FastifyReply) => {
      try {
        const { ChatMessage, UserBlock } = fastify.db.models;
        const userId = request.user!.id;
        const { user_id } = request.params;

        // Check if either user has blocked the other
        const blockExists = await UserBlock.findOne({
          where: {
            [Op.or]: [
              { blocker_id: userId, blocked_id: user_id },
              { blocker_id: user_id, blocked_id: userId },
            ],
          },
        });

        if (blockExists) {
          return reply.status(403).send({
            success: false,
            message: 'Cannot access messages due to user block',
          });
        }

        const messages = await ChatMessage.findAll({
          where: {
            [Op.or]: [
              { sender_id: userId, receiver_id: user_id },
              { sender_id: user_id, receiver_id: userId },
            ],
          },
          order: [['created_at', 'ASC']],
        });

        // Mark messages as read
        await ChatMessage.update(
          { read: true },
          {
            where: {
              receiver_id: userId,
              sender_id: user_id,
              read: false,
            },
          }
        );

        return { success: true, data: messages };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: error.message });
      }
    },
  });

  // Get unread message count
  fastify.get('/chat/unread', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { ChatMessage } = fastify.db.models;
        const userId = request.user!.id;

        const count = await ChatMessage.count({
          where: {
            receiver_id: userId,
            read: false,
          },
        });

        return { success: true, data: { count } };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: error.message });
      }
    },
  });

  // Block a user
  fastify.post<{ Body: BlockUserRequest }>('/chat/block', {
    schema: {
      body: {
        type: 'object',
        required: ['blocked_id'],
        properties: {
          blocked_id: { type: 'number' },
        },
      },
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: BlockUserRequest }>, reply: FastifyReply) => {
      try {
        const { UserBlock } = fastify.db.models;
        const userId = request.user!.id;
        const { blocked_id } = request.body;

        if (userId === blocked_id) {
          return reply.status(400).send({
            success: false,
            message: 'Cannot block yourself',
          });
        }

        const [block, created] = await UserBlock.findOrCreate({
          where: {
            blocker_id: userId,
            blocked_id,
          },
        });

        return {
          success: true,
          data: block,
          message: created ? 'User blocked successfully' : 'User was already blocked',
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: error.message });
      }
    },
  });

  // Unblock a user
  fastify.delete<{ Params: { user_id: number } }>('/chat/block/:user_id', {
    schema: {
      params: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'number' },
        },
      },
    },
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { user_id: number } }>, reply: FastifyReply) => {
      try {
        const { UserBlock } = fastify.db.models;
        const userId = request.user!.id;
        const { user_id } = request.params;

        const block = await UserBlock.findOne({
          where: {
            blocker_id: userId,
            blocked_id: user_id,
          },
        });

        if (!block) {
          return reply.status(404).send({
            success: false,
            message: 'Block not found',
          });
        }

        await block.destroy();

        return {
          success: true,
          message: 'User unblocked successfully',
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: error.message });
      }
    },
  });

  // Get blocked users
  fastify.get('/chat/blocks', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { UserBlock, User } = fastify.db.models;
        const userId = request.user!.id;

        const blocks = await UserBlock.findAll({
          where: {
            blocker_id: userId,
          },
          include: [
            {
              model: User,
              as: 'blocked',
              attributes: ['id', 'username', 'avatar_url'],
            },
          ],
        });

        return { success: true, data: blocks };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, message: error.message });
      }
    },
  });
} 