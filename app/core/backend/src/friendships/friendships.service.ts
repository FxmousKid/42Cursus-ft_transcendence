import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Friendships } from './friendships.model';
import { User } from '../user/user.model';
import { Op } from 'sequelize';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectModel(Friendships)
    private readonly friendshipsModel: typeof Friendships,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly websocketGateway: WebsocketGateway
  ) {}

  async sendFriendRequest(userId: number, friendUsername: string): Promise<Friendships> {
    // Recherche de l'utilisateur à qui envoyer la demande (friendUsername)
    const friend = await this.userModel.findOne({
      where: { username: friendUsername }
    });

    if (!friend) {
      throw new Error('User not found');
    }
    if (friend.id === userId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    // Vérifier si une demande d'amitié existe déjà
    const existingRequest = await this.friendshipsModel.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friend.id },
          { user_id: friend.id, friend_id: userId }
        ]
      }
    });

    if (existingRequest) {
      throw new Error('A friendship or request already exists with this user');
    }

    // Créer la demande d'amitié
    const request = await this.friendshipsModel.create({
      user_id: userId,
      friend_id: friend.id,
      status: 'pending',
      created_at: new Date()
    });

    // Récupérer les informations de l'utilisateur qui envoie la demande (A)
    const sender = await this.userModel.findByPk(userId);
    
    // Envoyer une notification WebSocket à B
    this.websocketGateway.notifyFriendRequest(friend.id, sender);

    return request;
  }

  async acceptFriendRequest(userId: number, requestId: number): Promise<Friendships> {
    const request = await this.friendshipsModel.findOne({
      where: {
        id: requestId,
        friend_id: userId,
        status: 'pending'
      }
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

    request.status = 'accepted';
<<<<<<< HEAD
    return request.save();
  }

  async rejectFriendRequest(userId: number, friendId: number) {
    const request = await this.friendshipsModel.findOne({
      where: {
        user_id: friendId,
        friend_id: userId,
        status: 'pending',
      },
=======
    await request.save();
    
    // Récupérer les informations de l'utilisateur qui accepte la demande
    const acceptingUser = await this.userModel.findByPk(userId);
    
    // Envoyer une notification en temps réel à l'expéditeur initial
    this.websocketGateway.notifyFriendRequestAccepted(request.user_id, acceptingUser);
    
    return request;
  }

  async rejectFriendRequest(userId: number, requestId: number): Promise<void> {
    const request = await this.friendshipsModel.findOne({
      where: {
        id: requestId,
        friend_id: userId,
        status: 'pending'
      }
>>>>>>> friendships
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

<<<<<<< HEAD
    request.status = 'rejected';
    return request.save();
  }

  async getFriends(userId: number) {
    const friendships = await this.friendshipsModel.findAll({
      where: {
        [Op.or]: [
          { user_id: userId, status: 'accepted' },
          { friend_id: userId, status: 'accepted' },
        ],
      },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url', 'status'],
        },
        {
          model: this.userModel,
          as: 'friend',
          attributes: ['id', 'username', 'avatar_url', 'status'],
        },
      ],
    });

    return friendships.map(friendship => {
      const friend = friendship.user_id === userId ? friendship.friend : friendship.user;
      return {
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatar_url,
        status: friend.status,
      };
    });
  }

  async getPendingRequests(userId: number) {
    return this.friendshipsModel.findAll({
      where: {
        friend_id: userId,
        status: 'pending',
      },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url'],
        },
      ],
    });
  }

  async removeFriend(userId: number, friendId: number) {
    return this.friendshipsModel.destroy({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
=======
    await request.destroy();
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const friendship = await this.friendshipsModel.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId }
        ],
        status: 'accepted'
      }
    });

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    await friendship.destroy();
  }

  async getFriends(userId: number): Promise<any[]> {
    const friendships = await this.friendshipsModel.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { friend_id: userId }
        ],
        status: 'accepted'
      }
    });

    const friendIds = friendships.map(friendship => 
      friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    );

    const friends = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: friendIds
        }
      },
      attributes: ['id', 'username', 'email']
    });

    return friends;
  }

  async getPendingRequests(userId: number): Promise<any[]> {
    const pendingRequests = await this.friendshipsModel.findAll({
      where: {
        friend_id: userId,
        status: 'pending'
      }
    });

    const senderIds = pendingRequests.map(request => request.user_id);
    const senders = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: senderIds
        }
      },
      attributes: ['id', 'username', 'email']
    });

    return pendingRequests.map(request => {
      const sender = senders.find(s => s.id === request.user_id);
      if (!sender) {
        return {
          id: request.id,
          sender: {
            id: request.user_id,
            username: 'Unknown User',
            email: 'unknown@example.com'
          },
          created_at: request.created_at
        };
      }
      return {
        id: request.id,
        sender: {
          id: sender.id,
          username: sender.username,
          email: sender.email
        },
        created_at: request.created_at
      };
>>>>>>> friendships
    });
  }
} 