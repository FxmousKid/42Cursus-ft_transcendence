import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly sequelize: Sequelize
  ) {}

  async fixDatabaseConstraints(): Promise<void> {
    try {
      // Check if we need to fix any database constraints
      const queryInterface = this.sequelize.getQueryInterface();
      
      // If users_backup table exists, drop it
      await this.sequelize.query('DROP TABLE IF EXISTS users_backup');
      
      console.log('Database constraint fixes applied successfully');
    } catch (error) {
      console.error('Error fixing database constraints:', error);
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Fetching all users');
    try {
      const users = await this.userModel.findAll({
        attributes: ['id', 'username', 'email', 'avatar_url', 'status']
      });
      return users;
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  async findOnlineUsers() {
    this.logger.log('Fetching online users');
    try {
      const users = await this.userModel.findAll({
        where: {
          status: 'online'
        },
        attributes: ['id', 'username', 'email', 'avatar_url', 'status']
      });
      return users;
    } catch (error) {
      this.logger.error(`Error fetching online users: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(userId: number, status: 'online' | 'offline' | 'in-game') {
    this.logger.log(`Updating user ${userId} status to ${status}`);
    try {
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found`);
        return null;
      }
      
      user.status = status;
      await user.save();
      
      return user;
    } catch (error) {
      this.logger.error(`Error updating user status: ${error.message}`);
      throw error;
    }
  }

  async findById(userId: number) {
    try {
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'avatar_url', 'status']
      });
      return user;
    } catch (error) {
      this.logger.error(`Error finding user ${userId}: ${error.message}`);
      throw error;
    }
  }
} 