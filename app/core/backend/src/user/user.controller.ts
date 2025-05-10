import { Controller, Get, Param, Patch, Body, UseGuards, Request, HttpException, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.model';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Obtenir tous les utilisateurs (pour la liste des utilisateurs)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(): Promise<{ success: boolean; data: User[] }> {
    try {
      const users = await this.userService.findAll();
      return { success: true, data: users };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Obtenir les utilisateurs en ligne
  @UseGuards(JwtAuthGuard)
  @Get('online')
  async getOnlineUsers(): Promise<{ success: boolean; data: User[] }> {
    try {
      const users = await this.userService.findOnlineUsers();
      return { success: true, data: users };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Obtenir le profil de l'utilisateur actuel
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserProfile(@Request() req): Promise<{ success: boolean; data: User }> {
    try {
      const user = await this.userService.findById(req.user.userId);
      return { success: true, data: user };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Mettre à jour le statut d'un utilisateur
  @UseGuards(JwtAuthGuard)
  @Patch('status')
  async updateUserStatus(
    @Request() req,
    @Body('status') status: string,
  ): Promise<{ success: boolean; data: User }> {
    try {
      const user = await this.userService.updateStatus(req.user.userId, status);
      return { success: true, data: user };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 