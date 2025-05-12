import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { Op } from 'sequelize';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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

  // Met à jour le profil d'un utilisateur
  async updateProfile(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByPk(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Mettre à jour les champs si présents
    if (updateUserDto.username) {
      user.username = updateUserDto.username;
    }
    
    if (updateUserDto.email) {
      user.email = updateUserDto.email;
    }
    
    if (updateUserDto.password) {
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    
    await user.save();
    
    // Ne pas renvoyer le mot de passe
    const { password, ...result } = user.get({ plain: true });
    return result as User;
  }

  // Supprime un utilisateur par ID
  async deleteUser(id: number): Promise<void> {
    const user = await this.userModel.findByPk(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Utiliser une transaction pour assurer l'intégrité des données
    const sequelize = this.userModel.sequelize;
    const t = await sequelize.transaction();
    
    try {
      // 1. Supprimer les relations dans les différentes tables
      
      // Supprimer toutes les amitiés liées à cet utilisateur
      if (sequelize.models.Friendships) {
        await sequelize.models.Friendships.destroy({
          where: {
            [Op.or]: [{ user_id: id }, { friend_id: id }]
          },
          transaction: t
        });
      }
      
      // Anonymiser les matchs où l'utilisateur est impliqué
      if (sequelize.models.Matches) {
        // Anonymiser player1_id
        await sequelize.models.Matches.update(
          { player1_id: -1 },
          { 
            where: { player1_id: id },
            transaction: t
          }
        );
        
        // Anonymiser player2_id
        await sequelize.models.Matches.update(
          { player2_id: -1 },
          { 
            where: { player2_id: id },
            transaction: t
          }
        );
        
        // Anonymiser winner_id
        await sequelize.models.Matches.update(
          { winner_id: -1 },
          { 
            where: { winner_id: id },
            transaction: t
          }
        );
      }
      
      // Option alternative: supprimer les matchs
      // if (sequelize.models.Matches) {
      //   await sequelize.models.Matches.destroy({
      //     where: {
      //       [Op.or]: [
      //         { player1_id: id },
      //         { player2_id: id },
      //         { winner_id: id }
      //       ]
      //     },
      //     transaction: t
      //   });
      // }
      
      // Si vous avez une table de messages
      // if (sequelize.models.Messages) {
      //   await sequelize.models.Messages.destroy({
      //     where: {
      //       [Op.or]: [
      //         { sender_id: id },
      //         { receiver_id: id }
      //       ]
      //     },
      //     transaction: t
      //   });
      // }
      
      // 2. Supprimer l'utilisateur lui-même
      await user.destroy({ transaction: t });
      
      // Valider toutes les opérations
      await t.commit();
    } catch (error) {
      // En cas d'erreur, annuler toutes les opérations
      await t.rollback();
      throw error;
    }
  }
} 