import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('request/:friendId')
  async sendFriendRequest(
    @Param('friendId') friendId: number,
    @Body('userId') userId: number,
  ) {
    return this.friendshipsService.sendFriendRequest(userId, friendId);
  }

  @Post('accept/:friendId')
  async acceptFriendRequest(
    @Param('friendId') friendId: number,
    @Body('userId') userId: number,
  ) {
    return this.friendshipsService.acceptFriendRequest(userId, friendId);
  }

  @Post('reject/:friendId')
  async rejectFriendRequest(
    @Param('friendId') friendId: number,
    @Body('userId') userId: number,
  ) {
    return this.friendshipsService.rejectFriendRequest(userId, friendId);
  }

  @Get('list/:userId')
  async getFriends(@Param('userId') userId: number) {
    return this.friendshipsService.getFriends(userId);
  }

  @Get('pending/:userId')
  async getPendingRequests(@Param('userId') userId: number) {
    return this.friendshipsService.getPendingRequests(userId);
  }

  @Delete(':friendId')
  async removeFriend(
    @Param('friendId') friendId: number,
    @Body('userId') userId: number,
  ) {
    return this.friendshipsService.removeFriend(userId, friendId);
  }
} 