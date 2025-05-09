import { Controller, Get, Param, Put, Body, UseGuards, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    this.logger.log('Request to get all users');
    return this.userService.findAll();
  }

  @Get('online')
  async getOnlineUsers() {
    this.logger.log('Request to get online users');
    return this.userService.findOnlineUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    this.logger.log(`Request to get user with ID ${id}`);
    return this.userService.findById(id);
  }

  @Put(':id/status')
  async updateUserStatus(
    @Param('id') id: number,
    @Body('status') status: 'online' | 'offline' | 'in-game'
  ) {
    this.logger.log(`Request to update user ${id} status to ${status}`);
    return this.userService.updateStatus(id, status);
  }
} 