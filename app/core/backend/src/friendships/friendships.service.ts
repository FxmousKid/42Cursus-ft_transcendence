import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Friendships } from './friendships.model';
import { User } from '../user/user.model';
import { Op } from 'sequelize';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectModel(Friendships)
    private readonly friendshipsModel: typeof Friendships,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async sendFriendRequest(userId: number, friendUsername: string): Promise<Friendships> {
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
    return this.friendshipsModel.create({
      user_id: userId,
      friend_id: friend.id,
      status: 'pending',
      created_at: new Date()
    });
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
    await request.save();
    
    return request;
  }

  async rejectFriendRequest(userId: number, requestId: number): Promise<void> {
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
    });
  }
} 