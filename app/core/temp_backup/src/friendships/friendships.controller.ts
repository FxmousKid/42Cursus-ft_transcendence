import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getFriends(@Request() req) {
    try {
      return { 
        success: true, 
        data: await this.friendshipsService.getFriends(req.user.userId) 
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests')
  async getPendingRequests(@Request() req) {
    try {
      return { 
        success: true, 
        data: await this.friendshipsService.getPendingRequests(req.user.userId) 
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async sendFriendRequest(@Request() req, @Body() body: { username: string }) {
    try {
      await this.friendshipsService.sendFriendRequest(req.user.userId, body.username);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept/:requestId')
  async acceptFriendRequest(@Request() req, @Param('requestId') requestId: number) {
    try {
      await this.friendshipsService.acceptFriendRequest(req.user.userId, requestId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reject/:requestId')
  async rejectFriendRequest(@Request() req, @Param('requestId') requestId: number) {
    try {
      await this.friendshipsService.rejectFriendRequest(req.user.userId, requestId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':friendId')
  async removeFriend(@Request() req, @Param('friendId') friendId: number) {
    try {
      await this.friendshipsService.removeFriend(req.user.userId, friendId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 