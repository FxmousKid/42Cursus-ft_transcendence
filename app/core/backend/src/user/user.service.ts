import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { Op } from 'sequelize';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  // Récupère tous les utilisateurs (pour la liste des utilisateurs)
  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      attributes: ['id', 'username', 'status', 'avatar_url'],
    });
  }

  // Récupère l'utilisateur actuel par ID
  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: ['id', 'username', 'email', 'status', 'avatar_url'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  // Récupère les utilisateurs en ligne
  async findOnlineUsers(): Promise<User[]> {
    return this.userModel.findAll({
      where: {
        status: {
          [Op.ne]: 'offline',
        },
      },
      attributes: ['id', 'username', 'status', 'avatar_url'],
    });
  }

  // Met à jour le statut d'un utilisateur
  async updateStatus(id: number, status: string): Promise<User> {
    const user = await this.userModel.findByPk(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    user.status = status;
    await user.save();
    
    return user;
  }
} 