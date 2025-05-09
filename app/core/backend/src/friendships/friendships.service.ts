import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Friendships } from './friendships.model';
import { User } from '../user/user.model';
import { Op } from 'sequelize';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectModel(Friendships)
    private friendshipsModel: typeof Friendships,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async sendFriendRequest(userId: number, friendId: number) {
    // Vérifier si une demande existe déjà
    const existingRequest = await this.friendshipsModel.findOne({
      where: {
        user_id: userId,
        friend_id: friendId,
      },
    });

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Créer la nouvelle demande d'ami
    return this.friendshipsModel.create({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
      created_at: new Date(),
    });
  }

  async acceptFriendRequest(userId: number, friendId: number) {
    const request = await this.friendshipsModel.findOne({
      where: {
        user_id: friendId,
        friend_id: userId,
        status: 'pending',
      },
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

    request.status = 'accepted';
    return request.save();
  }

  async rejectFriendRequest(userId: number, friendId: number) {
    const request = await this.friendshipsModel.findOne({
      where: {
        user_id: friendId,
        friend_id: userId,
        status: 'pending',
      },
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

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
    });
  }
} 